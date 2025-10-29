# Constraint Solver Implementation Checklist

Quick reference checklist for tracking constraint solver production readiness.

---

## ✅ COMPLETED (Week 3-4)

- [x] Kiwi.js library integration
- [x] Constraint solver package (`packages/constraint-solver/`)
- [x] 15 constraint types implemented
- [x] Entity-to-variable mapping
- [x] DOF calculation
- [x] Constraint visualization (symbols)
- [x] Constraint toolbar UI
- [x] Basic auto-solving
- [x] Model store integration

**Total**: ~16,960 lines implemented

---

## 🔴 CRITICAL GAPS (P0 - Must Fix)

### Testing Infrastructure (3 days)
- [ ] Set up Vitest testing framework
- [ ] Unit tests for ConstraintSolver
  - [ ] Coincident constraint tests
  - [ ] Horizontal/Vertical constraint tests
  - [ ] Distance constraint tests
  - [ ] Radius/Diameter constraint tests
  - [ ] Angle constraint tests
  - [ ] Tangent constraint tests
- [ ] Integration tests for UI workflows
- [ ] Edge case tests
  - [ ] Over-constrained system detection
  - [ ] Conflicting constraints
  - [ ] Degenerate geometry (zero-length lines)
  - [ ] Circular dependencies
- [ ] Performance benchmarks
  - [ ] 10 constraints: <10ms
  - [ ] 50 constraints: <100ms
  - [ ] 100 constraints: <250ms
- [ ] Test fixtures
  - [ ] `constrained_rectangle.json`
  - [ ] `tangent_circles.json`
  - [ ] `complex_pattern_50_constraints.json`
  - [ ] `overconstrained_square.json`
  - [ ] `conflicting_distances.json`
- [ ] Achieve >80% test coverage

**Files**: `packages/constraint-solver/__tests__/`

---

### Constraint Editing UI (4 days)
- [ ] Create `DimensionEditDialog.tsx` component
- [ ] Double-click dimension text to open dialog
- [ ] Value input field with validation
- [ ] Unit selector (mm, cm, in, ft)
- [ ] Expression input (link to parameters)
- [ ] Live preview during edit
- [ ] Apply/Cancel buttons
- [ ] ESC to cancel, Enter to apply
- [ ] Update constraint value on apply
- [ ] Re-solve sketch after edit
- [ ] Handle invalid inputs gracefully
- [ ] Show current value and unit

**Files**: `apps/web/src/components/sketch/DimensionEditDialog.tsx`

---

### Constraint Management Panel (3 days)
- [ ] Create `ConstraintInspector.tsx` component
- [ ] List all constraints in sketch
- [ ] Filter constraints by type
- [ ] Show constraints on selected entity
- [ ] Delete constraint button (with confirmation)
- [ ] Enable/disable (suppress) constraint toggle
- [ ] Highlight constraint entities on hover
- [ ] Navigate to constraint (pan/zoom)
- [ ] Show constraint properties (type, entities, value)
- [ ] Conflict resolution UI
  - [ ] Detect over-constrained systems
  - [ ] Show DOF calculation
  - [ ] Highlight conflicting constraints in red
  - [ ] Suggest which constraint to remove
  - [ ] Auto-fix option
- [ ] Constraint search/filter

**Files**: `apps/web/src/components/sketch/ConstraintInspector.tsx`

---

### Drag Behavior Enhancement (4 days)
- [ ] Implement drag modes
  - [ ] FREE mode (Ctrl held - ignore constraints)
  - [ ] CONSTRAINED mode (default - respect all)
  - [ ] DIMENSIONAL mode (Shift - only geometric)
- [ ] Lock dragged entity variables during drag
- [ ] Solve for other entities during drag
- [ ] Show ghost preview of other entities
- [ ] Throttle solving to 60fps (16.6ms)
- [ ] Visual feedback for drag mode
  - [ ] Cursor changes
  - [ ] Tooltip: "Hold Ctrl to ignore constraints"
- [ ] Handle solve failures during drag
  - [ ] Revert to last good state
  - [ ] Show error indicator
- [ ] Update `SketchCanvas.tsx` drag handlers
- [ ] Performance optimization during drag

**Files**: `apps/web/src/components/sketch/SketchCanvas.tsx`

---

### Error Handling & Diagnostics (3 days)
- [ ] Create `SolverDiagnostics` class
- [ ] Over-constraint detection
  - [ ] Calculate expected DOF
  - [ ] Calculate actual DOF
  - [ ] Find redundant constraints
  - [ ] Visual warning indicator
