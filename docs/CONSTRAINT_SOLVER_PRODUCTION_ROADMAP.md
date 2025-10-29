# Constraint Solver Production Roadmap

## Executive Summary

The basic constraint solver has been **successfully implemented** (16,960+ LOC) with 15 constraint types and kiwi.js integration. However, **critical production gaps** remain that must be addressed before this can be considered production-ready.

**Status**: 🟡 **Beta Quality** - Works for basic use cases, needs hardening

---

## ✅ What's Working (DONE)

### Core Solver Infrastructure
- ✅ **Kiwi.js Integration** - Cassowary constraint algorithm
- ✅ **15 Constraint Types**
  - Geometric: Coincident, Horizontal, Vertical, Parallel, Perpendicular, Tangent, Equal, Concentric, Fix, Midpoint
  - Dimensional: Distance, Radius, Diameter, Angle, Equal
- ✅ **Entity Geometry Mapping** - Convert sketch entities to solver variables
- ✅ **DOF Calculation** - Degrees of freedom tracking
- ✅ **Constraint Visualization** - Visual symbols for all constraint types
- ✅ **Constraint Toolbar** - UI for applying constraints
- ✅ **Auto-Solving** - Automatic solving on changes

**Lines of Code**: ~16,960
**Test Coverage**: 0% ⚠️

---

## 🔴 CRITICAL GAPS (Must Fix for Production)

### 1. Testing Infrastructure (P0 - 3 days)

**Problem**: Zero test coverage makes the system fragile and prone to regressions.

**What's Missing**:
```typescript
// No tests exist for:
- Individual constraint solvers
- Edge cases (over-constrained, conflicting, degenerate)
- Performance benchmarks
- Integration tests
- Regression tests
```

**Required Tests**:
```typescript
// packages/constraint-solver/__tests__/solver.test.ts
describe('ConstraintSolver', () => {
  describe('Coincident Constraint', () => {
    test('should merge two points to same location');
    test('should handle coincident on same entity (no-op)');
    test('should work with constrained points');
  });
  
  describe('Distance Constraint', () => {
    test('should maintain fixed distance between points');
    test('should update when value changes');
    test('should handle negative distance (error)');
    test('should handle zero distance (convert to coincident)');
  });
  
  describe('Over-Constrained Systems', () => {
    test('should detect redundant constraints');
    test('should identify conflicting constraints');
    test('should calculate correct DOF');
  });
  
  describe('Performance', () => {
    test('should solve 10 constraints in <50ms', { timeout: 100 });
    test('should solve 50 constraints in <200ms', { timeout: 300 });
    test('should handle 100 constraints without crash');
  });
});
```

**Test Fixtures Needed**:
- `constrained_rectangle.json` - Basic rectangle with 4 lines + constraints
- `tangent_circles.json` - Multiple circles with tangent constraints
- `complex_pattern.json` - 50+ constraints stress test
- `overconstrained_square.json` - Intentionally over-constrained
- `conflicting_distances.json` - Conflicting dimensional constraints

**Tools**: Vitest (already in stack) or Jest

**Deliverable**: >80% test coverage

---

### 2. Constraint Editing UI (P0 - 4 days)

**Problem**: Users can add constraints but **cannot edit their values**.

**Current State**:
- ✅ Can add distance constraint
- ❌ Cannot change distance value after creation
- ❌ No double-click to edit
- ❌ No parameter dialog

**What's Missing**:
```typescript
// components/sketch/DimensionEditDialog.tsx - DOES NOT EXIST
interface DimensionEditProps {
  constraint: Constraint;
  onValueChange: (newValue: number) => void;
  onExpressionChange: (expression: string) => void;
  onClose: () => void;
}

// Expected behavior:
// 1. Double-click dimension value → Dialog opens
// 2. User types new value → Live preview
// 3. User presses Enter → Constraint updates, sketch re-solves
// 4. User types expression "=width * 2" → Links to parameter
```

**UI Mockup**:
```
┌────────────────────────────┐
│ Edit Dimension             │
├────────────────────────────┤
│ Constraint: Distance       │
│ Entities: Line-1, Line-2   │
│                            │
│ Value: [50.00_____] mm     │
│ OR                         │
│ Expression: [=width * 2  ] │
│                            │
│ [Preview] [OK] [Cancel]    │
└────────────────────────────┘
```

