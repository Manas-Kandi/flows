# Parametric CAD Features Specification

Complete specification of parametric modeling features for Flows CAD platform with feature parity to Fusion 360 and SolidWorks.

## Document Organization

- **This Document**: Overview and core features
- **[Implementation Plan](./IMPLEMENTATION_PLAN.md)**: Detailed roadmap
- **[User Behaviors](./FEATURE_BEHAVIORS.md)**: Detailed UX specifications

---

## Feature Categories

### 1. 2D Sketch Tools

#### Drawing Tools
| Tool | Description | Priority | Complexity |
|------|-------------|----------|------------|
| **Line** | Point-to-point line creation with chaining | P0 | Low |
| **Rectangle** | 2-point rectangle (center or corner modes) | P0 | Low |
| **Circle** | Center-radius or 3-point circle | P0 | Low |
| **Arc** | 3-point, centerpoint, or tangent arc | P0 | Medium |
| **Polygon** | N-sided regular polygon | P1 | Low |
| **Ellipse** | Center with major/minor axes | P1 | Medium |
| **Spline** | NURBS/Bezier curve with control points | P1 | High |
| **Slot** | Straight or arc slot with width | P1 | Medium |
| **Point** | Construction point placement | P0 | Low |

#### Editing Tools
| Tool | Description | Priority | Complexity |
|------|-------------|----------|------------|
| **Trim** | Remove curve segments at intersections | P0 | Medium |
| **Extend** | Extend curve to boundary | P0 | Medium |
| **Offset** | Parallel curve at distance | P0 | High |
| **Mirror** | Reflect entities across line | P0 | Low |
| **Scale** | Resize with base point | P1 | Low |
| **Rotate** | Rotate about point | P1 | Low |
| **Array** | Linear/circular pattern in sketch | P1 | Medium |

#### Constraints
| Constraint | Description | Priority | DOF Removed |
|------------|-------------|----------|-------------|
| **Coincident** | Two points at same location | P0 | 2 |
| **Horizontal/Vertical** | Align with axis | P0 | 1 |
| **Parallel/Perpendicular** | Line angle relationship | P0 | 1 |
| **Tangent** | Smooth curve connection | P0 | 1 |
| **Equal** | Equal length/radius | P0 | 1 |
| **Concentric** | Shared center point | P0 | 2 |
| **Symmetric** | Mirror symmetry | P1 | 2 |
| **Fix** | Lock position/orientation | P0 | 2-3 |
| **Midpoint** | Point at line midpoint | P1 | 1 |

#### Dimensions
| Type | Description | Priority |
|------|-------------|----------|
| **Linear** | Distance between points/edges | P0 |
| **Radial** | Circle/arc radius | P0 |
| **Diametric** | Circle/arc diameter | P0 |
| **Angular** | Angle between lines | P0 |
| **Ordinate** | Dimension from datum | P1 |

---

### 2. 3D Modeling Features

#### Additive Features
| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Extrude** | Sweep profile along direction | P0 | Medium |
| **Revolve** | Rotate profile around axis | P0 | Medium |
| **Sweep** | Profile along path with guides | P1 | High |
| **Loft** | Blend between multiple profiles | P1 | High |
| **Rib** | Thin structural feature | P2 | Medium |

**Extrude Options**:
- Distance: Blind, Through All, To Next, To Surface
- Direction: One-sided, Symmetric, Two-sided
- Operation: New Body, Join, Cut, Intersect
- Advanced: Draft angle, offset start

#### Subtractive Features
| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Hole** | Parametric hole (simple/CB/CS/tapped) | P0 | Medium |
| **Cut Extrude** | Extrude with subtract operation | P0 | Medium |
| **Cut Revolve** | Revolve with subtract operation | P1 | Medium |
| **Cut Sweep/Loft** | Sweep/loft with subtract | P2 | High |

**Hole Types**:
- Simple: Straight hole
- Counterbore: Flat bottom enlarged section
- Countersink: Angled enlarged section
- Tapped: With thread specification

#### Modification Features
| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Fillet** | Rounded edge blend | P0 | High |
| **Chamfer** | Beveled edge | P0 | Medium |
| **Draft** | Tapered faces for molding | P1 | High |
| **Shell** | Hollow out with wall thickness | P1 | High |
| **Thicken** | Convert surface to solid | P2 | Medium |

**Fillet Options**:
- Constant radius
- Variable radius per edge
- Full round (3-face blend)
- Face fillet

#### Body Operations
| Operation | Description | Priority | Complexity |
|-----------|-------------|----------|------------|
| **Combine (Boolean)** | Union/subtract/intersect bodies | P0 | High |
| **Split Body** | Divide body with surface | P1 | Medium |
| **Mirror** | Reflect body across plane | P1 | Low |
| **Move/Copy** | Transform bodies | P1 | Low |

---

### 3. Pattern & Array Tools

| Pattern Type | Description | Priority | Complexity |
|--------------|-------------|----------|------------|
| **Linear** | Rectangular array with spacing | P0 | Low |
| **Circular** | Array around axis with angle | P0 | Low |
| **Pattern on Path** | Distribute along curve | P1 | Medium |
| **Mirror** | Symmetric copy across plane | P0 | Low |
| **Fill Pattern** | Fill region with seed pattern | P2 | High |
| **Table-Driven** | Pattern from coordinate table | P2 | Medium |

