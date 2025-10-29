# Parametric Features Implementation Plan

Phased implementation roadmap for parametric CAD features mapped to existing Flows codebase.

---

## Overview

**Total Estimated Time**: 12-18 months to feature parity
**Team Size Assumed**: 3-5 engineers
**Critical Path**: Geometry kernel integration

---

## Phase 1: Sketch Foundation (Months 1-2)

**Goal**: Enable 2D sketch creation and constraint-based parametric sketching

### Month 1: Basic Sketch Tools

#### Week 1-2: Core Infrastructure
- [ ] **Sketch Canvas Component** (`apps/web/src/components/sketch/SketchCanvas.tsx`)
  - HTML5 Canvas overlay on Three.js viewport
  - Mouse input handling (click, drag, move)
  - Coordinate transformation (screen ↔ sketch plane)
  - Grid rendering and snap-to-grid
  
- [ ] **Sketch Entities**
  - Line tool with polyline mode
  - Circle (center-radius mode)
  - Rectangle (2-point mode)
  - Arc (3-point mode)
  - Entity selection and highlighting
  
- [ ] **Store Integration**
  - Enhance `modelStore.ts`:
    ```typescript
    interface SketchState {
      activeSketch: string | null;
      sketches: Map<string, Sketch>;
      entities: Map<string, SketchEntity>;
      constraints: Map<string, Constraint>;
    }
    
    addEntity(entity: SketchEntity): void;
    updateEntity(id: string, updates: Partial<SketchEntity>): void;
    deleteEntity(id: string): void;
    ```

**Deliverables**:
- Working sketch canvas with basic tools
- Entity creation and selection
- Undo/redo for sketch operations

**LOC Estimate**: ~2,000 lines
**Dependencies**: None (use existing Three.js setup)

---

#### Week 3-4: Constraint Solver Integration

- [ ] **Choose Constraint Solver Library**
  - **Recommended**: kiwi.js (TypeScript port of Cassowary)
  - Alternative: Custom Newton-Raphson solver
  - Install: `pnpm add kiwi.js @types/kiwi` (if available)
  
- [ ] **Constraint System** (`packages/constraint-solver/`)
  - Create shared package for solver logic
  - Constraint representation:
    ```typescript
    interface Constraint {
      id: string;
      type: 'coincident' | 'distance' | 'parallel' | ...;
      entities: string[]; // Entity IDs
      parameters: Record<string, number>;
      strength?: 'required' | 'strong' | 'medium' | 'weak';
    }
    ```
  
- [ ] **Geometric Constraints**
  - Coincident (2 points same location)
  - Horizontal/Vertical (line angle = 0°/90°)
  - Parallel/Perpendicular (angle between lines)
  - Fix (lock entity position)
  
- [ ] **Dimensional Constraints**
  - Distance (linear dimension)
  - Radius/Diameter (circle/arc)
  - Angle (between lines)
  
- [ ] **Solver Integration**
  - Build constraint system from sketch entities
  - Solve on: entity creation, drag, constraint add
  - Handle solve failures gracefully
  - Degrees of freedom (DOF) display

- [ ] **Constraint UI**
  - Constraint palette toolbar
  - Dimension input dialogs
  - Constraint visualization (symbols, dimension lines)
  - Auto-constraints on entity creation

**Deliverables**:
- Working constraint solver
- Basic constraints functional
- Dimensional constraints drive geometry

**LOC Estimate**: ~3,500 lines
**Dependencies**: kiwi.js or similar
**Challenge**: This is the HARDEST part of sketching

---

### Month 2: Advanced Sketch Tools

#### Week 5-6: Additional Entities & Editing

- [ ] **Additional Entities**
  - Ellipse (center + major/minor)
  - Polygon (N-sided)
  - Spline (NURBS with control points)
  - Slot (straight and arc)
  - Point (construction)
  
- [ ] **Editing Tools**
  - Trim: Split curves at intersections
  - Extend: Extend curve to boundary
  - Offset: Parallel curve generation
  - Mirror: Reflect across line
  - Rotate: Rotate entities about point
  - Scale: Resize with base point
  
- [ ] **Smart Snapping**
  - Snap to: endpoints, midpoints, centers, intersections
  - Snap indicators (visual feedback)
  - Snap tolerance settings

**Deliverables**:
- Complete sketch toolset
- Robust editing capabilities

**LOC Estimate**: ~2,000 lines

---

#### Week 7-8: Sketch Refinement & Testing

