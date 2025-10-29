# 2D-3D Seamless Integration Architecture

## Vision

Create a unified design environment where 2D sketches and 3D models coexist seamlessly, similar to SolidWorks/Fusion 360, where:
- Sketches are created on 3D planes/faces
- 3D features reference and update with sketch changes
- Switching between sketch and 3D mode is instant
- All operations are parametric and history-based

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Flows CAD System                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐           ┌──────────────┐              │
│  │              │           │              │              │
│  │  2D Sketch   │◄─────────►│  3D Model    │              │
│  │    Engine    │  Seamless │    Engine    │              │
│  │              │  Sync     │              │              │
│  └──────┬───────┘           └───────┬──────┘              │
│         │                           │                      │
│         │   ┌───────────────────┐   │                      │
│         └───►  Unified Viewport  ◄───┘                      │
│             │   (Three.js)      │                          │
│             └────────┬──────────┘                          │
│                      │                                      │
│         ┌────────────┴─────────────┐                       │
│         │                          │                       │
│   ┌─────▼─────┐             ┌──────▼──────┐               │
│   │  Geometry │             │   Render    │               │
│   │   Kernel  │             │   Pipeline  │               │
│   └───────────┘             └─────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Unified Viewport System

**File**: `apps/web/src/components/viewport/UnifiedViewport.tsx`

```typescript
export interface UnifiedViewportProps {
  mode: 'sketch' | '3d' | 'hybrid';
  activeSketch?: Sketch;
  model: CADModel;
  onModeChange: (mode: string) => void;
}

export function UnifiedViewport({ mode, activeSketch, model }: UnifiedViewportProps) {
  // Single Three.js scene containing both 2D and 3D
  const scene = useScene();
  
  // Layers for organization
  const sketchLayer = 1;  // 2D sketch elements
  const modelLayer = 2;   // 3D solid geometry
  const planeLayer = 3;   // Sketch planes
  
  return (
    <Canvas>
      {/* 3D Model (always visible) */}
      <ModelRenderer model={model} layer={modelLayer} />
      
      {/* Active Sketch (when in sketch mode) */}
      {activeSketch && (
        <SketchRenderer 
          sketch={activeSketch} 
          layer={sketchLayer}
          plane={activeSketch.plane}
        />
      )}
      
      {/* Sketch Planes (when placing sketch) */}
      <PlaneSelector layer={planeLayer} />
      
      {/* Camera (adaptive for 2D/3D) */}
      <AdaptiveCamera mode={mode} />
      
      {/* Lighting (3D mode) */}
      {mode !== 'sketch' && <Lighting />}
    </Canvas>
  );
}
```

### 2. Sketch Plane System

**File**: `packages/cad-kernel/src/planes.ts`

```typescript
export interface SketchPlane {
  id: string;
  type: 'standard' | 'face' | 'offset';
  
  // Transform (position + orientation)
  origin: Vector3;      // [x, y, z]
  normal: Vector3;      // Unit vector
  xAxis: Vector3;       // Local X direction
  yAxis: Vector3;       // Local Y direction
  
  // Reference (for face-based planes)
  faceId?: string;
  offset?: number;      // mm offset from face
  
  // Display
  visible: boolean;
  size: number;         // Grid size
}

export const StandardPlanes = {
  XY: createPlane({ normal: [0, 0, 1], origin: [0, 0, 0] }),  // Top
  XZ: createPlane({ normal: [0, 1, 0], origin: [0, 0, 0] }),  // Front
  YZ: createPlane({ normal: [1, 0, 0], origin: [0, 0, 0] }),  // Right
};

// Convert 2D sketch coordinates to 3D world coordinates
export function sketchToWorld(
  point2D: Point2D,
  plane: SketchPlane
): Vector3 {
  const x = point2D.x * plane.xAxis;
  const y = point2D.y * plane.yAxis;
  return plane.origin + x + y;
}

// Convert 3D world coordinates to 2D sketch coordinates
export function worldToSketch(
  point3D: Vector3,
  plane: SketchPlane
): Point2D {
  const relative = point3D - plane.origin;
  return {
    x: relative.dot(plane.xAxis),
    y: relative.dot(plane.yAxis),
  };
}
```

