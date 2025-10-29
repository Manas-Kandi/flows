/**
 * Sketch Store - Manages 2D sketch state and operations
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import {
  ConstraintSolver,
  createEntityGeometry,
  updateEntityGeometry,
  calculateDOF as solverCalculateDOF,
  type Constraint as SolverConstraint,
} from '@flows/constraint-solver';
import type {
  Sketch,
  SketchEntity,
  SketchLine,
  SketchArc,
  Constraint,
  SketchToolType,
  SketchToolState,
  SnapSettings,
  SelectionState,
  Point2D,
  SnapTarget,
} from '../types/sketch';
import {
  rotate as rotatePoint,
  scale as scalePoint,
  translate,
  distance,
  closestPointOnLine,
  midpoint,
  linesIntersect,
  normalize,
  distanceToLine,
  angleBetweenLines,
  isHorizontal,
  isVertical,
  areParallel,
  arePerpendicular,
  lineLength,
  angle,
  pointOnArc,
  getPolygonVertices,
} from '../lib/sketch/geometry';

interface SketchHistoryEntry {
  entities: SketchEntity[];
  constraints: Constraint[];
}

interface SketchState {
  // Sketches
  sketches: Map<string, Sketch>;
  activeSketchId: string | null;
  
  // Tool state
  toolState: SketchToolState;
  
  // Selection
  selection: SelectionState;
  
  // Snap settings
  snapSettings: SnapSettings;
  
  // Grid
  gridSize: number;
  gridVisible: boolean;
  
  // Undo/Redo
  history: SketchHistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Diagnostics
  constraintDiagnostics: Map<string, { status: 'satisfied' | 'conflicting' | 'redundant' | 'inactive'; message?: string }>;
  constraintSolver: ConstraintSolver;
  degreesOfFreedom: number;
  
  // Actions - Sketch Management
  createSketch: (name: string) => string;
  deleteSketch: (id: string) => void;
  setActiveSketch: (id: string | null) => void;
  getActiveSketch: () => Sketch | null;
  renameSketch: (id: string, name: string) => void;
  toggleSketchVisibility: (id: string, visible?: boolean) => void;
  exitActiveSketch: () => void;
  
  // Actions - Entities
  addEntity: (entity: Omit<SketchEntity, 'id' | 'createdAt'>) => string;
  updateEntity: (id: string, updates: Partial<SketchEntity>) => void;
  deleteEntity: (id: string) => void;
  getEntity: (id: string) => SketchEntity | undefined;
  getAllEntities: () => SketchEntity[];
  toggleConstruction: (id: string, force?: boolean) => void;
  transformEntities: (ids: string[], transform: (point: Point2D) => Point2D) => void;
  trimEntity: (entityId: string, trimPoint: Point2D) => void;
  extendEntity: (entityId: string, targetPoint: Point2D) => void;
  offsetEntities: (ids: string[], distance: number) => void;
  mirrorEntities: (ids: string[], mirrorStart: Point2D, mirrorEnd: Point2D) => void;
  rotateEntities: (ids: string[], angle: number, origin: Point2D) => void;
  scaleEntities: (ids: string[], factor: number, origin: Point2D) => void;
  
  // Actions - Constraints
  addConstraint: (constraint: Omit<Constraint, 'id' | 'createdAt'>) => string;
  deleteConstraint: (id: string) => void;
  getConstraint: (id: string) => Constraint | undefined;
  getAllConstraints: () => Constraint[];
  updateConstraintStatus: (id: string, status: Constraint['status'], message?: string) => void;
  removeConstraintStatus: (id: string) => void;
  solveConstraints: () => void;
  
  // Actions - Tool State
  setActiveTool: (tool: SketchToolType) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  addDrawingPoint: (point: Point2D) => void;
  clearDrawingPoints: () => void;
  setPreviewEntity: (entity: SketchEntity | null) => void;
  setCursorPosition: (position: Point2D) => void;
  setSnapTarget: (target: SnapTarget | null) => void;
  
  // Actions - Selection
  selectEntity: (id: string, addToSelection?: boolean) => void;
  deselectEntity: (id: string) => void;
  clearSelection: () => void;
  selectMultiple: (ids: string[]) => void;
  setHovered: (id: string | null) => void;
  
  // Actions - Grid & Snap
  setGridSize: (size: number) => void;
  setGridVisible: (visible: boolean) => void;
  updateSnapSettings: (settings: Partial<SnapSettings>) => void;
  
  // Actions - Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: () => void;
  
  // Utility actions
  clearAll: () => void;
}

const DEFAULT_SNAP_SETTINGS: SnapSettings = {
  enabled: true,
  gridSnap: true,
  endpointSnap: true,
  midpointSnap: true,
  centerSnap: true,
  intersectionSnap: true,
  perpendicularSnap: true,
  tangentSnap: true,
  snapDistance: 10, // pixels
};

const DEFAULT_TOOL_STATE: SketchToolState = {
  activeTool: 'select',
  isDrawing: false,
  currentPoints: [],
  previewEntity: null,
  cursorPosition: { x: 0, y: 0 },
  snappedPosition: null,
  snapTarget: null,
};

const DEFAULT_SELECTION_STATE: SelectionState = {
  selectedIds: new Set(),
  hoveredId: null,
  selectionBox: null,
};

const cloneEntity = (entity: SketchEntity): SketchEntity =>
  JSON.parse(JSON.stringify(entity));

const cloneConstraint = (constraint: Constraint): Constraint =>
  JSON.parse(JSON.stringify(constraint));

const applyTransformToEntity = (
  entity: SketchEntity,
  transform: (point: Point2D) => Point2D
) => {
  switch (entity.type) {
    case 'line': {
      entity.start = transform(entity.start);
      entity.end = transform(entity.end);
      break;
    }
    case 'point': {
      entity.position = transform(entity.position);
      break;
    }
    case 'circle': {
      const originalCenter = entity.center;
      const probe = { x: originalCenter.x + entity.radius, y: originalCenter.y };
      const newCenter = transform(originalCenter);
      const transformedProbe = transform(probe);
      entity.center = newCenter;
      entity.radius = distance(newCenter, transformedProbe);
      break;
    }
    case 'arc': {
      const originalCenter = entity.center;
      const startPoint = {
        x: originalCenter.x + entity.radius * Math.cos(entity.startAngle),
        y: originalCenter.y + entity.radius * Math.sin(entity.startAngle),
      };
      const endPoint = {
        x: originalCenter.x + entity.radius * Math.cos(entity.endAngle),
        y: originalCenter.y + entity.radius * Math.sin(entity.endAngle),
      };
      const newCenter = transform(originalCenter);
      const transformedStart = transform(startPoint);
      const transformedEnd = transform(endPoint);
      entity.center = newCenter;
      entity.radius = distance(newCenter, transformedStart);
      entity.startAngle = Math.atan2(transformedStart.y - newCenter.y, transformedStart.x - newCenter.x);
      entity.endAngle = Math.atan2(transformedEnd.y - newCenter.y, transformedEnd.x - newCenter.x);
      break;
    }
    case 'rectangle': {
      const tl = transform(entity.topLeft);
      const br = transform(entity.bottomRight);
      entity.topLeft = {
        x: Math.min(tl.x, br.x),
        y: Math.max(tl.y, br.y),
      };
      entity.bottomRight = {
        x: Math.max(tl.x, br.x),
        y: Math.min(tl.y, br.y),
      };
      break;
    }
    case 'ellipse': {
      const center = entity.center;
      const majorPoint = {
        x: center.x + entity.majorAxis * Math.cos(entity.rotation),
        y: center.y + entity.majorAxis * Math.sin(entity.rotation),
      };
      const minorPoint = {
        x: center.x + entity.minorAxis * Math.cos(entity.rotation + Math.PI / 2),
        y: center.y + entity.minorAxis * Math.sin(entity.rotation + Math.PI / 2),
      };
      const newCenter = transform(center);
      const newMajorPoint = transform(majorPoint);
      const newMinorPoint = transform(minorPoint);
      entity.center = newCenter;
      entity.majorAxis = distance(newCenter, newMajorPoint);
      entity.minorAxis = distance(newCenter, newMinorPoint);
      entity.rotation = Math.atan2(newMajorPoint.y - newCenter.y, newMajorPoint.x - newCenter.x);
      break;
    }
    case 'polygon': {
      const center = transform(entity.center);
      const vertex = {
        x: entity.center.x + entity.radius * Math.cos(entity.rotation),
        y: entity.center.y + entity.radius * Math.sin(entity.rotation),
      };
      const transformedVertex = transform(vertex);
      entity.center = center;
      entity.radius = distance(center, transformedVertex);
      entity.rotation = Math.atan2(transformedVertex.y - center.y, transformedVertex.x - center.x);
      break;
    }
    case 'slot': {
      const newStart = transform(entity.start);
      const newEnd = transform(entity.end);
      const center = midpoint(entity.start, entity.end);
      const normalDir = normalize(entity.start, entity.end);
      const perpendicular = { x: -normalDir.y, y: normalDir.x };
      const widthProbe = {
        x: center.x + perpendicular.x * (entity.width / 2),
        y: center.y + perpendicular.y * (entity.width / 2),
      };
      const newCenter = midpoint(newStart, newEnd);
      const transformedProbe = transform(widthProbe);
      const newWidth = distance(newCenter, transformedProbe) * 2;
      entity.start = newStart;
      entity.end = newEnd;
      entity.width = newWidth;
      break;
    }
    case 'spline': {
      entity.controlPoints = entity.controlPoints.map(transform);
      break;
    }
    default:
      break;
  }
};

const getEntityPrimaryPoint = (entity: SketchEntity): Point2D => {
  switch (entity.type) {
    case 'line':
      return entity.start;
    case 'circle':
    case 'arc':
    case 'ellipse':
    case 'polygon':
      return 'center' in entity ? (entity as any).center : { x: 0, y: 0 };
    case 'rectangle':
      return midpoint(entity.topLeft, entity.bottomRight);
    case 'point':
      return entity.position;
    case 'slot':
      return midpoint(entity.start, entity.end);
    case 'spline':
      return entity.controlPoints[0] || { x: 0, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
};

const estimateEntityDOF = (entity: SketchEntity): number => {
  switch (entity.type) {
    case 'point':
      return 2;
    case 'line':
      return 4;
    case 'circle':
      return 3;
    case 'arc':
      return 5;
    case 'rectangle':
      return 4;
    case 'ellipse':
      return 5;
    case 'polygon':
      return 4;
    case 'slot':
      return 5;
    case 'spline':
      return Math.max(2, entity.controlPoints.length * 2);
    default:
      return 2;
  }
};

const estimateSketchDOF = (entities: Map<string, SketchEntity>, constraintCount: number): number => {
  let total = 0;
  entities.forEach((entity) => {
    total += estimateEntityDOF(entity);
  });
  return Math.max(0, total - constraintCount * 2);
};

const getPointFromEntity = (entity: SketchEntity, index = 0): Point2D => {
  switch (entity.type) {
    case 'line':
      return index === 1 ? entity.end : entity.start;
    case 'circle':
      return {
        x: entity.center.x + entity.radius,
        y: entity.center.y,
      };
    case 'arc':
      if (index === 1) {
        return pointOnArc(entity, entity.endAngle);
      }
      return pointOnArc(entity, entity.startAngle);
    case 'rectangle': {
      const corners = [
        entity.topLeft,
        { x: entity.bottomRight.x, y: entity.topLeft.y },
        entity.bottomRight,
        { x: entity.topLeft.x, y: entity.bottomRight.y },
      ];
      return corners[index % corners.length];
    }
    case 'point':
      return entity.position;
    case 'ellipse': {
      const angleOffset = index === 1 ? entity.rotation + Math.PI / 2 : entity.rotation;
      const axis = index === 1 ? entity.minorAxis : entity.majorAxis;
      return {
        x: entity.center.x + axis * Math.cos(angleOffset),
        y: entity.center.y + axis * Math.sin(angleOffset),
      };
    }
    case 'polygon': {
      const vertices = getPolygonVertices(entity);
      return vertices[index % vertices.length];
    }
    case 'slot':
      return index === 1 ? entity.end : entity.start;
    case 'spline':
      return entity.controlPoints[Math.min(index, entity.controlPoints.length - 1)];
    default:
      return getEntityPrimaryPoint(entity);
  }
};

const satisfied = (message?: string) => ({ status: 'satisfied' as const, message });
const conflicting = (message: string) => ({ status: 'conflicting' as const, message });
const inactive = (message: string) => ({ status: 'inactive' as const, message });

const evaluateConstraint = (constraint: Constraint, entities: Map<string, SketchEntity>) => {
  const tolerance = 1e-2;
  const getEntity = (id: string) => entities.get(id);
  const entityA = getEntity(constraint.entityIds[0]);
  if (!entityA) {
    return inactive('Entity reference missing');
  }
  const entityB = constraint.entityIds.length > 1 ? getEntity(constraint.entityIds[1]) : undefined;
  switch (constraint.type) {
    case 'coincident': {
      if (!entityB) return inactive('Second entity missing');
      const p1 = 'point1' in constraint && constraint.point1
        ? getPointFromEntity(getEntity(constraint.point1.entityId) || entityA, constraint.point1.pointIndex ?? 0)
        : getPointFromEntity(entityA);
      const p2 = 'point2' in constraint && constraint.point2
        ? getPointFromEntity(getEntity(constraint.point2.entityId) || entityB, constraint.point2.pointIndex ?? 0)
        : getPointFromEntity(entityB);
      return distance(p1, p2) <= tolerance
        ? satisfied()
        : conflicting('Points are not coincident');
    }
    case 'horizontal': {
      if (entityA.type !== 'line') return inactive('Horizontal requires a line');
      return isHorizontal(entityA) ? satisfied() : conflicting('Line is not horizontal');
    }
    case 'vertical': {
      if (entityA.type !== 'line') return inactive('Vertical requires a line');
      return isVertical(entityA) ? satisfied() : conflicting('Line is not vertical');
    }
    case 'parallel': {
      if (!entityB || entityA.type !== 'line' || entityB.type !== 'line') {
        return inactive('Parallel requires two lines');
      }
      return areParallel(entityA, entityB) ? satisfied() : conflicting('Lines are not parallel');
    }
    case 'perpendicular': {
      if (!entityB || entityA.type !== 'line' || entityB.type !== 'line') {
        return inactive('Perpendicular requires two lines');
      }
      return arePerpendicular(entityA, entityB) ? satisfied() : conflicting('Lines are not perpendicular');
    }
    case 'tangent': {
      if (!entityB) return inactive('Tangent requires second entity');
      const result = evaluateTangent(entityA, entityB, tolerance);
      return result;
    }
    case 'equal': {
      if (!entityB) return inactive('Equal requires two entities');
      if ('property' in constraint) {
        if (constraint.property === 'length' && entityA.type === 'line' && entityB.type === 'line') {
          const satisfiedLen = Math.abs(lineLength(entityA) - lineLength(entityB)) <= tolerance;
          return satisfiedLen ? satisfied() : conflicting('Line lengths differ');
        }
        if (constraint.property === 'radius' && 'radius' in entityA && 'radius' in entityB) {
          const satisfiedRad = Math.abs((entityA as any).radius - (entityB as any).radius) <= tolerance;
          return satisfiedRad ? satisfied() : conflicting('Radii differ');
        }
      }
      return inactive('Unsupported equal constraint');
    }
    case 'concentric': {
      if (!entityB) return inactive('Concentric requires two entities');
      const centerA = getEntityPrimaryPoint(entityA);
      const centerB = getEntityPrimaryPoint(entityB);
      return distance(centerA, centerB) <= tolerance ? satisfied() : conflicting('Centers not aligned');
    }
    case 'symmetric': {
      if (!entityB) return inactive('Symmetric requires two entities');
      const aboutId = 'aboutEntityId' in constraint ? constraint.aboutEntityId : constraint.entityIds[2];
      if (!aboutId) return inactive('Mirror reference missing');
      const aboutEntity = entities.get(aboutId);
      if (!aboutEntity || aboutEntity.type !== 'line') return inactive('Mirror must be a line');
      const midLine = aboutEntity;
      const p1 = getEntityPrimaryPoint(entityA);
      const p2 = getEntityPrimaryPoint(entityB);
      const midpointLine = midpoint(midLine.start, midLine.end);
      const vector = normalize(midLine.start, midLine.end);
      const normal = { x: -vector.y, y: vector.x };
      const d1 = (p1.x - midpointLine.x) * normal.x + (p1.y - midpointLine.y) * normal.y;
      const d2 = (p2.x - midpointLine.x) * normal.x + (p2.y - midpointLine.y) * normal.y;
      const along1 = (p1.x - midpointLine.x) * vector.x + (p1.y - midpointLine.y) * vector.y;
      const along2 = (p2.x - midpointLine.x) * vector.x + (p2.y - midpointLine.y) * vector.y;
      const mirrored = Math.abs(d1 + d2) <= tolerance && Math.abs(along1 - along2) <= tolerance;
      return mirrored ? satisfied() : conflicting('Entities not symmetric about reference');
    }
    case 'distance': {
      if (!entityB) return inactive('Distance requires two entities');
      const target = 'value' in constraint ? constraint.value : constraint.parameters?.value;
      if (typeof target !== 'number') return inactive('Distance value missing');
      const actual = distance(getEntityPrimaryPoint(entityA), getEntityPrimaryPoint(entityB));
      return Math.abs(actual - target) <= tolerance ? satisfied() : conflicting(`Distance ${actual.toFixed(2)} ≠ ${target}`);
    }
    case 'radius': {
      if (!('radius' in entityA) || typeof constraint.value !== 'number') {
        return inactive('Radius constraint requires circle/arc');
      }
      const actual = (entityA as any).radius;
      return Math.abs(actual - constraint.value) <= tolerance ? satisfied() : conflicting(`Radius ${actual.toFixed(2)} ≠ ${constraint.value}`);
    }
    case 'angle': {
      if (!entityB || entityA.type !== 'line' || entityB.type !== 'line' || typeof constraint.value !== 'number') {
        return inactive('Angle requires two lines and value');
      }
      const actual = Math.abs(angleBetweenLines(entityA, entityB));
      return Math.abs(actual - constraint.value) <= tolerance ? satisfied() : conflicting('Angle mismatch');
    }
    case 'fix':
      return satisfied();
    case 'midpoint': {
      if (!entityB) return inactive('Midpoint requires reference');
      const pointEntity = entityA.type === 'point' ? entityA : entityB?.type === 'point' ? entityB : null;
      const lineEntity = entityA.type === 'line' ? entityA : entityB?.type === 'line' ? entityB : null;
      if (!pointEntity || !lineEntity) return inactive('Midpoint requires point and line');
      const expected = midpoint(lineEntity.start, lineEntity.end);
      const actual = pointEntity.position;
      return distance(expected, actual) <= tolerance ? satisfied() : conflicting('Point not at line midpoint');
    }
    default:
      return satisfied();
  }
};

const evaluateTangent = (a: SketchEntity, b: SketchEntity, tolerance: number) => {
  const circleEntity = a.type === 'circle' || a.type === 'arc' ? a : b;
  const other = circleEntity === a ? b : a;
  if (!circleEntity || (circleEntity.type !== 'circle' && circleEntity.type !== 'arc')) {
    return inactive('Tangent requires circle/arc');
  }
  if (other.type === 'line') {
    const center = (circleEntity as any).center;
    const radius = (circleEntity as any).radius;
    const dist = distanceToLine(other, center);
    return Math.abs(dist - radius) <= tolerance ? satisfied() : conflicting('Line not tangent to circle');
  }
  if (other.type === 'circle' || other.type === 'arc') {
    const centerA = (circleEntity as any).center;
    const centerB = (other as any).center;
    const radiusA = (circleEntity as any).radius;
    const radiusB = (other as any).radius;
    const centerDistance = distance(centerA, centerB);
    const tangent = Math.abs(centerDistance - (radiusA + radiusB)) <= tolerance || Math.abs(centerDistance - Math.abs(radiusA - radiusB)) <= tolerance;
    return tangent ? satisfied() : conflicting('Circles not tangent');
  }
  return inactive('Unsupported tangent combination');
};

export const useSketchStore = create<SketchState>()(
  immer((set, get) => ({
    // Initial state
    sketches: new Map(),
    activeSketchId: null,
    toolState: DEFAULT_TOOL_STATE,
    selection: DEFAULT_SELECTION_STATE,
    snapSettings: DEFAULT_SNAP_SETTINGS,
    gridSize: 10,
    gridVisible: true,
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,
    constraintDiagnostics: new Map(),
    constraintSolver: new ConstraintSolver(),
    degreesOfFreedom: 0,
    
    // ========================================================================
    // Sketch Management
    // ========================================================================
    
    createSketch: (name: string) => {
      const id = nanoid();
      const sketch: Sketch = {
        id,
        name,
        plane: {
          origin: { x: 0, y: 0 },
          xAxis: { x: 1, y: 0 },
          yAxis: { x: 0, y: 1 },
          normal: { x: 0, y: 0 },
        },
        entities: new Map(),
        constraints: new Map(),
        isActive: true,
        isVisible: true,
        gridSize: get().gridSize,
        snapEnabled: true,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      };
      
      set((state) => {
        state.sketches.set(id, sketch);
        state.activeSketchId = id;
      });
      
      return id;
    },
    
    deleteSketch: (id: string) => {
      set((state) => {
        state.sketches.delete(id);
        if (state.activeSketchId === id) {
          state.activeSketchId = null;
        }
      });
    },
    
    setActiveSketch: (id: string | null) => {
      set((state) => {
        // Deactivate previous sketch
        if (state.activeSketchId) {
          const prevSketch = state.sketches.get(state.activeSketchId);
          if (prevSketch) {
            prevSketch.isActive = false;
          }
        }
        
        // Activate new sketch
        if (id) {
          const newSketch = state.sketches.get(id);
          if (newSketch) {
            newSketch.isActive = true;
          }
        }
        
        state.activeSketchId = id;
        state.selection = DEFAULT_SELECTION_STATE;
        state.toolState = DEFAULT_TOOL_STATE;
      });
    },
    
    getActiveSketch: () => {
      const { activeSketchId, sketches } = get();
      if (!activeSketchId) return null;
      return sketches.get(activeSketchId) || null;
    },
    
    renameSketch: (id: string, name: string) => {
      set((state) => {
        const sketch = state.sketches.get(id);
        if (sketch) {
          sketch.name = name;
          sketch.modifiedAt = Date.now();
        }
      });
    },
    
    toggleSketchVisibility: (id: string, visible) => {
      set((state) => {
        const sketch = state.sketches.get(id);
        if (sketch) {
          sketch.isVisible = typeof visible === 'boolean' ? visible : !sketch.isVisible;
          sketch.modifiedAt = Date.now();
        }
      });
    },
    
    exitActiveSketch: () => {
      set((state) => {
        state.activeSketchId = null;
        state.selection = DEFAULT_SELECTION_STATE;
        state.toolState = DEFAULT_TOOL_STATE;
      });
    },
    
    // ========================================================================
    // Entity Management
    // ========================================================================
    
    addEntity: (entityData) => {
      const { activeSketchId, sketches } = get();
      if (!activeSketchId) {
        console.warn('No active sketch');
        return '';
      }
      
      const id = nanoid();
      const entity: SketchEntity = {
        ...entityData,
        id,
        sketchId: activeSketchId,
        createdAt: Date.now(),
      } as SketchEntity;
      
      set((state) => {
        const sketch = state.sketches.get(activeSketchId);
        if (sketch) {
          sketch.entities.set(id, entity);
          sketch.modifiedAt = Date.now();
        }
      });
      
      get().pushHistory();
      return id;
    },
    
    updateEntity: (id: string, updates: Partial<SketchEntity>) => {
      const { activeSketchId, sketches } = get();
      if (!activeSketchId) return;
      
      set((state) => {
        const sketch = state.sketches.get(activeSketchId);
        if (sketch) {
          const entity = sketch.entities.get(id);
          if (entity) {
            Object.assign(entity, updates);
            sketch.modifiedAt = Date.now();
          }
        }
      });
      
      get().pushHistory();
    },
    
    deleteEntity: (id: string) => {
      const { activeSketchId, sketches } = get();
      if (!activeSketchId) return;
      
      set((state) => {
        const sketch = state.sketches.get(activeSketchId);
        if (sketch) {
          sketch.entities.delete(id);
          sketch.modifiedAt = Date.now();
          
          // Remove from selection if selected
          state.selection.selectedIds.delete(id);
          if (state.selection.hoveredId === id) {
            state.selection.hoveredId = null;
          }
        }
      });
      
      get().pushHistory();
    },
    
    getEntity: (id: string) => {
      const sketch = get().getActiveSketch();
      return sketch?.entities.get(id);
    },
    
    getAllEntities: () => {
      const sketch = get().getActiveSketch();
      return sketch ? Array.from(sketch.entities.values()) : [];
    },
    
    toggleConstruction: (id, force) => {
      const { activeSketchId } = get();
      if (!activeSketchId) return;
      
      set((state) => {
        const sketch = state.sketches.get(activeSketchId);
        if (!sketch) return;
        const entity = sketch.entities.get(id);
        if (!entity) return;
        const next = typeof force === 'boolean' ? force : !entity.isConstruction;
        entity.isConstruction = next;
        sketch.modifiedAt = Date.now();
      });
    },
    
    transformEntities: (ids, transform) => {
      const { activeSketchId } = get();
      if (!activeSketchId) return;
      
      set((state) => {
        const sketch = state.sketches.get(activeSketchId);
        if (!sketch) return;
        ids.forEach((id) => {
          const entity = sketch.entities.get(id);
          if (!entity) return;
          applyTransformToEntity(entity, transform);
        });
        sketch.modifiedAt = Date.now();
      });
      
      get().pushHistory();
    },
    
    trimEntity: (entityId, trimPoint) => {
      const entity = get().getEntity(entityId);
      if (!entity) return;
      
      switch (entity.type) {
        case 'line': {
          const line = entity as SketchLine;
          const startDist = distance(line.start, trimPoint);
          const endDist = distance(line.end, trimPoint);
          const newPoint = closestPointOnLine(line, trimPoint);
          get().updateEntity(entityId, startDist < endDist ? { start: newPoint } : { end: newPoint });
          break;
        }
        case 'arc': {
          const arc = entity as SketchArc;
          const angleAtPoint = Math.atan2(trimPoint.y - arc.center.y, trimPoint.x - arc.center.x);
          const startDiff = Math.abs(angleAtPoint - arc.startAngle);
          const endDiff = Math.abs(angleAtPoint - arc.endAngle);
          if (startDiff < endDiff) {
            get().updateEntity(entityId, { startAngle: angleAtPoint });
          } else {
            get().updateEntity(entityId, { endAngle: angleAtPoint });
          }
          break;
        }
        default:
          break;
      }
    },
    
    extendEntity: (entityId, targetPoint) => {
      const entity = get().getEntity(entityId);
      if (!entity) return;
      
      if (entity.type === 'line') {
        const line = entity as SketchLine;
        const lineDir = normalize(line.start, line.end);
        const startDist = distance(line.start, targetPoint);
        const endDist = distance(line.end, targetPoint);
        if (startDist < endDist) {
          const length = distance(line.end, targetPoint);
          const newStart = {
            x: line.end.x - lineDir.x * (distance(line.start, line.end) + length),
            y: line.end.y - lineDir.y * (distance(line.start, line.end) + length),
          };
          get().updateEntity(entityId, { start: newStart });
        } else {
          const newEnd = {
            x: line.start.x + lineDir.x * (distance(line.start, line.end) + distance(line.start, targetPoint)),
            y: line.start.y + lineDir.y * (distance(line.start, line.end) + distance(line.start, targetPoint)),
          };
          get().updateEntity(entityId, { end: newEnd });
        }
      }
    },
    
    offsetEntities: (ids, offsetDistance) => {
      const { activeSketchId } = get();
      if (!activeSketchId) return;
      
      set((state) => {
        const sketch = state.sketches.get(activeSketchId);
        if (!sketch) return;
        ids.forEach((id) => {
          const entity = sketch.entities.get(id);
          if (!entity) return;
          switch (entity.type) {
            case 'line': {
              const dir = normalize(entity.start, entity.end);
              const normal = { x: -dir.y, y: dir.x };
              entity.start = translate(entity.start, normal.x * offsetDistance, normal.y * offsetDistance);
              entity.end = translate(entity.end, normal.x * offsetDistance, normal.y * offsetDistance);
              break;
            }
            case 'circle': {
              entity.radius = Math.max(0.1, entity.radius + offsetDistance);
              break;
            }
            case 'arc': {
              entity.radius = Math.max(0.1, entity.radius + offsetDistance);
              break;
            }
            case 'slot': {
              entity.width = Math.max(0.1, entity.width + offsetDistance * 2);
              break;
            }
            case 'ellipse': {
              entity.majorAxis = Math.max(0.1, entity.majorAxis + offsetDistance);
              entity.minorAxis = Math.max(0.1, entity.minorAxis + offsetDistance);
              break;
            }
            default:
              break;
          }
        });
        sketch.modifiedAt = Date.now();
      });
      
      get().pushHistory();
    },
    
    mirrorEntities: (ids, mirrorStart, mirrorEnd) => {
      const dx = mirrorEnd.x - mirrorStart.x;
      const dy = mirrorEnd.y - mirrorStart.y;
      const lengthSquared = dx * dx + dy * dy || 1;
      
      const mirrorPoint = (point: Point2D): Point2D => {
        const t = ((point.x - mirrorStart.x) * dx + (point.y - mirrorStart.y) * dy) / lengthSquared;
        const projection = {
          x: mirrorStart.x + dx * t,
          y: mirrorStart.y + dy * t,
        };
        return {
          x: projection.x + (projection.x - point.x),
          y: projection.y + (projection.y - point.y),
        };
      };
      
      get().transformEntities(ids, mirrorPoint);
    },
    
    rotateEntities: (ids, angle, origin) => {
      const rotation = (point: Point2D): Point2D => rotatePoint(point, origin, angle);
      get().transformEntities(ids, rotation);
    },
    
    scaleEntities: (ids, factor, origin) => {
      const scaling = (point: Point2D): Point2D => scalePoint(point, origin, factor);
      get().transformEntities(ids, scaling);
    },
    
    // ========================================================================
    // Constraint Management
    // ========================================================================
    
    addConstraint: (constraintData) => {
      const { activeSketchId, sketches } = get();
      if (!activeSketchId) {
        console.warn('No active sketch');
        return '';
      }
      
      const id = nanoid();
      const constraint: Constraint = {
        ...constraintData,
        id,
        sketchId: activeSketchId,
        createdAt: Date.now(),
      } as Constraint;
      
      set((state) => {
        const sketch = state.sketches.get(activeSketchId);
        if (sketch) {
          sketch.constraints.set(id, constraint);
          sketch.modifiedAt = Date.now();
        }
      });
      
      return id;
    },
    
    deleteConstraint: (id: string) => {
      const { activeSketchId, sketches } = get();
      if (!activeSketchId) return;
      
      set((state) => {
        const sketch = state.sketches.get(activeSketchId);
        if (sketch) {
          sketch.constraints.delete(id);
          sketch.modifiedAt = Date.now();
        }
      });
    },
    
    getConstraint: (id: string) => {
      const sketch = get().getActiveSketch();
      return sketch?.constraints.get(id);
    },
    
    getAllConstraints: () => {
      const sketch = get().getActiveSketch();
      return sketch ? Array.from(sketch.constraints.values()) : [];
    },
    
    updateConstraintStatus: (id, status, message) => {
      set((state) => {
        state.constraintDiagnostics.set(id, { status: status || 'satisfied', message });
      });
    },
    
    removeConstraintStatus: (id) => {
      set((state) => {
        state.constraintDiagnostics.delete(id);
      });
    },
    
    solveConstraints: () => {
      const sketch = get().getActiveSketch();
      if (!sketch) return;
      const diagnostics = new Map<string, { status: 'satisfied' | 'conflicting' | 'redundant' | 'inactive'; message?: string }>();
      const entities = sketch.entities;
      sketch.constraints.forEach((constraint) => {
        const evaluation = evaluateConstraint(constraint, entities);
        diagnostics.set(constraint.id, evaluation);
      });
      set((state) => {
        const activeSketch = state.sketches.get(sketch.id);
        if (activeSketch) {
          diagnostics.forEach((diag, id) => {
            const targetConstraint = activeSketch.constraints.get(id);
            if (targetConstraint) {
              targetConstraint.status = diag.status;
              targetConstraint.message = diag.message;
            }
          });
        }
        state.constraintDiagnostics = diagnostics;
        state.degreesOfFreedom = estimateSketchDOF(entities, sketch.constraints.size);
      });
    },
    
    // ========================================================================
    // Tool State
    // ========================================================================
    
    setActiveTool: (tool: SketchToolType) => {
      set((state) => {
        state.toolState.activeTool = tool;
        state.toolState.isDrawing = false;
        state.toolState.currentPoints = [];
        state.toolState.previewEntity = null;
      });
    },
    
    setIsDrawing: (isDrawing: boolean) => {
      set((state) => {
        state.toolState.isDrawing = isDrawing;
      });
    },
    
    addDrawingPoint: (point: Point2D) => {
      set((state) => {
        state.toolState.currentPoints.push(point);
      });
    },
    
    clearDrawingPoints: () => {
      set((state) => {
        state.toolState.currentPoints = [];
      });
    },
    
    setPreviewEntity: (entity: SketchEntity | null) => {
      set((state) => {
        state.toolState.previewEntity = entity;
      });
    },
    
    setCursorPosition: (position: Point2D) => {
      set((state) => {
        state.toolState.cursorPosition = position;
      });
    },
    
    setSnapTarget: (target: SnapTarget | null) => {
      set((state) => {
        state.toolState.snapTarget = target;
        state.toolState.snappedPosition = target?.position || null;
      });
    },
    
    // ========================================================================
    // Selection
    // ========================================================================
    
    selectEntity: (id: string, addToSelection = false) => {
      set((state) => {
        if (!addToSelection) {
          // Clear previous selection
          state.selection.selectedIds.forEach((selectedId) => {
            const entity = get().getEntity(selectedId);
            if (entity) {
              get().updateEntity(selectedId, { isSelected: false });
            }
          });
          state.selection.selectedIds.clear();
        }
        
        state.selection.selectedIds.add(id);
        get().updateEntity(id, { isSelected: true });
      });
    },
    
    deselectEntity: (id: string) => {
      set((state) => {
        state.selection.selectedIds.delete(id);
      });
      get().updateEntity(id, { isSelected: false });
    },
    
    clearSelection: () => {
      const { selection } = get();
      selection.selectedIds.forEach((id) => {
        get().updateEntity(id, { isSelected: false });
      });
      
      set((state) => {
        state.selection.selectedIds.clear();
        state.selection.hoveredId = null;
      });
    },
    
    selectMultiple: (ids: string[]) => {
      get().clearSelection();
      ids.forEach((id) => {
        get().selectEntity(id, true);
      });
    },
    
    setHovered: (id: string | null) => {
      const prevHoveredId = get().selection.hoveredId;
      
      if (prevHoveredId && prevHoveredId !== id) {
        get().updateEntity(prevHoveredId, { isHighlighted: false });
      }
      
      if (id) {
        get().updateEntity(id, { isHighlighted: true });
      }
      
      set((state) => {
        state.selection.hoveredId = id;
      });
    },
    
    // ========================================================================
    // Grid & Snap
    // ========================================================================
    
    setGridSize: (size: number) => {
      set((state) => {
        state.gridSize = size;
      });
    },
    
    setGridVisible: (visible: boolean) => {
      set((state) => {
        state.gridVisible = visible;
      });
    },
    
    updateSnapSettings: (settings: Partial<SnapSettings>) => {
      set((state) => {
        Object.assign(state.snapSettings, settings);
      });
    },
    
    // ========================================================================
    // Undo/Redo
    // ========================================================================
    
    pushHistory: () => {
      const activeSketch = get().getActiveSketch();
      if (!activeSketch) return;
      
      const snapshot: SketchHistoryEntry = {
        entities: Array.from(activeSketch.entities.values()).map(cloneEntity),
        constraints: Array.from(activeSketch.constraints.values()).map(cloneConstraint),
      };
      
      set((state) => {
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(snapshot);
        
        if (state.history.length > state.maxHistorySize) {
          state.history.shift();
        }
        
        state.historyIndex = state.history.length - 1;
      });
    },
    
    undo: () => {
      const { history, historyIndex, activeSketchId, sketches } = get();
      
      if (historyIndex <= 0 || !activeSketchId) return;
      
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      
      set((state) => {
        const sketch = state.sketches.get(activeSketchId);
        if (sketch && previousState) {
          // Restore entities
          sketch.entities.clear();
          previousState.entities.forEach((entity) => {
            sketch.entities.set(entity.id, cloneEntity(entity));
          });
          
          // Restore constraints
          sketch.constraints.clear();
          previousState.constraints.forEach((constraint) => {
            sketch.constraints.set(constraint.id, cloneConstraint(constraint));
          });
          
          state.constraintDiagnostics.clear();
          
          sketch.modifiedAt = Date.now();
        }
        state.historyIndex = newIndex;
      });
    },
    
    redo: () => {
      const { history, historyIndex, activeSketchId } = get();
      
      if (historyIndex >= history.length - 1 || !activeSketchId) return;
      
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      
      set((state) => {
        const sketch = state.sketches.get(activeSketchId);
        if (sketch && nextState) {
          // Restore next entities
          sketch.entities.clear();
          nextState.entities.forEach((entity) => {
            sketch.entities.set(entity.id, cloneEntity(entity));
          });
          
          sketch.constraints.clear();
          nextState.constraints.forEach((constraint) => {
            sketch.constraints.set(constraint.id, cloneConstraint(constraint));
          });
          
          state.constraintDiagnostics.clear();
          
          sketch.modifiedAt = Date.now();
        }
        state.historyIndex = newIndex;
      });
    },
    
    canUndo: () => {
      return get().historyIndex > 0;
    },
    
    canRedo: () => {
      const { history, historyIndex } = get();
      return historyIndex < history.length - 1;
    },
    
    // ========================================================================
    // Utility
    // ========================================================================
    
    clearAll: () => {
      set((state) => {
        state.sketches.clear();
        state.activeSketchId = null;
        state.toolState = DEFAULT_TOOL_STATE;
        state.selection = DEFAULT_SELECTION_STATE;
        state.history = [];
        state.historyIndex = -1;
        state.constraintDiagnostics.clear();
        state.constraintSolver = new ConstraintSolver();
        state.degreesOfFreedom = 0;
      });
    },
  }))
);
