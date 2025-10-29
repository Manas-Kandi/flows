// Core CAD Types
export type WorkspaceMode = 'model' | 'assembly' | 'document' | 'review' | 'render' | 'manage';

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

// Sketch Types
export type SketchEntityType = 'line' | 'arc' | 'circle' | 'spline' | 'rectangle' | 'polygon';
export type ConstraintType = 
  | 'coincident' 
  | 'parallel' 
  | 'perpendicular' 
  | 'tangent' 
  | 'horizontal' 
  | 'vertical'
  | 'distance'
  | 'angle'
  | 'equal';

export interface SketchEntity {
  id: string;
  type: SketchEntityType;
  points: Point2D[];
  constraints: string[]; // IDs of constraints
  isConstruction: boolean;
  selected: boolean;
}

export interface Constraint {
  id: string;
  type: ConstraintType;
  entities: string[]; // IDs of entities involved
  value?: number; // For dimensional constraints
  satisfied: boolean;
}

export interface Sketch {
  id: string;
  name: string;
  entities: SketchEntity[];
  constraints: Constraint[];
  plane: 'XY' | 'XZ' | 'YZ' | string; // Can be custom plane
}

// Feature Types
export type FeatureType = 
  | 'extrude' 
  | 'revolve' 
  | 'loft' 
  | 'sweep' 
  | 'fillet' 
  | 'chamfer' 
  | 'shell'
  | 'pattern-linear'
  | 'pattern-circular';

export interface Feature {
  id: string;
  name: string;
  type: FeatureType;
  sketchId?: string;
  parameters: Record<string, any>;
  suppressed: boolean;
  failed: boolean;
  parentId?: string;
}

// Part & Assembly Types
export interface Part {
  id: string;
  name: string;
  sketches: Sketch[];
  features: Feature[];
  parameters: Parameter[];
  material?: Material;
  mass?: number;
  volume?: number;
}

export interface Parameter {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  expression?: string;
  dependencies: string[]; // IDs of other parameters
}

export interface Material {
  id: string;
  name: string;
  density: number;
  color: string;
  properties: Record<string, any>;
}

export interface AssemblyComponent {
  id: string;
  partId: string;
  name: string;
  transform: {
    position: Vector3D;
    rotation: Vector3D;
    scale: Vector3D;
  };
  mates: Mate[];
  suppressed: boolean;
  children?: AssemblyComponent[];
}

export type MateType = 'planar' | 'concentric' | 'coincident' | 'distance' | 'angle' | 'slider';

export interface Mate {
  id: string;
  type: MateType;
  entities: string[]; // References to component faces/edges
  value?: number;
  locked: boolean;
}

export interface Assembly {
  id: string;
  name: string;
  components: AssemblyComponent[];
  bom?: BOMItem[];
}

export interface BOMItem {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  material?: string;
  supplier?: string;
}

// Project & Collaboration Types
export interface Project {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  currentBranch: string;
  branches: Branch[];
  createdAt: string;
  updatedAt: string;
  owner: User;
  collaborators: User[];
}

export interface Branch {
  id: string;
  name: string;
  parentBranchId?: string;
  createdAt: string;
  createdBy: User;
  commits: Commit[];
  mergeRequests: MergeRequest[];
}

export interface Commit {
  id: string;
  message: string;
  author: User;
  timestamp: string;
  changes: Change[];
}

export interface Change {
  type: 'add' | 'modify' | 'delete';
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
}

export interface MergeRequest {
  id: string;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  author: User;
  reviewers: User[];
  status: 'open' | 'approved' | 'rejected' | 'merged';
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  resolved: boolean;
  attachments?: Attachment[];
  position?: {
    entityId: string;
    location: Point3D;
  };
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'online' | 'away' | 'offline';
}

// Review & Document Types
export interface Review {
  id: string;
  projectId: string;
  title: string;
  description: string;
  checklist: ChecklistItem[];
  participants: User[];
  status: 'in-progress' | 'completed';
  startedAt: string;
  completedAt?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  assignee?: User;
}

export interface Drawing {
  id: string;
  name: string;
  template: string;
  views: DrawingView[];
  dimensions: Dimension[];
  annotations: Annotation[];
  titleBlock: TitleBlock;
}

export interface DrawingView {
  id: string;
  type: 'orthographic' | 'section' | 'detail' | 'isometric' | 'auxiliary';
  partId: string;
  scale: number;
  position: Point2D;
}

export interface Dimension {
  id: string;
  type: 'linear' | 'angular' | 'radial' | 'diametric';
  value: number;
  tolerance?: {
    upper: number;
    lower: number;
  };
  position: Point2D;
}

export interface Annotation {
  id: string;
  type: 'note' | 'datum' | 'gdt' | 'surface-finish';
  content: string;
  position: Point2D;
  leaderPoints?: Point2D[];
}

export interface TitleBlock {
  title: string;
  partNumber: string;
  revision: string;
  drawnBy: string;
  checkedBy?: string;
  approvedBy?: string;
  date: string;
  company: string;
}

// Viewport & UI Types
export interface ViewportState {
  camera: {
    position: Vector3D;
    target: Vector3D;
    zoom: number;
  };
  projection: 'perspective' | 'orthographic';
  view: 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right' | 'iso' | 'custom';
  showGrid: boolean;
  showAxes: boolean;
  showDimensions: boolean;
}

export interface SelectionState {
  selectedEntities: string[];
  hoveredEntity?: string;
  selectionFilter: 'all' | 'faces' | 'edges' | 'vertices' | 'sketches' | 'features';
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  shortcut?: string;
  category: string;
  action: () => void;
}
