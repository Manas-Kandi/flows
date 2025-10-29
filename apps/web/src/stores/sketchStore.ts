/**
 * Sketch Store - Manages 2D sketch state and operations
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type {
  Sketch,
  SketchEntity,
  Constraint,
  SketchToolType,
  SketchToolState,
  SnapSettings,
  SelectionState,
  Point2D,
  SnapTarget,
} from '../types/sketch';

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
  history: SketchEntity[][];
  historyIndex: number;
  maxHistorySize: number;
  
  // Actions - Sketch Management
  createSketch: (name: string) => string;
  deleteSketch: (id: string) => void;
  setActiveSketch: (id: string | null) => void;
  getActiveSketch: () => Sketch | null;
  
  // Actions - Entities
  addEntity: (entity: Omit<SketchEntity, 'id' | 'createdAt'>) => string;
  updateEntity: (id: string, updates: Partial<SketchEntity>) => void;
  deleteEntity: (id: string) => void;
  getEntity: (id: string) => SketchEntity | undefined;
  getAllEntities: () => SketchEntity[];
  
  // Actions - Constraints
  addConstraint: (constraint: Omit<Constraint, 'id' | 'createdAt'>) => string;
  deleteConstraint: (id: string) => void;
  getConstraint: (id: string) => Constraint | undefined;
  getAllConstraints: () => Constraint[];
  
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
      const { history, historyIndex, maxHistorySize } = get();
      const entities = get().getAllEntities();
      
      set((state) => {
        // Remove any history after current index (for redo branches)
        state.history = state.history.slice(0, state.historyIndex + 1);
        
        // Add current state
        state.history.push([...entities]);
        
        // Limit history size
        if (state.history.length > maxHistorySize) {
          state.history.shift();
        } else {
          state.historyIndex++;
        }
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
          // Restore previous entities
          sketch.entities.clear();
          previousState.forEach((entity) => {
            sketch.entities.set(entity.id, { ...entity });
          });
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
          nextState.forEach((entity) => {
            sketch.entities.set(entity.id, { ...entity });
          });
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
      });
    },
  }))
);