**Required Features**:
- Double-click dimension text to open dialog
- Input validation (positive numbers, valid expressions)
- Unit conversion support (mm, cm, in, ft)
- Expression linking to parameters (future: integrate with parameter system)
- Live preview while editing
- ESC to cancel, Enter to apply

**Deliverable**: Fully functional dimension editing

---

### 3. Constraint Management Panel (P0 - 3 days)

**Problem**: No way to **inspect, manage, or debug** constraints.

**What's Missing**:
```typescript
// components/sketch/ConstraintInspector.tsx - DOES NOT EXIST

// Expected features:
- List all constraints in sketch
- Filter constraints by type
- Show constraints on selected entity
- Delete constraint button
- Enable/disable (suppress) constraint
- Highlight constraint entities on hover
- Navigate to constraint (pan/zoom to show it)
```

**UI Mockup**:
```
┌─────────────────────────────────┐
│ Constraints (12)           [+]  │
├─────────────────────────────────┤
│ [Filter: All ▾] [Search...   ]  │
├─────────────────────────────────┤
│ ⊥ Perpendicular                 │
│   Line-1, Line-2            [×] │
│                                 │
│ 📏 Distance (50.0 mm)           │
│   Point-1, Point-2          [×] │
│                                 │
│ ═══ Horizontal                  │
│   Line-3                    [×] │
│                                 │
│ ⚓ Fix                           │
│   Point-4                   [×] │
└─────────────────────────────────┘
```

**Conflict Resolution UI**:
```typescript
// Show when over-constrained
┌─────────────────────────────────┐
│ ⚠️ Over-Constrained System      │
├─────────────────────────────────┤
│ The sketch has too many         │
│ constraints. DOF: -2            │
│                                 │
│ Conflicting Constraints:        │
│ • Distance (50.0mm) Line-1,2    │
│ • Distance (75.0mm) Line-1,2    │
│   ↳ Cannot have two different   │
│     distances on same entities  │
│                                 │
│ Suggestions:                    │
│ [ ] Remove Distance (50.0mm)    │
│ [ ] Remove Distance (75.0mm)    │
│ [ ] Suppress one constraint     │
│                                 │
│ [Apply] [Cancel]                │
└─────────────────────────────────┘
```

**Deliverable**: Constraint inspector panel with conflict resolution

---

### 4. Drag Behavior Enhancement (P0 - 4 days)

**Problem**: Dragging entities with constraints is **unpredictable or broken**.

**Current Issues**:
- Dragging constrained entity may not work
- No visual feedback during constrained drag
- Constraints may be violated during drag
- No way to override constraints while dragging

**What's Missing**:
```typescript
// Enhanced drag behavior in SketchCanvas.tsx

interface DragContext {
  entityId: string;
  mode: DragMode;
  initialPosition: Point2D;
  affectedConstraints: Constraint[];
  solverLock: 'drag_entity' | 'free';
}

enum DragMode {
  FREE,           // Ignore all constraints (Ctrl held)
  CONSTRAINED,    // Respect all constraints (default)
  DIMENSIONAL,    // Only geometric constraints (Shift held)
}

// Implementation:
onMouseDown(entity) {
  // Determine drag mode based on modifiers
  const mode = ctrlKey ? DragMode.FREE : DragMode.CONSTRAINED;
  
  if (mode === DragMode.FREE) {
    // Traditional drag, no constraint solving
    return;
  }
  
  // Lock dragged entity variables as "stay" constraints
  solver.lockEntity(entity.id);
  
  // Solve for other entities
  solver.solve();
}

onMouseMove(position) {
  if (dragMode === DragMode.CONSTRAINED) {
    // Update dragged entity position
    // Re-solve (throttled to 60fps)
    // Show preview of other entities moving
  }
}
```

**Visual Feedback**:
- Ghost preview of other entities during drag
- Show which constraints are active (highlight)
- Cursor changes based on drag mode
- Tooltip: "Hold Ctrl to ignore constraints"

**Performance**:
- Throttle solving to 60fps (16.6ms)
- If solve takes >50ms, show loading indicator
- If solve fails, revert to last good state

**Deliverable**: Smooth constrained dragging with mode support

---

### 5. Error Handling & Diagnostics (P0 - 3 days)

