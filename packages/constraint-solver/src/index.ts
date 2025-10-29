/**
 * Constraint solver package exports
 */

export { ConstraintSolver } from './solver';
export { SolverDiagnostics } from './diagnostics';
export type { 
  Constraint, 
  ConstraintSystem, 
  EntityGeometry, 
  SolverResult, 
  SolverVariable,
  Point2D,
  ConstraintType,
  ConstraintStrength 
} from './types';
export type { DiagnosticResult, SolverFailure } from './diagnostics';
export { createEntityGeometry, updateEntityGeometry, calculateDOF } from './geometry';