- [ ] Conflict detection
  - [ ] Detect contradictory constraints
  - [ ] Show conflicting constraint IDs
  - [ ] Highlight in red
- [ ] Degenerate geometry detection
  - [ ] Zero-length lines
  - [ ] Zero-radius circles
  - [ ] Overlapping points
- [ ] Create `SolverErrorDialog.tsx` component
- [ ] User-friendly error messages (no jargon)
- [ ] Suggested actions
  - [ ] Undo last change
  - [ ] Suppress constraint
  - [ ] Delete constraint
  - [ ] Keep anyway (override)
- [ ] Revert to last good state on failure
- [ ] Detailed error logging to console

**Files**: 
- `packages/constraint-solver/src/diagnostics.ts`
- `apps/web/src/components/sketch/SolverErrorDialog.tsx`

---

## 🟡 HIGH PRIORITY (P1 - Production Polish)

### Performance Optimization (5 days)
- [ ] Implement incremental solving
  - [ ] Build constraint dependency graph
  - [ ] Dirty marking system
  - [ ] Only re-solve affected constraints
- [ ] Spatial indexing for snap detection
  - [ ] Integrate `flatbush` or custom quad-tree
  - [ ] Accelerate entity queries
- [ ] Debouncing & throttling
  - [ ] Debounce constraint changes (100ms)
  - [ ] Throttle during drag (16ms)
- [ ] Web Worker for heavy solves (>50 constraints)
- [ ] Cache solver state
- [ ] Performance metrics dashboard
  - [ ] Show solve time in status bar
  - [ ] Warning if solve >200ms
  - [ ] Track performance over time

**Files**: `packages/constraint-solver/src/incremental.ts`

---

### Advanced Constraint Types (6 days)
- [ ] Pattern Constraints
  - [ ] Linear pattern (equally spaced)
  - [ ] Circular pattern (angular spacing)
- [ ] Symmetric constraint
  - [ ] Mirror across line
  - [ ] Maintain symmetry during edits
- [ ] Offset constraint
  - [ ] Parallel lines/curves with distance
- [ ] Colinear constraint
  - [ ] Force points on same line
- [ ] Smooth constraint (G2 continuity)
  - [ ] Curvature continuity for splines
- [ ] Add to constraint toolbar
- [ ] Add visualization for each type
- [ ] Write tests for each type

**Files**: `packages/constraint-solver/src/constraints/advanced.ts`

---

### Auto-Constraint System (4 days)
- [ ] Define auto-constraint rules
  - [ ] Auto-horizontal (within 5°)
  - [ ] Auto-vertical (within 5°)
  - [ ] Auto-perpendicular (within 5°)
  - [ ] Auto-parallel (within 5°)
  - [ ] Auto-tangent (touch tolerance)
  - [ ] Auto-coincident (snap distance)
- [ ] Implement rule evaluation engine
- [ ] Settings panel for auto-constraints
  - [ ] Enable/disable per rule
  - [ ] Adjust tolerance values
  - [ ] Confirm before apply option
- [ ] Visual feedback
  - [ ] Gray color for auto-constraints
  - [ ] "Auto" badge on symbols
  - [ ] Toast notifications
- [ ] Convert auto to manual (right-click)
- [ ] Apply on entity creation
- [ ] Apply on entity move

**Files**: `packages/constraint-solver/src/auto-constraints.ts`

---

### Constraint Serialization (2 days)
- [ ] Define JSON schema for constrained sketches
- [ ] Implement `serialize()` method
- [ ] Implement `deserialize()` method
- [ ] Backward compatibility handling
- [ ] Migration system for format changes
- [ ] Version tracking
- [ ] Metadata (created, modified, author)
- [ ] Save to file API
- [ ] Load from file API
- [ ] Error handling for corrupted files

**Files**: `packages/constraint-solver/src/serialization.ts`

---

### Developer Documentation (3 days)
- [ ] Constraint Solver API documentation
- [ ] Architecture diagrams
  - [ ] System flow diagram
  - [ ] Data flow diagram
  - [ ] Class hierarchy
- [ ] How to add new constraint types
  - [ ] Step-by-step guide
  - [ ] Code examples
- [ ] Troubleshooting guide
  - [ ] Common issues
  - [ ] Debug techniques
- [ ] Performance optimization tips
- [ ] Code examples for common tasks
- [ ] API reference (auto-generated from TSDoc)

**Files**: `docs/CONSTRAINT_SOLVER_API.md`

---

## 🟢 MEDIUM PRIORITY (P2 - Future)