**Problem**: When solver fails, user gets **no feedback or recovery options**.

**Current State**:
```typescript
// Current error handling:
catch (error) {
  console.error('Solver failed:', error); // That's it!
  return { success: false };
}
```

**What's Needed**:
```typescript
// Robust error handling with recovery

class SolverDiagnostics {
  detectOverConstrained(system: ConstraintSystem): DiagnosticResult {
    const expectedDOF = calculateExpectedDOF(system.entities);
    const actualDOF = calculateActualDOF(system);
    
    if (actualDOF < 0) {
      return {
        issue: 'over_constrained',
        severity: 'error',
        dofDelta: actualDOF,
        problematicConstraints: findRedundantConstraints(system),
        suggestion: 'Remove one of the highlighted constraints',
      };
    }
  }
  
  detectConflicts(system: ConstraintSystem): DiagnosticResult {
    // Find contradictory constraints
    // Example: Distance(A,B) = 10 AND Distance(A,B) = 20
    for (const [id1, c1] of system.constraints) {
      for (const [id2, c2] of system.constraints) {
        if (id1 !== id2 && areConflicting(c1, c2)) {
          return {
            issue: 'conflicting',
            conflicts: [c1, c2],
            reason: 'Cannot satisfy both constraints',
          };
        }
      }
    }
  }
  
  detectDegenerate(system: ConstraintSystem): DiagnosticResult {
    // Find degenerate geometry
    // Example: Line with zero length, Circle with zero radius
    for (const [id, entity] of system.entities) {
      if (isDegenerate(entity)) {
        return {
          issue: 'degenerate',
          entityId: id,
          reason: 'Entity has invalid geometry',
        };
      }
    }
  }
}
```

**Error Recovery UI**:
```typescript
// components/sketch/SolverErrorDialog.tsx
┌─────────────────────────────────┐
│ ⚠️ Constraint Solver Failed     │
├─────────────────────────────────┤
│ The constraint system cannot    │
│ be solved due to conflicts.     │
│                                 │
│ Problem: Over-Constrained       │
│ DOF: -2 (2 too many)            │
│                                 │
│ Problematic Constraints:        │
│ • Distance (50mm) - Line-1,2 ⚠️ │
│ • Horizontal - Line-1        ⚠️ │
│ • Vertical - Line-1          ⚠️ │
│   ↳ Line cannot be both H+V     │
│                                 │
│ Actions:                        │
│ [Undo Last Change]              │
│ [Suppress Constraint...]        │
│ [Keep Anyway] [Cancel]          │
└─────────────────────────────────┘
```

**Deliverable**: Comprehensive error detection and user-friendly recovery

---

## 🟡 HIGH PRIORITY (Production Polish)

### 6. Performance Optimization (P1 - 5 days)

**Current Performance**:
- ✅ <100ms for simple sketches (10-20 constraints)
- ⚠️ ~500ms for complex sketches (50+ constraints)
- ❌ Unknown performance for 100+ constraints
- ❌ Full re-solve on every change (inefficient)

**Optimizations Needed**:

**A. Incremental Solving**
```typescript
// Only re-solve affected constraints
class IncrementalSolver extends ConstraintSolver {
  private constraintGraph: DependencyGraph;
  private dirtyConstraints: Set<string> = new Set();
  
  markDirty(entityId: string): void {
    // Mark all constraints that reference this entity
    const affected = this.constraintGraph.getAffectedConstraints(entityId);
    affected.forEach(c => this.dirtyConstraints.add(c));
  }
  
  solveIncremental(): SolverResult {
    // Only rebuild dirty constraints
    // Much faster than full rebuild
    const constraintsToSolve = Array.from(this.dirtyConstraints);
    // ... solve only these
  }
}
```

**B. Spatial Indexing**
```typescript
// Accelerate snap detection and constraint application
import Flatbush from 'flatbush';

class SpatialIndex {
  private index: Flatbush;
  
  findEntitiesInRadius(point: Point2D, radius: number): Entity[] {
    // O(log n) instead of O(n)
    const results = this.index.search(
      point.x - radius,
      point.y - radius,
      point.x + radius,
      point.y + radius
    );
    return results.map(i => this.entities[i]);
  }
}
```