- [ ] **Advanced Constraints**
  - Tangent constraint (smooth curves)
  - Equal (length/radius)
  - Concentric (shared centers)
  - Symmetric (mirror pairs)
  - Midpoint
  
- [ ] **Constraint Workflow**
  - Constraint conflict detection
  - Over-constrained warning
  - Under-constrained indication (DOF display)
  - Constraint deletion
  
- [ ] **Sketch Management**
  - Create sketch on plane/face
  - Edit existing sketch
  - Exit sketch mode
  - Sketch visibility toggle
  
- [ ] **Performance Optimization**
  - Incremental constraint solving
  - Spatial indexing for snap detection
  - Canvas rendering optimization

**Deliverables**:
- Production-ready sketching system
- Comprehensive test suite

**LOC Estimate**: ~1,500 lines
**Testing**: Unit tests for constraint solver, integration tests for UI

---

## Phase 2: Core 3D Features (Months 3-5)

**Goal**: Enable basic 3D model creation (extrude, revolve, fillet, chamfer)

### Month 3: Geometry Kernel Integration

#### Week 9-10: Kernel Selection & Setup

**CRITICAL DECISION POINT**

- [ ] **Evaluate Geometry Kernels**
  1. **Parasolid** (Siemens)
     - Pros: Industry standard, robust, excellent API
     - Cons: Commercial license ($$$), closed source
     - Integration: C++ SDK → CGO wrapper → Go service
  
  2. **Open CASCADE** (OCCT)
     - Pros: Open source, comprehensive
     - Cons: Steep learning curve, C++ complexity
     - Integration: C++ → CGO or opencascade.js (WASM)
  
  3. **OpenCascade.js** (WASM)
     - Pros: Browser-native, no server needed
     - Cons: Limited features, performance concerns, large binary
     - Integration: Direct TypeScript usage
  
  **Recommendation**: Start with OpenCascade.js for rapid prototyping, migrate to Parasolid for production
  
- [ ] **Initial Integration** (OpenCascade.js path)
  - Install: `pnpm add opencascade.js`
  - Create wrapper layer: `packages/cad-kernel/`
  - Abstract kernel operations behind interface:
    ```typescript
    interface IGeometryKernel {
      extrude(profile: Wire, distance: number): Solid;
      revolve(profile: Wire, axis: Axis, angle: number): Solid;
      fillet(solid: Solid, edges: Edge[], radius: number): Solid;
      boolean(op: 'union'|'subtract'|'intersect', solids: Solid[]): Solid;
      tessellate(solid: Solid, tolerance: number): Mesh;
    }
    ```

**Deliverables**:
- Kernel wrapper package
- Basic operations (extrude, revolve)
- Tessellation for rendering

**LOC Estimate**: ~1,000 lines (wrapper)
**Dependencies**: opencascade.js
**Timeline**: 2 weeks

---

#### Week 11-12: Extrude Feature

- [ ] **Extrude Implementation**
  - **UI Dialog** (`apps/web/src/components/model/ExtrudeDialog.tsx`)
    - Profile selection (from active sketch)
    - Distance input with units
    - Direction: One-sided, Symmetric, Two-sided
    - Operation: New Body, Join, Cut, Intersect
    - Preview mode (ghost rendering)
  
  - **Geometry Service** (`services/geometry/features/extrude.go`)
    - Endpoint: `POST /api/v1/feature/extrude`
    - Call kernel wrapper
    - Return tessellated mesh
  
  - **Feature Storage**
    - Store in `modelStore.features`
    - Feature parameters for regeneration
    ```typescript
    interface ExtrudeFeature {
      type: 'extrude';
      id: string;
      sketchId: string;
      profileIds: string[];
      distance: number;
      direction: 'one' | 'symmetric' | 'two';
      distance2?: number; // For two-sided
      operation: 'new' | 'join' | 'cut' | 'intersect';
      draft?: number; // Draft angle
    }
    ```
  
  - **Rendering**
    - Convert tessellation to Three.js geometry
    - Add to viewport scene
    - Material assignment

**Deliverables**:
- Functional extrude feature
- Full parametric (can edit and regenerate)
- Boolean operations working

**LOC Estimate**: ~1,500 lines
**Timeline**: 2 weeks

---

### Month 4: Additional Features & Modifications

#### Week 13-14: Revolve & Hole Features

- [ ] **Revolve Feature**
  - Similar to extrude, different geometry operation
  - Axis selection (from sketch line)
  - Angle parameter (0-360°)
  - Same operation types (new, join, cut)
  
