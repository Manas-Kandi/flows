/**
 * CAD Kernel - Public API
 * Core geometric and parametric modeling functionality
 */

// Types
export * from './types';

// Planes
export {
  createPlane,
  StandardPlanes,
  getStandardPlane,
  sketchToWorld,
  worldToSketch,
  createOffsetPlane,
  isPointOnPlane,
  projectPointOnPlane,
  normalizeVector,
  dot,
  cross,
  add,
  subtract,
  scale,
} from './planes';

// Profile Extraction
export {
  extractProfiles,
  type SketchEntity as ProfileSketchEntity,
} from './profile-extraction';

// Features
export {
  extrudeProfile,
  validateExtrudeParameters,
  createDefaultExtrudeParameters,
} from './features/extrude';

// Dependency Graph
export {
  FeatureDependencyGraph,
  type DependencyNode,
} from './dependency-graph';