**C. Debouncing & Throttling**
```typescript
// Reduce solve frequency
const debouncedSolve = debounce(() => {
  solver.solve();
}, 100); // Wait 100ms after last change

// During drag, throttle to 60fps
const throttledSolve = throttle(() => {
  solver.solve();
}, 16); // Max once per frame
```

**D. Web Worker for Heavy Solves**
```typescript
// Offload solving to background thread
// workers/constraint-solver.worker.ts
self.addEventListener('message', (e) => {
  const { system } = e.data;
  const result = solver.solve(system);
  self.postMessage(result);
});

// Main thread:
if (constraintCount > 50) {
  solverWorker.postMessage({ system });
} else {
  solver.solve(system); // Keep simple solves on main thread
}
```

**Performance Targets**:
- 10 constraints: <10ms
- 50 constraints: <100ms
- 100 constraints: <250ms
- 200 constraints: <500ms (with Web Worker)

**Deliverable**: Optimized solver with performance metrics dashboard

---

### 7. Advanced Constraint Types (P1 - 6 days)

**What's Missing**:

**A. Pattern Constraints**
```typescript
// Linear pattern
const patternConstraint: PatternConstraint = {
  type: 'linear_pattern',
  entities: ['circle-1', 'circle-2', 'circle-3'],
  count: 3,
  spacing: 25, // mm
  direction: { x: 1, y: 0 }, // Horizontal
};
// Result: 3 circles equally spaced by 25mm horizontally
```

**B. Symmetric Constraint**
```typescript
// Mirror symmetry
const symmetricConstraint: SymmetricConstraint = {
  type: 'symmetric',
  entities: ['line-1', 'line-2'], // Symmetric pair
  mirrorLine: 'line-centerline',
};
// Result: line-2 is always mirrored version of line-1
```

**C. Offset Constraint**
```typescript
// Maintain constant offset between parallel curves
const offsetConstraint: OffsetConstraint = {
  type: 'offset',
  entity1: 'line-1',
  entity2: 'line-2',
  distance: 10, // mm
};
// Result: line-2 always 10mm from line-1, parallel
```

**D. Colinear Constraint**
```typescript
// Force points to lie on same line
const colinearConstraint: ColinearConstraint = {
  type: 'colinear',
  points: ['point-1', 'point-2', 'point-3'],
};
```

**E. Smooth Constraint (G2 Continuity)**
```typescript
// Curvature continuity for splines
const smoothConstraint: SmoothConstraint = {
  type: 'smooth',
  spline1: 'spline-1',
  spline2: 'spline-2',
  continuity: 'G2', // Options: G0, G1, G2
};
```

---

### 8. Auto-Constraint System (P1 - 4 days)

**Goal**: Automatically apply constraints as user draws (like SolidWorks/Fusion 360)

**Rules**:
```typescript
const autoConstraintRules: AutoConstraintRule[] = [
  {
    name: 'Auto-Horizontal',
    condition: (line) => Math.abs(line.angle) < 5 * Math.PI/180,
    constraint: 'horizontal',
    tolerance: 5, // degrees
    visual: 'Show H symbol in gray during preview',
  },
  {
    name: 'Auto-Vertical',
    condition: (line) => Math.abs(line.angle - 90) < 5 * Math.PI/180,
    constraint: 'vertical',
    tolerance: 5,
  },
  {
    name: 'Auto-Perpendicular',
    condition: (line1, line2) => {
      const angleDiff = Math.abs(line1.angle - line2.angle);
      return Math.abs(angleDiff - 90) < 5 * Math.PI/180;
    },
    constraint: 'perpendicular',
    requires: 2,
  },
  {
    name: 'Auto-Tangent',
    condition: (circle, line) => {
      const dist = distancePointToLine(circle.center, line);
      return Math.abs(dist - circle.radius) < 1; // 1mm tolerance
    },
    constraint: 'tangent',
  },
];
```

**UI Controls**:
```typescript
// Settings panel
interface AutoConstraintSettings {
  enabled: boolean;
  rules: {
    horizontal: boolean;
    vertical: boolean;
    perpendicular: boolean;
    parallel: boolean;
    tangent: boolean;
    coincident: boolean;
  };
  tolerance: {
    angle: number; // degrees
    distance: number; // mm
  };
  confirmBeforeApply: boolean; // Show dialog before applying
}
```