### Constraint Strength System (3 days)
- [ ] Implement strength levels
  - [ ] `required` (must be satisfied)
  - [ ] `strong` (preferred)
  - [ ] `medium` (suggestion)
  - [ ] `weak` (hint)
- [ ] Strength selector in UI
- [ ] Update solver to use strengths
- [ ] Tests for strength hierarchy

---

### Undo/Redo for Constraints (2 days)
- [ ] Command pattern for constraint ops
- [ ] `AddConstraintCommand`
- [ ] `RemoveConstraintCommand`
- [ ] `EditConstraintCommand`
- [ ] Integrate with existing undo system
- [ ] Track parameter changes

---

### Enhanced Visualization (3 days)
- [ ] Hover to highlight related entities
- [ ] Click symbol to select constraint
- [ ] Show constraint name on hover
- [ ] Animation when applied
- [ ] Color coding by state
  - [ ] Green: Satisfied
  - [ ] Yellow: Under-constrained
  - [ ] Red: Over-constrained
  - [ ] Gray: Suppressed
- [ ] Aligned dimension text
- [ ] Witness lines for offset dimensions
- [ ] Reference vs driving dimensions

---

### Constraint Templates (2 days)
- [ ] Pre-built constraint sets
  - [ ] "Fully constrain rectangle"
  - [ ] "Symmetric about centerline"
  - [ ] "Equal spacing pattern"
- [ ] Save custom templates
- [ ] Load templates
- [ ] Apply template to selection
- [ ] Template library panel UI

---

### User Guide (2 days)
- [ ] Constraint workflow tutorials
- [ ] Video walkthroughs
- [ ] Best practices guide
- [ ] Common mistakes and fixes
- [ ] Keyboard shortcuts reference

**Files**: `docs/USER_GUIDE_CONSTRAINTS.md`

---

### Example Library (2 days)
- [ ] Simple examples
  - [ ] Constrained rectangle
  - [ ] Constrained circle
  - [ ] Constrained triangle
- [ ] Intermediate examples
  - [ ] Gears with tangent constraints
  - [ ] Bracket with patterns
  - [ ] Symmetric design
- [ ] Advanced examples
  - [ ] Linkage mechanism
  - [ ] Cam profile
  - [ ] Complex assembly
- [ ] Step-by-step creation guides
- [ ] Export as JSON templates

**Files**: `examples/sketches/*.json`

---

## 📊 Progress Tracking

### Phase 1: Production Readiness (17 days)
- [ ] Testing Infrastructure (3d)
- [ ] Constraint Editing UI (4d)
- [ ] Constraint Management (3d)
- [ ] Drag Behavior (4d)
- [ ] Error Handling (3d)

**Progress**: 0/17 days (0%)

---

### Phase 2: Performance & Advanced (20 days)
- [ ] Performance Optimization (5d)
- [ ] Advanced Constraints (6d)
- [ ] Auto-Constraints (4d)
- [ ] Serialization (2d)
- [ ] Developer Docs (3d)

**Progress**: 0/20 days (0%)

---

### Phase 3: Polish & Enhancement (14 days)
- [ ] Constraint Strength (3d)
- [ ] Undo/Redo (2d)
- [ ] Enhanced Visualization (3d)
- [ ] Constraint Templates (2d)
- [ ] User Guide & Examples (4d)

**Progress**: 0/14 days (0%)

---

## 🎯 Overall Status

**Completed**: 16,960 LOC (Week 3-4) ✅  
**Remaining Critical**: ~5,000 LOC 🔴  
**Remaining Nice-to-Have**: ~3,000 LOC 🟡  
**Total Target**: ~25,000 LOC

**Timeline**:
- Week 3-4: ✅ DONE
- Week 5-6: 🔴 Production Readiness
- Week 7-8: 🟡 Performance & Advanced
- Week 9-10: 🟢 Polish & Enhancement

**Test Coverage**: 0% → Target: >80%  
**Performance**: ~500ms (50 constraints) → Target: <100ms  
**Documentation**: Basic → Target: Comprehensive

---

## 🚀 Quick Start Next Steps

1. **Review** `CONSTRAINT_SOLVER_PRODUCTION_ROADMAP.md`
2. **Prioritize** critical gaps with team
3. **Set up** testing infrastructure (Vitest)
4. **Implement** constraint editing UI
5. **Build** constraint inspector panel
6. **Fix** drag behavior
7. **Add** error handling
8. **Optimize** performance
9. **Document** everything
10. **Ship** production-ready solver! 🎉

---

**Last Updated**: 2025-01-29  
**Status**: Ready for Phase 1 (Production Readiness)
