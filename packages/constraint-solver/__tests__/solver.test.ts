import { describe, test, expect, beforeEach } from 'vitest';
import { ConstraintSolver } from '../src/solver';
import type { ConstraintSystem, EntityGeometry, Constraint } from '../src/types';
import { createEntityGeometry } from '../src/geometry';

describe('ConstraintSolver', () => {
  let solver: ConstraintSolver;

  beforeEach(() => {
    solver = new ConstraintSolver();
  });

  describe('Basic Solving', () => {
    test('should solve empty system successfully', () => {
      const system: ConstraintSystem = {
        entities: new Map(),
        constraints: [],
      };

      const result = solver.solve(system);

      expect(result.success).toBe(true);
      expect(result.variables.size).toBe(0);
    });

    test('should solve system with single unconstrained line', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('line-1', createEntityGeometry('line-1', 'line', {
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
      }));

      const system: ConstraintSystem = {
        entities,
        constraints: [],
      };

      const result = solver.solve(system);

      expect(result.success).toBe(true);
      expect(result.variables.size).toBeGreaterThan(0);
    });
  });

  describe('Coincident Constraint', () => {
    test('should merge two points to same location', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('point-1', createEntityGeometry('point-1', 'point', {
        position: { x: 0, y: 0 },
      }));
      entities.set('point-2', createEntityGeometry('point-2', 'point', {
        position: { x: 10, y: 10 },
      }));

      const constraints: Constraint[] = [
        {
          id: 'c1',
          type: 'coincident',
          entityIds: ['point-1', 'point-2'],
          parameters: {},
          strength: 'required',
        },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);

      // Both points should have same x and y values
      const x1 = result.variables.get('point-1_x');
      const y1 = result.variables.get('point-1_y');
      const x2 = result.variables.get('point-2_x');
      const y2 = result.variables.get('point-2_y');

      expect(x1).toBeCloseTo(x2!, 0.001);
      expect(y1).toBeCloseTo(y2!, 0.001);
    });

    test('should handle coincident on line endpoints', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('line-1', createEntityGeometry('line-1', 'line', {
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
      }));
      entities.set('line-2', createEntityGeometry('line-2', 'line', {
        start: { x: 105, y: 5 },
        end: { x: 105, y: 100 },
      }));

      const constraints: Constraint[] = [
        {
          id: 'c1',
          type: 'coincident',
          entityIds: ['line-1', 'line-2'],
          parameters: { point1: 'end', point2: 'start' },
          strength: 'required',
        },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);

      // Line 1 end should match Line 2 start
      const line1EndX = result.variables.get('line-1_endX');
      const line1EndY = result.variables.get('line-1_endY');
      const line2StartX = result.variables.get('line-2_startX');
      const line2StartY = result.variables.get('line-2_startY');

      expect(line1EndX).toBeCloseTo(line2StartX!, 0.001);
      expect(line1EndY).toBeCloseTo(line2StartY!, 0.001);
    });
  });

  describe('Horizontal/Vertical Constraints', () => {
    test('should make line horizontal', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('line-1', createEntityGeometry('line-1', 'line', {
        start: { x: 0, y: 0 },
        end: { x: 100, y: 10 }, // Slightly tilted
      }));

      const constraints: Constraint[] = [
        {
          id: 'c1',
          type: 'horizontal',
          entityIds: ['line-1'],
          parameters: {},
          strength: 'required',
        },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);

      // Y coordinates should be equal
      const startY = result.variables.get('line-1_startY');
      const endY = result.variables.get('line-1_endY');

      expect(startY).toBeCloseTo(endY!, 0.001);
    });

    test('should make line vertical', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('line-1', createEntityGeometry('line-1', 'line', {
        start: { x: 0, y: 0 },
        end: { x: 10, y: 100 }, // Slightly tilted
      }));

      const constraints: Constraint[] = [
        {
          id: 'c1',
          type: 'vertical',
          entityIds: ['line-1'],
          parameters: {},
          strength: 'required',
        },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);

      // X coordinates should be equal
      const startX = result.variables.get('line-1_startX');
      const endX = result.variables.get('line-1_endX');

      expect(startX).toBeCloseTo(endX!, 0.001);
    });
  });

  describe('Distance Constraint', () => {
    test('should maintain fixed distance between points', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('point-1', createEntityGeometry('point-1', 'point', {
        position: { x: 0, y: 0 },
      }));
      entities.set('point-2', createEntityGeometry('point-2', 'point', {
        position: { x: 30, y: 40 },
      }));

      const constraints: Constraint[] = [
        {
          id: 'c1',
          type: 'fix',
          entityIds: ['point-1'],
          parameters: {},
          strength: 'required',
        },
        {
          id: 'c2',
          type: 'distance',
          entityIds: ['point-1', 'point-2'],
          parameters: { value: 50 },
          strength: 'required',
        },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);

      const x1 = result.variables.get('point-1_x')!;
      const y1 = result.variables.get('point-1_y')!;
      const x2 = result.variables.get('point-2_x')!;
      const y2 = result.variables.get('point-2_y')!;

      const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      expect(distance).toBeCloseTo(50, 0.001);
    });

    test('should update when value changes', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('point-1', createEntityGeometry('point-1', 'point', {
        position: { x: 0, y: 0 },
      }));
      entities.set('point-2', createEntityGeometry('point-2', 'point', {
        position: { x: 50, y: 0 },
      }));

      // First solve with distance 50
      let constraints: Constraint[] = [
        {
          id: 'c1',
          type: 'fix',
          entityIds: ['point-1'],
          parameters: {},
          strength: 'required',
        },
        {
          id: 'c2',
          type: 'distance',
          entityIds: ['point-1', 'point-2'],
          parameters: { value: 50 },
          strength: 'required',
        },
      ];

      let result = solver.solve({ entities, constraints });
      expect(result.success).toBe(true);

      let x2 = result.variables.get('point-2_x')!;
      let y2 = result.variables.get('point-2_y')!;
      let distance = Math.sqrt(x2 ** 2 + y2 ** 2);
      expect(distance).toBeCloseTo(50, 0.001);

      // Now solve with distance 100
      constraints = [
        {
          id: 'c1',
          type: 'fix',
          entityIds: ['point-1'],
          parameters: {},
          strength: 'required',
        },
        {
          id: 'c2',
          type: 'distance',
          entityIds: ['point-1', 'point-2'],
          parameters: { value: 100 },
          strength: 'required',
        },
      ];

      result = solver.solve({ entities, constraints });
      expect(result.success).toBe(true);

      x2 = result.variables.get('point-2_x')!;
      y2 = result.variables.get('point-2_y')!;
      distance = Math.sqrt(x2 ** 2 + y2 ** 2);
      expect(distance).toBeCloseTo(100, 0.001);
    });
  });

  describe('Parallel/Perpendicular Constraints', () => {
    test('should make lines parallel', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('line-1', createEntityGeometry('line-1', 'line', {
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
      }));
      entities.set('line-2', createEntityGeometry('line-2', 'line', {
        start: { x: 0, y: 50 },
        end: { x: 90, y: 60 }, // Slightly tilted
      }));

      const constraints: Constraint[] = [
        {
          id: 'c1',
          type: 'horizontal',
          entityIds: ['line-1'],
          parameters: {},
          strength: 'required',
        },
        {
          id: 'c2',
          type: 'parallel',
          entityIds: ['line-1', 'line-2'],
          parameters: {},
          strength: 'required',
        },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);

      // Both lines should be horizontal
      const line1StartY = result.variables.get('line-1_startY')!;
      const line1EndY = result.variables.get('line-1_endY')!;
      const line2StartY = result.variables.get('line-2_startY')!;
      const line2EndY = result.variables.get('line-2_endY')!;

      expect(line1StartY).toBeCloseTo(line1EndY, 0.001);
      expect(line2StartY).toBeCloseTo(line2EndY, 0.001);
    });

    test('should make lines perpendicular', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('line-1', createEntityGeometry('line-1', 'line', {
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
      }));
      entities.set('line-2', createEntityGeometry('line-2', 'line', {
        start: { x: 50, y: 0 },
        end: { x: 50, y: 50 },
      }));

      const constraints: Constraint[] = [
        {
          id: 'c1',
          type: 'horizontal',
          entityIds: ['line-1'],
          parameters: {},
          strength: 'required',
        },
        {
          id: 'c2',
          type: 'perpendicular',
          entityIds: ['line-1', 'line-2'],
          parameters: {},
          strength: 'required',
        },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);

      // Line 1 should be horizontal, Line 2 should be vertical
      const line2StartX = result.variables.get('line-2_startX')!;
      const line2EndX = result.variables.get('line-2_endX')!;

      expect(line2StartX).toBeCloseTo(line2EndX, 0.001);
    });
  });

  describe('Circle Constraints', () => {
    test('should set circle radius', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('circle-1', createEntityGeometry('circle-1', 'circle', {
        center: { x: 50, y: 50 },
        radius: 10,
      }));

      const constraints: Constraint[] = [
        {
          id: 'c1',
          type: 'radius',
          entityIds: ['circle-1'],
          parameters: { value: 25 },
          strength: 'required',
        },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);

      const radius = result.variables.get('circle-1_radius')!;
      expect(radius).toBeCloseTo(25, 0.001);
    });

    test('should set circle diameter', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('circle-1', createEntityGeometry('circle-1', 'circle', {
        center: { x: 50, y: 50 },
        radius: 10,
      }));

      const constraints: Constraint[] = [
        {
          id: 'c1',
          type: 'diameter',
          entityIds: ['circle-1'],
          parameters: { value: 100 },
          strength: 'required',
        },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);

      const radius = result.variables.get('circle-1_radius')!;
      expect(radius).toBeCloseTo(50, 0.001); // diameter / 2
    });

    test('should make circles concentric', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('circle-1', createEntityGeometry('circle-1', 'circle', {
        center: { x: 0, y: 0 },
        radius: 25,
      }));
      entities.set('circle-2', createEntityGeometry('circle-2', 'circle', {
        center: { x: 10, y: 10 },
        radius: 35,
      }));

      const constraints: Constraint[] = [
        {
          id: 'c1',
          type: 'fix',
          entityIds: ['circle-1'],
          parameters: {},
          strength: 'required',
        },
        {
          id: 'c2',
          type: 'concentric',
          entityIds: ['circle-1', 'circle-2'],
          parameters: {},
          strength: 'required',
        },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);

      // Both circles should have same center
      const c1X = result.variables.get('circle-1_centerX')!;
      const c1Y = result.variables.get('circle-1_centerY')!;
      const c2X = result.variables.get('circle-2_centerX')!;
      const c2Y = result.variables.get('circle-2_centerY')!;

      expect(c1X).toBeCloseTo(c2X, 0.001);
      expect(c1Y).toBeCloseTo(c2Y, 0.001);
    });
  });

  describe('Fix Constraint', () => {
    test('should lock point position', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('point-1', createEntityGeometry('point-1', 'point', {
        position: { x: 100, y: 50 },
      }));

      const constraints: Constraint[] = [
        {
          id: 'c1',
          type: 'fix',
          entityIds: ['point-1'],
          parameters: {},
          strength: 'required',
        },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);

      const x = result.variables.get('point-1_x')!;
      const y = result.variables.get('point-1_y')!;

      expect(x).toBeCloseTo(100, 0.001);
      expect(y).toBeCloseTo(50, 0.001);
    });
  });

  describe('Equal Constraint', () => {
    test('should make lines equal length', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('line-1', createEntityGeometry('line-1', 'line', {
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
      }));
      entities.set('line-2', createEntityGeometry('line-2', 'line', {
        start: { x: 0, y: 50 },
        end: { x: 50, y: 50 },
      }));

      const constraints: Constraint[] = [
        {
          id: 'c1',
          type: 'horizontal',
          entityIds: ['line-1'],
          parameters: {},
          strength: 'required',
        },
        {
          id: 'c2',
          type: 'horizontal',
          entityIds: ['line-2'],
          parameters: {},
          strength: 'required',
        },
        {
          id: 'c3',
          type: 'equal',
          entityIds: ['line-1', 'line-2'],
          parameters: {},
          strength: 'required',
        },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);

      const line1StartX = result.variables.get('line-1_startX')!;
      const line1EndX = result.variables.get('line-1_endX')!;
      const line2StartX = result.variables.get('line-2_startX')!;
      const line2EndX = result.variables.get('line-2_endX')!;

      const length1 = Math.abs(line1EndX - line1StartX);
      const length2 = Math.abs(line2EndX - line2StartX);

      expect(length1).toBeCloseTo(length2, 0.001);
    });

    test('should make circles equal radius', () => {
      const entities = new Map<string, EntityGeometry>();
      entities.set('circle-1', createEntityGeometry('circle-1', 'circle', {
        center: { x: 0, y: 0 },
        radius: 25,
      }));
      entities.set('circle-2', createEntityGeometry('circle-2', 'circle', {
        center: { x: 100, y: 0 },
        radius: 40,
      }));

      const constraints: Constraint[] = [
        {
          id: 'c1',
          type: 'equal',
          entityIds: ['circle-1', 'circle-2'],
          parameters: {},
          strength: 'required',
        },
      ];

      const system: ConstraintSystem = { entities, constraints };
      const result = solver.solve(system);

      expect(result.success).toBe(true);

      const r1 = result.variables.get('circle-1_radius')!;
      const r2 = result.variables.get('circle-2_radius')!;

      expect(r1).toBeCloseTo(r2, 0.001);
    });
  });
});