**Visual Feedback**:
- Auto-constraints shown in gray (vs green for manual)
- "Auto" badge next to constraint symbol
- Toast notification: "Auto-horizontal applied to Line-5"
- Can convert auto-constraint to manual (right-click → Make Permanent)

---

### 9. Constraint Serialization (P1 - 2 days)

**Problem**: Cannot save/load constrained sketches.

**Format**:
```typescript
interface SerializedSketch {
  version: '1.0',
  metadata: {
    name: 'Bracket Design',
    createdAt: '2025-01-29T10:00:00Z',
    modifiedAt: '2025-01-29T15:30:00Z',
    solverVersion: '0.1.0',
    author: 'user@example.com',
  },
  entities: [
    {
      id: 'line-1',
      type: 'line',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
    },
    // ... more entities
  ],
  constraints: [
    {
      id: 'constraint-1',
      type: 'horizontal',
      entities: ['line-1'],
      parameters: {},
    },
    {
      id: 'constraint-2',
      type: 'distance',
      entities: ['point-1', 'point-2'],
      parameters: { value: 50, unit: 'mm' },
    },
    // ... more constraints
  ],
  parameters: [
    {
      name: 'width',
      value: 100,
      unit: 'mm',
      expression: null,
    },
    {
      name: 'height',
      value: 50,
      unit: 'mm',
      expression: '=width / 2',
    },
  ],
}
```

**Migration System**:
```typescript
class SketchMigration {
  migrate(data: any, fromVersion: string, toVersion: string): SerializedSketch {
    // Handle backward compatibility
    if (fromVersion === '0.9' && toVersion === '1.0') {
      // Convert old format to new
      data.constraints = migrateConstraints(data.oldConstraints);
    }
    return data;
  }
}
```

**API**:
```typescript
// Save
const json = sketchSerializer.serialize(sketch);
await fs.writeFile('bracket.flows', json);

// Load
const json = await fs.readFile('bracket.flows');
const sketch = sketchSerializer.deserialize(json);
```

---

## 🟢 MEDIUM PRIORITY (Future Enhancements)

### 10. Constraint Strength System (P2 - 3 days)
- Implement `required`, `strong`, `medium`, `weak` strength levels
- UI to set constraint strength
- Use weak constraints for auto-layout, required for critical dimensions

### 11. Undo/Redo for Constraints (P2 - 2 days)
- Command pattern for all constraint operations
- Undo add/remove/edit constraint
- Undo parameter changes

### 12. Enhanced Visualization (P2 - 3 days)
- Hover to highlight related entities
- Click symbol to select constraint
- Animation when constraint applied
- Color coding (green=satisfied, yellow=under, red=over)

### 13. Constraint Templates (P2 - 2 days)
- Pre-built constraint sets
- "Fully constrain rectangle", "Symmetric pattern", etc.
- Save custom templates
- Template library

---

## 📚 Documentation Needs

### Developer Documentation (P1 - 3 days)
- Constraint Solver API documentation
- Architecture diagrams
- How to add new constraint types
- Troubleshooting guide
- Performance optimization tips

### User Guide (P2 - 2 days)
- Constraint workflow tutorials
- Video walkthroughs
- Best practices
- Common mistakes
- Keyboard shortcuts

### Example Library (P2 - 2 days)
- 10-15 example constrained sketches
- Step-by-step creation guides
- Exportable as templates

---

## 📊 Effort Estimation

| Priority | Item | Days | Team | Deliverable |
|----------|------|------|------|-------------|
| 🔴 P0 | Testing Infrastructure | 3 | QA + Dev | >80% test coverage |
| 🔴 P0 | Constraint Editing UI | 4 | Frontend | Dimension edit dialog |
| 🔴 P0 | Constraint Management | 3 | Frontend | Inspector panel |
| 🔴 P0 | Drag Behavior | 4 | Frontend | Constrained dragging |
| 🔴 P0 | Error Handling | 3 | Backend + UI | Diagnostics + recovery |
| 🟡 P1 | Performance | 5 | Backend | Incremental solver |
| 🟡 P1 | Advanced Constraints | 6 | Backend | 5 new constraint types |
| 🟡 P1 | Auto-Constraints | 4 | Backend + UI | Smart inference |
| 🟡 P1 | Serialization | 2 | Backend | Save/load system |
| 📚 P1 | Documentation | 3 | Tech Writer | API docs |
| 🟢 P2 | Strength System | 3 | Backend | Multi-level strengths |
| 🟢 P2 | Undo/Redo | 2 | Frontend | Command history |
| 🟢 P2 | Visualization | 3 | Frontend | Enhanced UI |
| 🟢 P2 | Templates | 2 | Frontend | Template library |
| 📚 P2 | User Guide | 2 | Tech Writer | Tutorials |
| 📚 P2 | Examples | 2 | Designer | Example library |
| **TOTAL** | **All Items** | **51 days** | **2-3 engineers** | Production-ready solver |

