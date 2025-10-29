/**
 * Sketch-specific types for 2D parametric sketching
 */

import { Point2D, Vector2D } from './cad';

export type { Point2D };

// ============================================================================
// Sketch Entity Types
// ============================================================================

export type SketchEntityType = 
  | 'line' 
  | 'circle' 
  | 'arc' 
  | 'rectangle' 
  | 'point'
  | 'ellipse'
  | 'spline'
  | 'polygon'
  | 'slot';

export interface BaseSketchEntity {
  id: string;
  type: SketchEntityType;
  sketchId: string;
  isConstruction: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  createdAt: number;
  layer?: string;
}

export interface SketchLine extends BaseSketchEntity {
  type: 'line';
  start: Point2D;
  end: Point2D;
}

export interface SketchCircle extends BaseSketchEntity {
  type: 'circle';
  center: Point2D;
  radius: number;
}

export interface SketchArc extends BaseSketchEntity {
  type: 'arc';
  center: Point2D;
  radius: number;
  startAngle: number; // Radians
  endAngle: number; // Radians
}

export interface SketchRectangle extends BaseSketchEntity {
  type: 'rectangle';
  topLeft: Point2D;
  bottomRight: Point2D;
  filletRadius?: number;
}

export interface SketchPoint extends BaseSketchEntity {
  type: 'point';
  position: Point2D;
}

export interface SketchEllipse extends BaseSketchEntity {
  type: 'ellipse';
  center: Point2D;
  majorAxis: number;
  minorAxis: number;
  rotation: number; // Radians
}

export interface SketchSpline extends BaseSketchEntity {
  type: 'spline';
  controlPoints: Point2D[];
  degree: number;
  isClosed: boolean;
}

export interface SketchPolygon extends BaseSketchEntity {
  type: 'polygon';
  center: Point2D;
  radius: number;
  sides: number;
  rotation: number;
}

export interface SketchSlot extends BaseSketchEntity {
  type: 'slot';
  start: Point2D;
  end: Point2D;
  width: number;
}

export type SketchEntity = 
  | SketchLine 
  | SketchCircle 
  | SketchArc 
  | SketchRectangle 
  | SketchPoint
  | SketchEllipse
  | SketchSpline
  | SketchPolygon
  | SketchSlot;

// ============================================================================
// Constraint Types
// ============================================================================

export type ConstraintType =
  | 'coincident'
  | 'horizontal'
  | 'vertical'
  | 'parallel'
  | 'perpendicular'
  | 'tangent'
  | 'equal'
  | 'concentric'
  | 'symmetric'
  | 'distance'
  | 'radius'
  | 'angle'
  | 'fix'
  | 'midpoint'
  | 'diameter';

export interface BaseConstraint {
  id: string;
  type: ConstraintType;
  sketchId: string;
  entityIds: string[];
  isActive: boolean;
  isDriving: boolean; // Driving vs reference dimension
  createdAt: number;
}

export interface CoincidentConstraint extends BaseConstraint {
  type: 'coincident';
  point1: { entityId: string; pointIndex?: number };
  point2: { entityId: string; pointIndex?: number };
}

export interface HorizontalConstraint extends BaseConstraint {
  type: 'horizontal';
  lineId: string;
}

export interface VerticalConstraint extends BaseConstraint {
  type: 'vertical';
  lineId: string;
}

export interface ParallelConstraint extends BaseConstraint {
  type: 'parallel';
  line1Id: string;
  line2Id: string;
}

export interface PerpendicularConstraint extends BaseConstraint {
  type: 'perpendicular';
  line1Id: string;
  line2Id: string;
}

export interface TangentConstraint extends BaseConstraint {
  type: 'tangent';
  entity1Id: string;
  entity2Id: string;
}

export interface EqualConstraint extends BaseConstraint {
  type: 'equal';
  entity1Id: string;
  entity2Id: string;
  property: 'length' | 'radius';
}

