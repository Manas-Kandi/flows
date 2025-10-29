/**
 * Core CAD Kernel Types
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Vector3 {}

/**
 * Sketch Plane Definition
 */
export interface SketchPlane {
  id: string;
  type: 'standard' | 'face' | 'offset';
  
  // Transform (position + orientation in 3D space)
  origin: Vector3;
  normal: Vector3;      // Unit vector perpendicular to plane
  xAxis: Vector3;       // Local X direction (unit vector)
  yAxis: Vector3;       // Local Y direction (unit vector)
  
  // Reference (for face-based or offset planes)
  faceId?: string;
  offset?: number;      // Offset distance in mm
  
  // Display properties
  visible: boolean;
  size: number;         // Grid size for visualization
  name?: string;
}

/**
 * Standard plane names
 */
export type StandardPlaneName = 'XY' | 'XZ' | 'YZ' | 'Front' | 'Top' | 'Right';

/**
 * Feature Types
 */
export type FeatureType = 
  | 'extrude' 
  | 'revolve' 
  | 'loft' 
  | 'sweep' 
  | 'fillet' 
  | 'chamfer' 
  | 'hole'
  | 'shell'
  | 'pattern-linear'
  | 'pattern-circular'
  | 'mirror';

/**
 * Base Feature Interface
 */
export interface Feature {
  id: string;
  name: string;
  type: FeatureType;
  sketchId?: string;
  parameters: Record<string, any>;
  suppressed: boolean;
  failed: boolean;
  parentId?: string;
  children?: string[];
  timestamp: number;
}

/**
 * Extrude Feature Parameters
 */
export interface ExtrudeParameters {
  distance: number;
  direction: 'normal' | 'reverse' | 'symmetric';
  operation: 'new' | 'join' | 'cut' | 'intersect';
  endType: 'blind' | 'through-all' | 'up-to-surface';
  draft?: number;       // Draft angle in degrees
  thinFeature?: {
    enabled: boolean;
    thickness: number;
    direction: 'one-side' | 'both-sides';
  };
}

/**
 * Revolve Feature Parameters
 */
export interface RevolveParameters {
  axis: {
    origin: Point3D;
    direction: Vector3;
  };
  angle: number;        // Degrees (0-360)
  operation: 'new' | 'join' | 'cut' | 'intersect';
  thinFeature?: {
    enabled: boolean;
    thickness: number;
  };
}

/**
 * Fillet Feature Parameters
 */
export interface FilletParameters {
  edgeIds: string[];
  radius: number;
  type: 'constant' | 'variable';
  variableRadii?: Array<{ position: number; radius: number }>;
}

/**
 * Profile extracted from sketch
 */
export interface Profile {
  id: string;
  entityIds: string[];  // Sketch entities forming closed loop
  isInner: boolean;     // Inner profile (hole) vs outer profile
  area: number;
  centroid: Point2D;
  vertices: Point2D[];  // Ordered vertices of profile
}

/**
 * Feature-Sketch Link for dependency tracking
 */
export interface FeatureSketchLink {
  featureId: string;
  sketchId: string;
  profileIds: string[];
  entityIds: string[];  // Specific sketch entities used
}

/**
 * Solid Geometry (result of features)
 */
export interface SolidGeometry {
  id: string;
  vertices: Point3D[];
  faces: Face[];
  edges: Edge[];
  volume?: number;
  surfaceArea?: number;
  centerOfMass?: Point3D;
}

export interface Face {
  id: string;
  vertexIndices: number[];
  normal: Vector3;
  area: number;
}

export interface Edge {
  id: string;
  startVertex: number;
  endVertex: number;
  faceIds: string[];    // Adjacent faces
  type: 'line' | 'arc' | 'spline';
}