**Critical Path** (P0 only): **17 days** (3.5 weeks)  
**High Priority** (P0 + P1): **37 days** (7.5 weeks)  
**Complete** (All): **51 days** (10 weeks)

---

## 🎯 Recommended Phased Approach

### Phase 1: Production Readiness (Weeks 5-6) - 17 days
**Goal**: Make current system production-ready

1. Testing Infrastructure (3 days)
2. Constraint Editing UI (4 days)
3. Constraint Management Panel (3 days)
4. Drag Behavior Enhancement (4 days)
5. Error Handling & Diagnostics (3 days)

**Deliverable**: Stable, tested, user-friendly constraint system

---

### Phase 2: Performance & Advanced Features (Weeks 7-8) - 20 days
**Goal**: Handle complex sketches, advanced workflows

1. Performance Optimization (5 days)
2. Advanced Constraint Types (6 days)
3. Auto-Constraint System (4 days)
4. Constraint Serialization (2 days)
5. Developer Documentation (3 days)

**Deliverable**: High-performance system with advanced features

---

### Phase 3: Polish & Enhancement (Weeks 9-10) - 14 days
**Goal**: Professional polish, user experience excellence

1. Constraint Strength System (3 days)
2. Undo/Redo Integration (2 days)
3. Enhanced Visualization (3 days)
4. Constraint Templates (2 days)
5. User Guide & Examples (4 days)

**Deliverable**: Professional-grade CAD constraint system

---

## 🚨 Risk Assessment

### High Risk Items
1. **Performance with >100 constraints** - May require Web Workers or algorithm changes
2. **Drag behavior** - Complex interaction between UI and solver, high potential for bugs
3. **Over-constrained detection** - Mathematically complex, may have edge cases

### Mitigation Strategies
1. **Early performance testing** - Benchmark with realistic sketches from day 1
2. **Incremental rollout** - Release drag modes one at a time (free, then constrained)
3. **Extensive testing** - Build comprehensive test suite before major changes

---

## 📈 Success Metrics

### Technical Metrics
- ✅ **Constraint Types**: 15 implemented (target: 20+)
- 🔴 **Test Coverage**: 0% (target: >80%)
- 🟡 **Performance**: ~500ms for 50 constraints (target: <100ms)
- ❌ **Error Recovery**: None (target: 100% recoverable failures)
- ❌ **Documentation**: Basic (target: Comprehensive API + User Guide)

### User Metrics
- **Time to Constrain Rectangle**: Unknown (target: <30 seconds)
- **Constraint Edit Success Rate**: 0% (no UI) (target: >95%)
- **Solver Failure Rate**: Unknown (target: <1%)
- **User Satisfaction**: N/A (target: >4.0/5.0)

---

## 🎉 Conclusion

The constraint solver **core is complete and working** (✅ 16,960 LOC), but **critical production gaps remain**:

**Must Have (P0)**: 17 days
- Testing, Editing UI, Constraint Management, Drag Behavior, Error Handling

**Should Have (P1)**: 20 days
- Performance, Advanced Constraints, Auto-Constraints, Serialization, Docs

**Nice to Have (P2)**: 14 days
- Strength System, Undo/Redo, Visualization, Templates

**Total to Production Excellence**: 51 days (~10 weeks with 2-3 engineers)

**Minimum Viable Production**: 17 days (~3.5 weeks)

---

**Next Steps**:
1. Review this roadmap with team
2. Prioritize based on user needs
3. Assign engineers to Phase 1 (Production Readiness)
4. Set up CI/CD for automated testing
5. Begin Week 5 with Testing Infrastructure

**Ready to proceed?** 🚀
