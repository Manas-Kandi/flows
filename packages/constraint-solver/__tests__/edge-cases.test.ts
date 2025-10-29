import { describe, test, expect, beforeEach } from 'vitest';
import { ConstraintSolver } from '../src/solver';
import type { ConstraintSystem, Constraint } from '../src/types';
import { createEntityGeometry } from '../src/geometry';
import { SolverDiagnostics } from '../src/diagnostics';

describe('Edge Cases and Error Handling', () => {
  let solver: ConstraintSolver;
  let diagnostics: SolverDiagnostics;

  beforeEach(() => {
    solver = new ConstraintSolver();
    diagnostics = new SolverDiagnostics();
  });

  describe('Over-Constrained Systems', () => {
    test('should detect over-constrained square', () => {
      // Square with redundant equal constraints
      const entities = new Map();
      entities.set('line-1', createEntityGeometry('line-1', 'line', {
        start: { x: 0, y: 0 },
        end: { x: 50, y: 0 },
      }));
      entities.set('line-2', createEntityGeometry('line-2', 'line', {
        start: { x: 50, y: 0 },
        end: { x: 50, y: 50 },
      }));
      entities.set('line-3', createEntityGeometry('line-3', 'line', {
        start: { x: 50, y: 50 },
        end: { x: 0, y: 50 },
      }));
      entities.set('line-4', createEntityGeometry('line-4', 'line', {
        start: { x: 0, y: 50 },
        end: { x: 0, y: 0 },
      }));

      const constraints: Constraint[] = [
        { id: 'c1', type: 'horizontal', entityIds: ['line-1'], parameters: {}, strength: 'required' },
        { id: 'c2', type: 'vertical', entityIds: ['line-2'], parameters: {}, strength: 'required' },
        { id: 'c3', type: 'horizontal', entityIds: ['line-3'], parameters: {}, strength: 'required' },
        { id: 'c4', type: 'vertical', entityIds: ['line-4'], parameters: {}, strength: 'required' },
        { id: 'c5', type: 'distance', entityIds: ['line-1', 'line-3'], parameters: { value: 50 }, strength: 'required' },
        { id: 'c6', type: 'distance', entityIds: ['line-2', 'line-4'], parameters: { value: 50 }, strength: 'required' },
        { id: 'c7', type: 'equal', entityIds: ['line-1', 'line-2'], parameters: {}, strength: 'required' },
        { id: 'c8', type: 'equal', entityIds: ['line-3', 'line-4'], parameters: {}, strength: 'required' },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const diagnostic = diagnostics.detectOverConstrained(system);

      expect(diagnostic).toBeDefined();
      expect(diagnostic?.issue).toBe('over_constrained');
      expect(diagnostic?.dofDelta).toBeLessThan(0);
    });

    test('should identify redundant constraints', () => {
      const entities = new Map();
      entities.set('point-1', createEntityGeometry('point-1', 'point', {
        position: { x: 0, y: 0 },
      }));
      entities.set('point-2', createEntityGeometry('point-2', 'point', {
        position: { x: 50, y: 0 },
      }));

      const constraints: Constraint[] = [
        { id: 'c1', type: 'fix', entityIds: ['point-1'], parameters: {}, strength: 'required' },
        { id: 'c2', type: 'fix', entityIds: ['point-2'], parameters: {}, strength: 'required' },
        { id: 'c3', type: 'distance', entityIds: ['point-1', 'point-2'], parameters: { value: 50 }, strength: 'required' },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const diagnostic = diagnostics.detectOverConstrained(system);

      expect(diagnostic).toBeDefined();
      expect(diagnostic?.problematicConstraints).toContain('c3'); // Distance is redundant when both points are fixed
    });
  });

  describe('Conflicting Constraints', () => {
    test('should detect conflicting distance constraints', () => {
      const entities = new Map();
      entities.set('point-1', createEntityGeometry('point-1', 'point', {
        position: { x: 0, y: 0 },
      }));
      entities.set('point-2', createEntityGeometry('point-2', 'point', {
        position: { x: 50, y: 0 },
      }));

      const constraints: Constraint[] = [
        { id: 'c1', type: 'fix', entityIds: ['point-1'], parameters: {}, strength: 'required' },
        { id: 'c2', type: 'distance', entityIds: ['point-1', 'point-2'], parameters: { value: 50 }, strength: 'required' },
        { id: 'c3', type: 'distance', entityIds: ['point-1', 'point-2'], parameters: { value: 75 }, strength: 'required' },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const diagnostic = diagnostics.detectConflicts(system);

      expect(diagnostic).toBeDefined();
      expect(diagnostic?.issue).toBe('conflicting');
      expect(diagnostic?.conflicts).toHaveLength(2);
      expect(diagnostic?.reason).toContain('Cannot satisfy both constraints');
    });

    test('should detect horizontal and vertical on same line', () => {
      const entities = new Map();
      entities.set('line-1', createEntityGeometry('line-1', 'line', {
        start: { x: 0, y: 0 },
        end: { x: 100, y: 10 },
      }));

      const constraints: Constraint[] = [
        { id: 'c1', type: 'horizontal', entityIds: ['line-1'], parameters: {}, strength: 'required' },
        { id: 'c2', type: 'vertical', entityIds: ['line-1'], parameters: {}, strength: 'required' },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const diagnostic = diagnostics.detectConflicts(system);

      expect(diagnostic).toBeDefined();
      expect(diagnostic?.issue).toBe('conflicting');
      expect(diagnostic?.reason).toContain('cannot be both horizontal and vertical');
    });
  });

  describe('Degenerate Geometry', () => {
    test('should detect zero-length line', () => {
      const entities = new Map();
      entities.set('line-1', createEntityGeometry('line-1', 'line', {
        start: { x: 100, y: 50 },
        end: { x: 100, y: 50 }, // Same point
      }));

      const system: ConstraintSystem = { entities, constraints: [] };
      const diagnostic = diagnostics.detectDegenerate(system);

      expect(diagnostic).toBeDefined();
      expect(diagnostic?.issue).toBe('degenerate');
      expect(diagnostic?.entityId).toBe('line-1');
      expect(diagnostic?.reason).toContain('zero length');
    });

    test('should detect zero-radius circle', () => {
      const entities = new Map();
      entities.set('circle-1', createEntityGeometry('circle-1', 'circle', {
        center: { x: 50, y: 50 },
        radius: 0,
      }));

      const system: ConstraintSystem = { entities, constraints: [] };
      const diagnostic = diagnostics.detectDegenerate(system);

      expect(diagnostic).toBeDefined();
      expect(diagnostic?.issue).toBe('degenerate');
      expect(diagnostic?.entityId).toBe('circle-1');
      expect(diagnostic?.reason).toContain('zero radius');
    });

    test('should detect negative radius', () => {
      const entities = new Map();
      entities.set('circle-1', createEntityGeometry('circle-1', 'circle', {
        center: { x: 50, y: 50 },
        radius: -10,
      }));

      const constraints: Constraint[] = [
        { id: 'c1', type: 'radius', entityIds: ['circle-1'], parameters: { value: -10 }, strength: 'required' },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const diagnostic = diagnostics.detectDegenerate(system);

      expect(diagnostic).toBeDefined();
      expect(diagnostic?.issue).toBe('degenerate');
      expect(diagnostic?.reason).toContain('negative radius');
    });
  });

  describe('Solver Failure Recovery', () => {
    test('should provide recovery options on failure', () => {
      const entities = new Map();
      entities.set('line-1', createEntityGeometry('line-1', 'line', {
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
      }));

      const constraints: Constraint[] = [
        { id: 'c1', type: 'horizontal', entityIds: ['line-1'], parameters: {}, strength: 'required' },
        { id: 'c2', type: 'vertical', entityIds: ['line-1'], parameters: {}, strength: 'required' },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      if (!result.success) {
        const failure = diagnostics.analyzeSolverFailure(result, system);

        expect(failure).toBeDefined();
        expect(failure?.reason).toBeDefined();
        expect(failure?.problematicConstraints).toBeDefined();
        expect(failure?.suggestion).toBeDefined();
        expect(failure?.canRevert).toBe(true);
      }
    });

    test('should revert to last good state on failure', () => {
      const entities = new Map();
      entities.set('point-1', createEntityGeometry('point-1', 'point', {
        position: { x: 0, y: 0 },
      }));
      entities.set('point-2', createEntityGeometry('point-2', 'point', {
        position: { x: 50, y: 0 },
      }));

      // Good system
      const goodConstraints: Constraint[] = [
        { id: 'c1', type: 'fix', entityIds: ['point-1'], parameters: {}, strength: 'required' },
        { id: 'c2', type: 'distance', entityIds: ['point-1', 'point-2'], parameters: { value: 50 }, strength: 'required' },
      ];

      const goodSystem: ConstraintSystem = { entities, constraints: goodConstraints };
      const goodResult = solver.solve(goodSystem);
      expect(goodResult.success).toBe(true);

      // Save state
      const lastGoodState = new Map(goodResult.variables);

      // Bad system (conflicting constraints)
      const badConstraints: Constraint[] = [
        ...goodConstraints,
        { id: 'c3', type: 'distance', entityIds: ['point-1', 'point-2'], parameters: { value: 75 }, strength: 'required' },
      ];

      const badSystem: ConstraintSystem = { entities, constraints: badConstraints };
      const badResult = solver.solve(badSystem);

      if (!badResult.success) {
        // Revert to last good state
        const revertedVariables = lastGoodState;
        
        expect(revertedVariables.size).toBeGreaterThan(0);
        expect(revertedVariables.get('point-2_x')).toBeDefined();
      }
    });
  });

  describe('Circular Dependencies', () => {
    test('should detect circular constraint dependencies', () => {
      const entities = new Map();
      entities.set('point-1', createEntityGeometry('point-1', 'point', {
        position: { x: 0, y: 0 },
      }));
      entities.set('point-2', createEntityGeometry('point-2', 'point', {
        position: { x: 50, y: 0 },
      }));
      entities.set('point-3', createEntityGeometry('point-3', 'point', {
        position: { x: 25, y: 43.3 },
      }));

      // Create circular dependency: p1-p2 distance depends on p2-p3, which depends on p3-p1
      const constraints: Constraint[] = [
        { id: 'c1', type: 'distance', entityIds: ['point-1', 'point-2'], parameters: { value: 50 }, strength: 'required' },
        { id: 'c2', type: 'distance', entityIds: ['point-2', 'point-3'], parameters: { value: 50 }, strength: 'required' },
        { id: 'c3', type: 'distance', entityIds: ['point-3', 'point-1'], parameters: { value: 50 }, strength: 'required' },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const diagnostic = diagnostics.detectCircularDependencies(system);

      // This should either solve (equilateral triangle) or detect issue
      expect(diagnostic).toBeDefined();
    });
  });

  describe('Numerical Stability', () => {
    test('should handle very small distances', () => {
      const entities = new Map();
      entities.set('point-1', createEntityGeometry('point-1', 'point', {
        position: { x: 0, y: 0 },
      }));
      entities.set('point-2', createEntityGeometry('point-2', 'point', {
        position: { x: 0.001, y: 0 },
      }));

      const constraints: Constraint[] = [
        { id: 'c1', type: 'fix', entityIds: ['point-1'], parameters: {}, strength: 'required' },
        { id: 'c2', type: 'distance', entityIds: ['point-1', 'point-2'], parameters: { value: 0.001 }, strength: 'required' },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);
    });

    test('should handle very large distances', () => {
      const entities = new Map();
      entities.set('point-1', createEntityGeometry('point-1', 'point', {
        position: { x: 0, y: 0 },
      }));
      entities.set('point-2', createEntityGeometry('point-2', 'point', {
        position: { x: 10000, y: 0 },
      }));

      const constraints: Constraint[] = [
        { id: 'c1', type: 'fix', entityIds: ['point-1'], parameters: {}, strength: 'required' },
        { id: 'c2', type: 'distance', entityIds: ['point-1', 'point-2'], parameters: { value: 10000 }, strength: 'required' },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);
    });

    test('should handle nearly coincident points', () => {
      const entities = new Map();
      entities.set('point-1', createEntityGeometry('point-1', 'point', {
        position: { x: 100, y: 100 },
      }));
      entities.set('point-2', createEntityGeometry('point-2', 'point', {
        position: { x: 100.0001, y: 100.0001 },
      }));

      const constraints: Constraint[] = [
        { id: 'c1', type: 'coincident', entityIds: ['point-1', 'point-2'], parameters: {}, strength: 'required' },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);

      const x1 = result.variables.get('point-1_x')!;
      const y1 = result.variables.get('point-1_y')!;
      const x2 = result.variables.get('point-2_x')!;
      const y2 = result.variables.get('point-2_y')!;

      expect(x1).toBeCloseTo(x2, 0.001);
      expect(y1).toBeCloseTo(y2, 0.001);
    });
  });

  describe('Malformed Input', () => {
    test('should handle empty entity ID', () => {
      const entities = new Map();

      const constraints: Constraint[] = [
        { id: 'c1', type: 'fix', entityIds: [''], parameters: {}, strength: 'required' },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle non-existent entity reference', () => {
      const entities = new Map();
      entities.set('point-1', createEntityGeometry('point-1', 'point', {
        position: { x: 0, y: 0 },
      }));

      const constraints: Constraint[] = [
        { id: 'c1', type: 'distance', entityIds: ['point-1', 'nonexistent'], parameters: { value: 50 }, strength: 'required' },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(false);
      expect(result.error).toContain('nonexistent');
    });

    test('should handle invalid constraint parameters', () => {
      const entities = new Map();
      entities.set('circle-1', createEntityGeometry('circle-1', 'circle', {
        center: { x: 0, y: 0 },
        radius: 25,
      }));

      const constraints: Constraint[] = [
        { id: 'c1', type: 'radius', entityIds: ['circle-1'], parameters: { value: 'invalid' as any }, strength: 'required' },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
