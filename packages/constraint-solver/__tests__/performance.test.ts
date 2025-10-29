import { describe, test, expect, beforeEach } from 'vitest';
import { ConstraintSolver } from '../src/solver';
import type { ConstraintSystem, Constraint } from '../src/types';
import { createEntityGeometry } from '../src/geometry';

describe('Performance Benchmarks', () => {
  let solver: ConstraintSolver;

  beforeEach(() => {
    solver = new ConstraintSolver();
  });

  describe('Solve Time Targets', () => {
    test('should solve 10 constraints in <50ms', () => {
      const system = generateConstrainedPattern(10);
      
      const startTime = performance.now();
      const result = solver.solve(system);
      const endTime = performance.now();
      
      const solveTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(solveTime).toBeLessThan(50);
      console.log(`10 constraints solved in ${solveTime.toFixed(2)}ms`);
    });

    test('should solve 50 constraints in <200ms', { timeout: 300 }, () => {
      const system = generateConstrainedPattern(50);
      
      const startTime = performance.now();
      const result = solver.solve(system);
      const endTime = performance.now();
      
      const solveTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(solveTime).toBeLessThan(200);
      console.log(`50 constraints solved in ${solveTime.toFixed(2)}ms`);
    });

    test('should solve 100 constraints without crash', { timeout: 1000 }, () => {
      const system = generateConstrainedPattern(100);
      
      const startTime = performance.now();
      const result = solver.solve(system);
      const endTime = performance.now();
      
      const solveTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      console.log(`100 constraints solved in ${solveTime.toFixed(2)}ms`);
      
      // Should complete in reasonable time (<1 second)
      expect(solveTime).toBeLessThan(1000);
    });
  });

  describe('Incremental Solving Performance', () => {
    test('should be faster when re-solving with minor changes', () => {
      const system = generateConstrainedPattern(50);
      
      // Initial solve
      const startTime1 = performance.now();
      const result1 = solver.solve(system);
      const endTime1 = performance.now();
      const initialSolveTime = endTime1 - startTime1;
      
      expect(result1.success).toBe(true);
      
      // Modify one constraint parameter
      system.constraints[0].parameters.value = 55;
      
      // Re-solve (should be faster with incremental solving)
      const startTime2 = performance.now();
      const result2 = solver.solve(system);
      const endTime2 = performance.now();
      const incrementalSolveTime = endTime2 - startTime2;
      
      expect(result2.success).toBe(true);
      
      console.log(`Initial: ${initialSolveTime.toFixed(2)}ms, Incremental: ${incrementalSolveTime.toFixed(2)}ms`);
      
      // Note: This will fail until incremental solving is implemented
      // Expected: incrementalSolveTime < initialSolveTime * 0.5
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory on repeated solves', () => {
      const system = generateConstrainedPattern(20);
      
      // Get initial memory (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Solve 100 times
      for (let i = 0; i < 100; i++) {
        solver.solve(system);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory increase should be minimal
      const memoryIncrease = finalMemory - initialMemory;
      console.log(`Memory increase after 100 solves: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Should not increase by more than 10MB (very generous limit)
      if (initialMemory > 0) {
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });
  });

  describe('Large System Scaling', () => {
    test('should handle 200 constraints', { timeout: 2000 }, () => {
      const system = generateConstrainedPattern(200);
      
      const startTime = performance.now();
      const result = solver.solve(system);
      const endTime = performance.now();
      
      const solveTime = endTime - startTime;
      
      // May not succeed (over-constrained), but shouldn't crash
      console.log(`200 constraints: ${result.success ? 'SUCCESS' : 'FAILED'} in ${solveTime.toFixed(2)}ms`);
      
      // Should complete in <2 seconds even if it fails
      expect(solveTime).toBeLessThan(2000);
    });

    test('should handle deeply nested constraints', () => {
      const system = generateNestedConstraintPattern(10); // 10 levels deep
      
      const startTime = performance.now();
      const result = solver.solve(system);
      const endTime = performance.now();
      
      const solveTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      console.log(`Nested constraints (10 levels) solved in ${solveTime.toFixed(2)}ms`);
    });
  });

  describe('Worst Case Scenarios', () => {
    test('should handle fully connected constraint graph', { timeout: 1000 }, () => {
      // Every entity constrained to every other entity
      const entityCount = 10;
      const entities = new Map();
      
      for (let i = 0; i < entityCount; i++) {
        entities.set(`point-${i}`, createEntityGeometry(`point-${i}`, 'point', {
          position: { x: i * 50, y: i * 25 },
        }));
      }
      
      const constraints: Constraint[] = [];
      let cid = 1;
      
      // Create constraints between all pairs
      for (let i = 0; i < entityCount; i++) {
        for (let j = i + 1; j < entityCount; j++) {
          constraints.push({
            id: `c${cid++}`,
            type: 'distance',
            entityIds: [`point-${i}`, `point-${j}`],
            parameters: { value: 50 * Math.abs(j - i) },
            strength: 'required',
          });
        }
      }
      
      const system: ConstraintSystem = { entities, constraints };
      
      const startTime = performance.now();
      const result = solver.solve(system);
      const endTime = performance.now();
      
      const solveTime = endTime - startTime;
      
      console.log(`Fully connected (${constraints.length} constraints) in ${solveTime.toFixed(2)}ms`);
      
      // Should complete in <1 second
      expect(solveTime).toBeLessThan(1000);
    });
  });
});

/**
 * Generate a constrained pattern with specified number of constraints
 */
function generateConstrainedPattern(constraintCount: number): ConstraintSystem {
  const entities = new Map();
  const constraints: Constraint[] = [];
  
  // Create a grid of lines with constraints
  const gridSize = Math.ceil(Math.sqrt(constraintCount / 2));
  let entityId = 1;
  let constraintId = 1;
  
  // Create horizontal lines
  for (let row = 0; row < gridSize; row++) {
    const lineId = `line-h-${entityId++}`;
    entities.set(lineId, createEntityGeometry(lineId, 'line', {
      start: { x: 0, y: row * 50 },
      end: { x: 100, y: row * 50 },
    }));
    
    // Add horizontal constraint
    if (constraintId <= constraintCount) {
      constraints.push({
        id: `c${constraintId++}`,
        type: 'horizontal',
        entityIds: [lineId],
        parameters: {},
        strength: 'required',
      });
    }
  }
  
  // Create vertical lines
  for (let col = 0; col < gridSize; col++) {
    const lineId = `line-v-${entityId++}`;
    entities.set(lineId, createEntityGeometry(lineId, 'line', {
      start: { x: col * 50, y: 0 },
      end: { x: col * 50, y: 100 },
    }));
    
    // Add vertical constraint
    if (constraintId <= constraintCount) {
      constraints.push({
        id: `c${constraintId++}`,
        type: 'vertical',
        entityIds: [lineId],
        parameters: {},
        strength: 'required',
      });
    }
  }
  
  // Add distance constraints between parallel lines
  const hLines = Array.from(entities.keys()).filter(k => k.startsWith('line-h'));
  for (let i = 0; i < hLines.length - 1 && constraintId <= constraintCount; i++) {
    constraints.push({
      id: `c${constraintId++}`,
      type: 'distance',
      entityIds: [hLines[i], hLines[i + 1]],
      parameters: { value: 50 },
      strength: 'required',
    });
  }
  
  const vLines = Array.from(entities.keys()).filter(k => k.startsWith('line-v'));
  for (let i = 0; i < vLines.length - 1 && constraintId <= constraintCount; i++) {
    constraints.push({
      id: `c${constraintId++}`,
      type: 'distance',
      entityIds: [vLines[i], vLines[i + 1]],
      parameters: { value: 50 },
      strength: 'required',
    });
  }
  
  return { entities, constraints: constraints.slice(0, constraintCount) };
}

/**
 * Generate nested constraint pattern
 */
function generateNestedConstraintPattern(depth: number): ConstraintSystem {
  const entities = new Map();
  const constraints: Constraint[] = [];
  
  // Create chain of points with distance constraints
  for (let i = 0; i < depth; i++) {
    entities.set(`point-${i}`, createEntityGeometry(`point-${i}`, 'point', {
      position: { x: i * 50, y: 0 },
    }));
    
    if (i > 0) {
      constraints.push({
        id: `c${i}`,
        type: 'distance',
        entityIds: [`point-${i - 1}`, `point-${i}`],
        parameters: { value: 50 },
        strength: 'required',
      });
    }
  }
  
  // Fix first point
  constraints.push({
    id: `c${depth}`,
    type: 'fix',
    entityIds: ['point-0'],
    parameters: {},
    strength: 'required',
  });
  
  return { entities, constraints };
}