### 3. Feature-Sketch Linking

**File**: `packages/cad-kernel/src/feature-sketch-link.ts`

```typescript
export interface FeatureSketchLink {
  featureId: string;
  sketchId: string;
  profileIds: string[];  // Which sketch entities are used
  
  // Bidirectional update
  onSketchChange: () => void;
  onFeatureRegenerate: () => void;
}

export class FeatureDependencyGraph {
  private links: Map<string, FeatureSketchLink[]> = new Map();
  
  // When sketch changes, update dependent features
  async onSketchModified(sketchId: string) {
    const dependentFeatures = this.links.get(sketchId) || [];
    
    for (const link of dependentFeatures) {
      await this.regenerateFeature(link.featureId);
    }
  }
  
  // Rebuild feature from sketch
  async regenerateFeature(featureId: string) {
    const feature = getFeature(featureId);
    const sketch = getSketch(feature.sketchId);
    
    // Extract profile geometry
    const profile = extractProfile(sketch, feature.profileIds);
    
    // Regenerate 3D geometry
    switch (feature.type) {
      case 'extrude':
        return extrudeProfile(profile, feature.parameters);
      case 'revolve':
        return revolveProfile(profile, feature.parameters);
      // ... other feature types
    }
  }
}
```

### 4. Mode Switching

**File**: `stores/viewportStore.ts`

```typescript
export interface ViewportState {
  mode: 'sketch' | '3d' | 'assembly';
  activeSketch: string | null;
  activePlane: SketchPlane | null;
  camera: CameraState;
}

export const useViewportStore = create<ViewportStore>((set, get) => ({
  mode: '3d',
  activeSketch: null,
  
  // Enter sketch mode
  enterSketchMode: async (planeId: string) => {
    const plane = getPlane(planeId);
    
    // Create new sketch on plane
    const sketch = createSketch({ plane });
    
    // Transition camera
    await transitionCameraToPlane(plane, 'top-down');
    
    set({ 
      mode: 'sketch',
      activeSketch: sketch.id,
      activePlane: plane,
    });
  },
  
  // Exit sketch mode
  exitSketchMode: async () => {
    const { activeSketch } = get();
    
    // Save sketch
    if (activeSketch) {
      await saveSketch(activeSketch);
    }
    
    // Transition camera to isometric
    await transitionCameraToIsometric();
    
    set({
      mode: '3d',
      activeSketch: null,
      activePlane: null,
    });
  },
  
  // Edit existing sketch
  editSketch: async (sketchId: string) => {
    const sketch = getSketch(sketchId);
    const plane = sketch.plane;
    
    await transitionCameraToPlane(plane, 'normal');
    
    set({
      mode: 'sketch',
      activeSketch: sketchId,
      activePlane: plane,
    });
  },
}));
```

---

## Data Flow

### Sketch Creation Flow

```
1. User clicks "New Sketch"
   ↓
2. System shows plane selector (Front, Top, Right, or pick face)
   ↓
3. User selects plane
   ↓
4. Camera transitions to normal view of plane
   ↓
5. Sketch mode activated
   ↓
6. User draws 2D geometry
   ↓
7. Constraint solver ensures sketch integrity
   ↓
8. User exits sketch
   ↓
9. Camera transitions to 3D view
   ↓
10. Sketch saved and available for features
```

### Feature Creation Flow

```
1. User has existing sketch
   ↓
2. User clicks "Extrude" (or other feature)
   ↓
3. System highlights sketch profiles
   ↓
4. User selects profile(s)
   ↓
5. Feature dialog opens
   ↓
6. User sets parameters (distance, direction, etc.)
   ↓
7. Live 3D preview shown (ghost geometry)
   ↓
8. User confirms
   ↓
9. Geometry kernel generates solid
   ↓
10. Feature added to history tree
   ↓
11. Model updates in viewport
```