**Pattern Options**:
- Instance count and spacing
- Vary parameters per instance
- Suppress individual instances
- Direction reversal

---

### 4. Parameters & Equations

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **User Parameters** | Named variables with units | P0 | Medium |
| **Equations** | Math expressions referencing parameters | P0 | Medium |
| **Design Table** | Excel-driven configurations | P1 | High |
| **Conditional Statements** | If/then logic for parameters | P2 | High |

**Parameter System**:
```typescript
// Example usage
parameters: {
  width: { value: 100, unit: 'mm', expression: null },
  height: { value: 50, unit: 'mm', expression: 'width / 2' },
  depth: { value: 75, unit: 'mm', expression: 'width * 0.75' }
}
```

**Functions Supported**:
- Math: sin, cos, tan, sqrt, pow, abs, min, max
- Conditional: if, switch
- Unit conversion: automatic

---

### 5. Assembly Features

#### Component Management
| Feature | Description | Priority |
|---------|-------------|----------|
| **Insert Component** | Add part to assembly | P0 |
| **Component Array** | Pattern components | P1 |
| **Replace Component** | Swap with maintaining mates | P1 |
| **Mirror Assembly** | Create symmetric assembly | P2 |
| **Sub-Assembly** | Group components | P0 |

#### Mates & Joints
| Mate Type | DOF Removed | Priority | Complexity |
|-----------|-------------|----------|------------|
| **Coincident** | 3 (1 trans, 2 rot) | P0 | Low |
| **Concentric** | 2 (radial trans) | P0 | Low |
| **Distance** | 1 (distance constraint) | P0 | Low |
| **Angle** | 1 (angle constraint) | P1 | Low |
| **Parallel** | 2 (orientation) | P1 | Low |
| **Perpendicular** | 2 (orientation) | P1 | Low |
| **Tangent** | 1 (surface contact) | P1 | Medium |
| **Gear** | 1 (coupled rotation) | P2 | Medium |
| **Cam** | 1 (follower path) | P2 | High |
| **Slot** | 1 (constrained motion) | P2 | Medium |

**Assembly Solver**:
- Degrees of freedom calculation
- Mate conflict detection
- Over-constrained assembly warnings
- Redundant mate detection

#### Motion Analysis
| Feature | Description | Priority |
|---------|-------------|----------|
| **Kinematic Simulation** | Move components through motion | P1 |
| **Collision Detection** | Real-time interference checking | P1 |
| **Trace Path** | Record component motion path | P2 |
| **Motors & Forces** | Define actuators | P2 |
| **Animation Export** | Generate motion video | P2 |

---

### 6. Analysis Tools

| Tool | Description | Priority | Complexity |
|------|-------------|----------|------------|
| **Measure Distance** | Min distance between entities | P0 | Low |
| **Measure Angle** | Angle between planes/lines | P0 | Low |
| **Mass Properties** | Volume, CoM, inertia tensor | P0 | Medium |
| **Section View** | Clip model with plane | P0 | Low |
| **Interference Detection** | Find overlapping bodies | P1 | Medium |
| **Clearance Analysis** | Minimum gaps between parts | P1 | Medium |
| **Curvature Analysis** | Surface curvature visualization | P2 | High |
| **Draft Analysis** | Check draft angles for molding | P2 | Medium |
| **Undercut Detection** | Find non-moldable geometry | P2 | High |

---

## Priority Definitions

- **P0 (Critical)**: Required for MVP, blocks other features
- **P1 (High)**: Important for beta release, enhances usability
- **P2 (Medium)**: Nice-to-have, can be deferred
- **P3 (Low)**: Future enhancement, minimal usage

---

## Complexity Estimates

- **Low**: 1-2 weeks, straightforward implementation
- **Medium**: 3-4 weeks, moderate complexity
- **High**: 5-8 weeks, significant engineering effort
- **Very High**: 8+ weeks, research/R&D required

---

## Dependencies

### External Libraries Required

1. **Constraint Solver**
   - Option A: kiwi.js (Cassowary algorithm)
   - Option B: Custom Newton-Raphson solver
   - **Status**: NOT IMPLEMENTED

2. **Geometry Kernel** (CRITICAL)
   - Option A: Parasolid SDK (commercial, $$$)
   - Option B: Open CASCADE (open source, complex)
   - Option C: OpenCascade.js (WASM, limited)
   - **Status**: STUB ONLY

3. **Physics Engine** (for motion simulation)
   - Option: cannon.js or ammo.js
   - **Status**: NOT IMPLEMENTED

4. **Math Expression Parser**
   - Option: math.js
   - **Status**: NOT IMPLEMENTED

---

## See Also

- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Phased development roadmap
- [Feature Behaviors](./FEATURE_BEHAVIORS.md) - Detailed UX specifications
- [Geometry Kernel Integration](./GEOMETRY_KERNEL.md) - Kernel options and integration
- [Constraint Solving](./CONSTRAINT_SOLVER.md) - Solver algorithm details