- [ ] **Hole Feature**
  - **Types**: Simple, Counterbore, Countersink, Tapped
  - **UI**: Hole wizard dialog
  - **Placement**: Click on face, creates sketch point
  - **Parameters**: Diameters, depths, thread specs
  - **Implementation**: Specialized extrude + cut operation

**Deliverables**:
- Revolve and Hole features functional

**LOC Estimate**: ~1,200 lines
**Timeline**: 2 weeks

---

#### Week 15-16: Fillet & Chamfer

- [ ] **Fillet Feature**
  - Edge selection (multi-select)
  - Radius parameter (constant or variable)
  - Preview with edge highlighting
  - Geometry kernel fillet operation
  - Error handling (fillet failures common)
  
- [ ] **Chamfer Feature**
  - Edge selection
  - Distance or Distance1/Distance2 or Angle/Distance modes
  - Simpler than fillet (planar faces)

**Deliverables**:
- Working fillet and chamfer

**LOC Estimate**: ~800 lines
**Timeline**: 2 weeks
**Challenge**: Fillets can fail on complex geometry - need robust error handling

---

### Month 5: Feature Management System

#### Week 17-18: Feature Tree & Regeneration

- [ ] **Feature Tree UI** (`apps/web/src/components/model/FeatureTree.tsx`)
  - Hierarchical display of all features
  - Icons for feature types
  - Expand/collapse groups
  - Right-click context menu
  
- [ ] **Feature Operations**
  - Edit: Re-open dialog, modify parameters
  - Suppress: Skip during regeneration
  - Delete: Remove feature (check dependencies)
  - Reorder: Drag to change evaluation order
  
- [ ] **Regeneration Engine**
  - Build dependency graph
  - Topological sort for evaluation order
  - Regenerate affected features on parameter change
  - Handle failures gracefully:
    ```typescript
    interface RegenerationResult {
      success: boolean;
      failedFeature?: string;
      error?: string;
      partialGeometry?: Mesh; // Show last good state
    }
    ```
  
- [ ] **Undo/Redo for Features**
  - Command pattern for feature operations
  - History stack management

**Deliverables**:
- Complete feature management system
- Robust regeneration

**LOC Estimate**: ~2,000 lines
**Timeline**: 2 weeks

---

#### Week 19-20: Parameters System

- [ ] **User Parameters** (`apps/web/src/stores/parametersStore.ts`)
  - Create/edit/delete parameters
  - Name, value, unit, expression
  - Parameter table UI
  
- [ ] **Expression Evaluation**
  - Integrate math.js: `pnpm add mathjs`
  - Parse expressions
  - Build dependency graph
  - Detect circular references
  - Auto-update on dependency change
  
- [ ] **Dimension Linking**
  - Link sketch dimensions to parameters
  - Link feature parameters to user parameters
  - Expression syntax: `=parameterName * 2 + 10mm`
  
- [ ] **Units System**
  - Support: mm, cm, m, in, ft
  - Automatic conversion
  - Display preferences

**Deliverables**:
- Working parameter system
- Expressions drive geometry

**LOC Estimate**: ~1,500 lines
**Dependencies**: mathjs
**Timeline**: 2 weeks

---

## Phase 3: Advanced Features (Months 6-8)

### Month 6: Sweep, Loft, Shell, Draft

- [ ] **Sweep Feature** (Week 21-22)
  - Profile + path selection
  - Guide rails (optional)
  - Twist and scale options
  - Complex geometry kernel operation
  
- [ ] **Loft Feature** (Week 23-24)
  - Multiple profile selection
  - Guide rails
  - Closed loft option
  - Tangency conditions

- [ ] **Shell Feature** (Week 25-26)
  - Face removal selection
  - Wall thickness parameter
  - Variable thickness per face
  
- [ ] **Draft Feature** (Week 27-28)
  - Face selection
  - Pull direction
  - Draft angle
  - Neutral plane

**LOC Estimate**: ~3,000 lines
**Timeline**: 2 months
**Complexity**: HIGH - advanced kernel operations

---

### Month 7-8: Patterns & Boolean Operations

- [ ] **Linear Pattern** (Week 29-30)
  - Feature/body selection
  - Direction vector
  - Count and spacing
  - UI with preview
  
- [ ] **Circular Pattern** (Week 31-32)
  - Rotation axis selection
  - Count and angle
  - Full 360° option
  
- [ ] **Mirror Feature** (Week 33-34)
  - Mirror plane selection
  - Feature/body mirroring
  - Parametric link option
  
- [ ] **Boolean Operations** (Week 35-36)
  - Combine (Union)
  - Subtract (Cut)
  - Intersect (Common)
  - Multi-body support