### Parametric Update Flow

```
1. User modifies sketch dimension
   ↓
2. Constraint solver re-solves sketch
   ↓
3. Feature dependency graph identifies affected features
   ↓
4. Features regenerate in order
   ↓
5. 3D model updates
   ↓
6. Viewport re-renders
```

---

## Rendering System

### Layer Architecture

```typescript
export enum RenderLayer {
  GRID = 0,           // Background grid
  SKETCH = 1,         // 2D sketch geometry
  PLANES = 2,         // Sketch planes
  MODEL = 3,          // 3D solid geometry
  EDGES = 4,          // Edge lines
  HIDDEN_EDGES = 5,   // Dashed hidden lines
  DIMENSIONS = 6,     // Dimension annotations
  SELECTION = 7,      // Selection highlights
  HANDLES = 8,        // Edit handles
  UI = 9,             // UI overlays
}
```

### Hidden Line Rendering

**File**: `apps/web/src/rendering/HiddenLineRenderer.ts`

```typescript
export class HiddenLineRenderer {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  
  render() {
    // Pass 1: Render solid geometry to depth buffer
    this.renderSolids({ 
      colorWrite: false,  // Don't write color
      depthWrite: true,   // Write depth
    });
    
    // Pass 2: Render visible edges (solid)
    this.renderEdges({
      material: visibleEdgeMaterial,  // Black solid
      depthTest: true,
      depthFunc: LEQUAL,  // Pass if at or in front
    });
    
    // Pass 3: Render hidden edges (dashed)
    this.renderEdges({
      material: hiddenEdgeMaterial,   // Gray dashed
      depthTest: true,
      depthFunc: GREATER, // Pass if behind
    });
  }
}

const visibleEdgeMaterial = new THREE.LineBasicMaterial({
  color: 0x1E1E1E,    // Dark gray
  linewidth: 1,
});

const hiddenEdgeMaterial = new THREE.LineDashedMaterial({
  color: 0x808080,    // Medium gray
  linewidth: 1,
  dashSize: 4,
  gapSize: 2,
});
```

### Material System

```typescript
export const DefaultCADMaterial = {
  color: 0xC8C8C8,        // Light gray (200, 200, 200)
  metalness: 0.3,         // Slightly metallic
  roughness: 0.6,         // Matte finish
  envMapIntensity: 0.5,   // Subtle reflections
};

export function createCADMaterial(overrides?: Partial<MaterialProps>) {
  return new THREE.MeshStandardMaterial({
    ...DefaultCADMaterial,
    ...overrides,
  });
}
```

---

## Camera System

### Adaptive Camera

```typescript
export class AdaptiveCamera {
  private camera: THREE.OrthographicCamera | THREE.PerspectiveCamera;
  private mode: 'sketch' | '3d';
  
  // Switch to sketch mode (orthographic, top-down)
  switchToSketchMode(plane: SketchPlane) {
    this.camera = new THREE.OrthographicCamera(
      -width / 2, width / 2,
      height / 2, -height / 2,
      0.1, 1000
    );
    
    // Position camera normal to plane
    this.camera.position.copy(plane.origin);
    this.camera.position.add(plane.normal.multiplyScalar(100));
    this.camera.lookAt(plane.origin);
    this.camera.up.copy(plane.yAxis);
  }
  
  // Switch to 3D mode (perspective, isometric)
  switchTo3DMode() {
    this.camera = new THREE.PerspectiveCamera(
      50,  // FOV
      aspect,
      0.1,
      10000
    );
    
    // Isometric-like view
    const distance = 500;
    this.camera.position.set(distance, distance, distance);
    this.camera.lookAt(0, 0, 0);
  }
}
```

---

## State Management

### Unified State