export interface DistanceConstraint extends BaseConstraint {
  type: 'distance';
  entity1Id: string;
  entity2Id: string;
  value: number;
  displayValue?: string; // For parametric display
}

export interface RadiusConstraint extends BaseConstraint {
  type: 'radius';
  circleId: string;
  value: number;
}

export interface AngleConstraint extends BaseConstraint {
  type: 'angle';
  line1Id: string;
  line2Id: string;
  value: number; // Radians
}

export type Constraint = 
  | CoincidentConstraint
  | HorizontalConstraint
  | VerticalConstraint
  | ParallelConstraint
  | PerpendicularConstraint
  | TangentConstraint
  | EqualConstraint
  | DistanceConstraint
  | RadiusConstraint
  | AngleConstraint;

// ============================================================================
// Sketch Definition
// ============================================================================

export interface SketchPlane {
  origin: Point2D;
  xAxis: Vector2D;
  yAxis: Vector2D;
  normal: Vector2D;
}

export interface Sketch {
  id: string;
  name: string;
  plane: SketchPlane;
  entities: Map<string, SketchEntity>;
  constraints: Map<string, Constraint>;
  isActive: boolean;
  isVisible: boolean;
  gridSize: number;
  snapEnabled: boolean;
  createdAt: number;
  modifiedAt: number;
}

// ============================================================================
// Sketch Tools
// ============================================================================

export type SketchToolType = 
  | 'select'
  | 'line'
  | 'circle'
  | 'arc'
  | 'rectangle'
  | 'point'
  | 'ellipse'
  | 'spline'
  | 'polygon'
  | 'slot'
  | 'trim'
  | 'extend'
  | 'offset'
  | 'mirror'
  | 'rotate'
  | 'scale'
  | 'dimension';

export interface SketchToolState {
  activeTool: SketchToolType;
  isDrawing: boolean;
  currentPoints: Point2D[];
  previewEntity: SketchEntity | null;
  cursorPosition: Point2D;
  snappedPosition: Point2D | null;
  snapTarget: SnapTarget | null;
}

// ============================================================================
// Snap System
// ============================================================================

export type SnapType = 
  | 'grid'
  | 'endpoint'
  | 'midpoint'
  | 'center'
  | 'intersection'
  | 'perpendicular'
  | 'tangent'
  | 'nearest';

export interface SnapTarget {
  type: SnapType;
  position: Point2D;
  entityId?: string;
  distance: number;
}

export interface SnapSettings {
  enabled: boolean;
  gridSnap: boolean;
  endpointSnap: boolean;
  midpointSnap: boolean;
  centerSnap: boolean;
  intersectionSnap: boolean;
  perpendicularSnap: boolean;
  tangentSnap: boolean;
  snapDistance: number; // In pixels
}

// ============================================================================
// Input Handling
// ============================================================================

export interface MouseState {
  position: Point2D;
  screenPosition: Point2D;
  isDown: boolean;
  button: number;
  isDragging: boolean;
  dragStart: Point2D | null;
}

export interface KeyboardState {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
}

// ============================================================================
// Drawing State
// ============================================================================

export interface DrawingState {
  mode: 'idle' | 'placing-first-point' | 'placing-second-point' | 'dragging' | 'complete';
  points: Point2D[];
  tempEntity: SketchEntity | null;
  measurements: {
    length?: number;
    angle?: number;
    radius?: number;
    width?: number;
    height?: number;
  };
}

// ============================================================================
// Selection
// ============================================================================

export interface SelectionBox {
  start: Point2D;
  end: Point2D;
  isActive: boolean;
}

export interface SelectionState {
  selectedIds: Set<string>;
  hoveredId: string | null;
  selectionBox: SelectionBox | null;
}

// ============================================================================
// Utilities
// ============================================================================

export interface BoundingBox {
  min: Point2D;
  max: Point2D;
}

export interface EntityProperties {
  id: string;
  type: SketchEntityType;
  length?: number;
  area?: number;
  perimeter?: number;
  radius?: number;
  angle?: number;
}