**LOC Estimate**: ~2,000 lines
**Timeline**: 2 months

---

## Phase 4: Assembly Features (Months 9-11)

### Month 9-10: Assembly Foundation

- [ ] **Component System** (Week 37-40)
  - Load components from files
  - Component instances
  - Component tree UI
  - Transform components (move, rotate)
  
- [ ] **Mate System** (Week 41-44)
  - Coincident mate
  - Concentric mate
  - Distance mate
  - Angle mate
  - Parallel/perpendicular
  - Tangent mate
  
- [ ] **Assembly Solver**
  - DOF calculation
  - Constraint satisfaction
  - Over-constrained detection
  - Mate conflict resolution

**LOC Estimate**: ~4,000 lines
**Timeline**: 2 months
**Complexity**: HIGH - complex constraint solving

---

### Month 11: Motion & Analysis

- [ ] **Motion Simulation** (Week 45-48)
  - Integrate physics engine (cannon.js)
  - Motors and forces
  - Animate motion
  - Trace paths
  
- [ ] **Assembly Analysis**
  - Interference detection
  - Clearance analysis
  - Exploded view
  - Bill of materials (BOM)

**LOC Estimate**: ~2,500 lines
**Dependencies**: cannon.js or ammo.js
**Timeline**: 1 month

---

## Phase 5: Analysis & Export (Month 12)

- [ ] **Measurement Tools** (Week 49-50)
  - Distance, angle, area, volume
  - Mass properties calculation
  - Center of mass, inertia
  
- [ ] **Section Analysis** (Week 51)
  - Section plane UI
  - Clipping plane rendering
  - Cross-hatch display
  
- [ ] **Export Formats** (Week 52)
  - STEP export (geometry kernel)
  - IGES export
  - STL export for 3D printing
  - OBJ, FBX for rendering

**LOC Estimate**: ~1,500 lines
**Timeline**: 1 month

---

## Resource Allocation

### Engineering Team

**Recommended Team**:
1. **Senior CAD Engineer** (Lead) - Geometry kernel, features
2. **Frontend Engineer** - UI components, viewport
3. **Backend Engineer** - Services, APIs
4. **QA Engineer** - Testing, validation
5. **DevOps** (Part-time) - Infrastructure, deployment

### Technology Investments

| Item | Cost | Priority |
|------|------|----------|
| **Parasolid License** | $15k-50k/year | P0 (if not using OCCT) |
| **CAD Testing Suite** | $10k-30k | P1 |
| **CI/CD Infrastructure** | $500-2k/month | P0 |
| **Design Tools (Figma, etc)** | $500/month | P1 |

---

## Success Metrics

### Technical Metrics
- **Feature Count**: 50+ parametric features
- **Performance**: <100ms sketch solve, <2s feature regeneration
- **Reliability**: <1% feature failure rate
- **Test Coverage**: >80% code coverage

### User Metrics
- **Learning Curve**: Users productive in <2 hours
- **Feature Usage**: 80% of features used monthly
- **Export Success**: >95% successful exports

---

## Risk Mitigation

### Critical Risks

1. **Geometry Kernel Performance**
   - **Risk**: OCCT too slow, Parasolid too expensive
   - **Mitigation**: Benchmark early, hybrid approach (OCCT for simple, Parasolid for complex)

2. **Constraint Solver Stability**
   - **Risk**: Solver fails on complex sketches
   - **Mitigation**: Extensive testing, fallback to direct manipulation

3. **Feature Regeneration Cascades**
   - **Risk**: Changes cause long rebuild times
   - **Mitigation**: Incremental regeneration, caching, parallel evaluation

4. **Browser Performance**
   - **Risk**: Large assemblies cause slowdown
   - **Mitigation**: LOD, culling, Web Workers, WASM

---

## Dependencies Summary

| Package/Library | Purpose | Priority |
|-----------------|---------|----------|
| **kiwi.js** | Constraint solver | P0 |
| **opencascade.js** or **Parasolid** | Geometry kernel | P0 |
| **mathjs** | Expression evaluation | P0 |
| **cannon.js** | Physics simulation | P1 |
| **three.js** | 3D rendering | P0 (already have) |
| **zustand** | State management | P0 (already have) |

---

## Next Steps

1. **Week 1**: Kick off Phase 1, start sketch canvas
2. **Week 2**: Begin constraint solver evaluation
3. **Week 4**: Evaluate geometry kernels, make decision
4. **Month 2**: Have working sketch system
5. **Month 3**: First 3D feature (extrude)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-29  
**Owner**: Engineering Team
