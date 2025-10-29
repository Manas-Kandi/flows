/**
 * Constraint solver types
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Constraint {
  id: string;
  type: ConstraintType;
  entityIds: string[];
  parameters: Record<string, number>;
  strength?: ConstraintStrength;
}

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
  | 'fix'
  | 'midpoint'
  | 'distance'
  | 'radius'
  | 'diameter'
  | 'angle';

export type ConstraintStrength = 'required' | 'strong' | 'medium' | 'weak';

export interface SolverVariable {
  id: string;
  value: number;
  isFixed?: boolean;
}

export interface SolverResult {
  success: boolean;
  variables: Map<string, number>;
  error?: string;
  iterations: number;
}

export interface EntityGeometry {
  id: string;
  type: 'line' | 'circle' | 'arc' | 'point' | 'ellipse' | 'slot' | 'polygon' | 'spline';
  variables: Map<string, SolverVariable>;
}

export interface ConstraintSystem {
  entities: Map<string, EntityGeometry>;
  constraints: Constraint[];
  variables: Map<string, SolverVariable>;
}