```typescript
export interface CADState {
  // Model
  model: {
    parts: Map<string, Part>;
    assemblies: Map<string, Assembly>;
    activePart: string | null;
  };
  
  // Sketches
  sketches: Map<string, Sketch>;
  
  // Features
  features: Map<string, Feature>;
  featureTree: FeatureNode[];
  
  // Viewport
  viewport: {
    mode: 'sketch' | '3d' | 'assembly';
    activeSketch: string | null;
    activePlane: SketchPlane | null;
    camera: CameraState;
    selection: SelectionState;
  };
  
  // Rendering
  rendering: {
    style: 'shaded' | 'wireframe' | 'hidden-line';
    showEdges: boolean;
    showDimensions: boolean;
    showPlanes: boolean;
  };
}
```

---

## User Experience

### Workflow Example: Create Extruded Boss

1. **3D View** - User sees empty 3D space
2. **Click "Sketch" button** - Plane selector appears
3. **Select "Front Plane"** - Camera animates to front view
4. **Sketch Mode Activated** - Grid appears, 2D tools enabled
5. **Draw Rectangle** - 100mm × 50mm
6. **Add Constraints** - Horizontal, vertical, dimensions
7. **Click "Exit Sketch"** - Camera returns to isometric
8. **Select Sketch** - Sketch is highlighted
9. **Click "Extrude"** - Dialog opens
10. **Set Distance: 25mm** - Ghost preview appears
11. **Click OK** - Solid geometry created
12. **Feature in Tree** - "Extrude1" added to feature tree

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Rendering**
   - Only render visible features
   - LOD (Level of Detail) for distant objects
   - Frustum culling

2. **Incremental Updates**
   - Only regenerate changed features
   - Cache geometry when possible

3. **Web Workers**
   - Offload geometry calculations
   - Async feature regeneration

4. **Instancing**
   - Pattern features use instanced rendering
   - Shared geometry for identical components

---

## File Structure

```
apps/web/src/
├── components/
│   ├── viewport/
│   │   ├── UnifiedViewport.tsx          # Main viewport
│   │   ├── SketchRenderer.tsx           # 2D rendering
│   │   ├── ModelRenderer.tsx            # 3D rendering
│   │   ├── PlaneSelector.tsx            # Plane picking UI
│   │   └── AdaptiveCamera.tsx           # Camera controller
│   ├── sketch/
│   │   └── (existing sketch components)
│   └── model/
│       ├── FeatureTree.tsx              # Feature hierarchy
│       ├── ExtrudeDialog.tsx            # Extrude UI
│       ├── RevolveDialog.tsx            # Revolve UI
│       └── FilletDialog.tsx             # Fillet UI
├── rendering/
│   ├── HiddenLineRenderer.ts            # Hidden line viz
│   ├── MaterialSystem.ts                # Material library
│   └── LightingSetup.ts                 # 3-point lighting
└── stores/
    ├── modelStore.ts                     # 3D model state
    ├── viewportStore.ts                  # Viewport state
    └── featureStore.ts                   # Feature history

packages/cad-kernel/
├── src/
│   ├── planes.ts                         # Sketch planes
│   ├── features/
│   │   ├── extrude.ts
│   │   ├── revolve.ts
│   │   └── fillet.ts
│   ├── geometry/
│   │   ├── profile-extraction.ts         # Get sketch profiles
│   │   └── solid-operations.ts           # Boolean ops
│   └── dependency-graph.ts               # Feature dependencies
```

---

## Implementation Priority

### Phase 1 (Week 1-2): Foundation
1. ✅ Unified viewport with layers
2. ✅ Sketch plane system
3. ✅ 2D-3D coordinate conversion
4. ✅ Mode switching (sketch ↔ 3D)

### Phase 2 (Week 3-4): Basic Features
5. ✅ Profile extraction from sketches
6. ✅ Basic extrude feature
7. ✅ Feature tree UI
8. ✅ Hidden line rendering

### Phase 3 (Week 5-6): Parametric
9. ✅ Feature-sketch linking
10. ✅ Dependency graph
11. ✅ Parametric regeneration
12. ✅ Feature editing

---

**This architecture enables seamless 2D-3D integration while maintaining clean separation of concerns and enabling future scalability.**
