/**
 * Constraint Solver Diagnostics
 * 
 * Detects and analyzes constraint solver issues:
 * - Over-constrained systems
 * - Conflicting constraints
 * - Degenerate geometry
 * - Circular dependencies
 */

import type { ConstraintSystem, Constraint, EntityGeometry, SolverResult } from './types';

export interface DiagnosticResult {
  issue: 'over_constrained' | 'under_constrained' | 'conflicting' | 'degenerate' | 'circular_dependency';
  severity: 'error' | 'warning' | 'info';
  dofDelta?: number; // Difference from expected DOF
  problematicConstraints?: string[]; // IDs of problematic constraints
  entityId?: string; // For degenerate geometry
  reason: string;
  suggestion: string;
  conflicts?: Constraint[]; // Specific conflicting constraints
}

export interface SolverFailure {
  reason: 'over_constrained' | 'conflicting' | 'degenerate' | 'numerical_instability' | 'unknown';
  problematicConstraints: string[];
  suggestion: string;
  canRevert: boolean;
  details?: string;
}

export class SolverDiagnostics {
  /**
   * Detect over-constrained systems
   */
  detectOverConstrained(system: ConstraintSystem): DiagnosticResult | null {
    const expectedDOF = this.calculateExpectedDOF(system.entities);
    const actualDOF = this.calculateActualDOF(system);
    
    if (actualDOF < 0) {
      const redundantConstraints = this.findRedundantConstraints(system);
      
      return {
        issue: 'over_constrained',
        severity: 'error',
        dofDelta: actualDOF,
        problematicConstraints: redundantConstraints,
        reason: `System is over-constrained by ${Math.abs(actualDOF)} degrees of freedom`,
        suggestion: redundantConstraints.length > 0
          ? `Remove one of these constraints: ${redundantConstraints.join(', ')}`
          : 'Remove some constraints to reduce over-constraint',
      };
    }
    
    if (actualDOF > expectedDOF * 0.5) {
      return {
        issue: 'under_constrained',
        severity: 'warning',
        dofDelta: actualDOF,
        reason: `System is under-constrained with ${actualDOF} degrees of freedom remaining`,
        suggestion: 'Add more constraints to fully define the geometry',
      };
    }
    
    return null;
  }

  /**
   * Detect conflicting constraints
   */
  detectConflicts(system: ConstraintSystem): DiagnosticResult | null {
    const conflicts: Constraint[] = [];
    
    // Check for same entities with different constraint types that conflict
    for (let i = 0; i < system.constraints.length; i++) {
      for (let j = i + 1; j < system.constraints.length; j++) {
        const c1 = system.constraints[i];
        const c2 = system.constraints[j];
        
        if (this.areConflicting(c1, c2, system.entities)) {
          conflicts.push(c1, c2);
        }
      }
    }
    
    if (conflicts.length > 0) {
      return {
        issue: 'conflicting',
        severity: 'error',
        conflicts,
        problematicConstraints: conflicts.map(c => c.id),
        reason: 'Cannot satisfy both constraints simultaneously',
        suggestion: 'Remove or modify one of the conflicting constraints',
      };
    }
    
    return null;
  }

  /**
   * Detect degenerate geometry
   */
  detectDegenerate(system: ConstraintSystem): DiagnosticResult | null {
    for (const [entityId, entity] of system.entities) {
      const issue = this.isDegenerate(entity);
      
      if (issue) {
        return {
          issue: 'degenerate',
          severity: 'error',
          entityId,
          reason: issue,
          suggestion: 'Fix the geometry or remove the entity',
        };
      }
    }
    
    // Check for degenerate constraints
    for (const constraint of system.constraints) {
      if (constraint.type === 'radius' || constraint.type === 'diameter') {
        const value = constraint.parameters.value as number;
        if (value <= 0) {
          return {
            issue: 'degenerate',
            severity: 'error',
            problematicConstraints: [constraint.id],
            reason: `${constraint.type} constraint has non-positive value: ${value}`,
            suggestion: 'Set a positive value for the radius/diameter',
          };
        }
      }
      
      if (constraint.type === 'distance') {
        const value = constraint.parameters.value as number;
        if (value < 0) {
          return {
            issue: 'degenerate',
            severity: 'error',
            problematicConstraints: [constraint.id],
            reason: `Distance constraint has negative value: ${value}`,
            suggestion: 'Set a non-negative value for the distance',
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Detect circular constraint dependencies
   */
  detectCircularDependencies(system: ConstraintSystem): DiagnosticResult | null {
    const graph = this.buildDependencyGraph(system);
    const cycles = this.findCycles(graph);
    
    if (cycles.length > 0) {
      return {
        issue: 'circular_dependency',
        severity: 'warning',
        problematicConstraints: cycles[0],
        reason: `Circular dependency detected in constraints: ${cycles[0].join(' → ')}`,
        suggestion: 'This may be valid (e.g., closed shapes) or indicate a problem',
      };
    }
    
    return null;
  }

  /**
   * Analyze solver failure and provide actionable feedback
   */
  analyzeSolverFailure(result: SolverResult, system: ConstraintSystem): SolverFailure {
    // First check for over-constraint
    const overConstrained = this.detectOverConstrained(system);
    if (overConstrained) {
      return {
        reason: 'over_constrained',
        problematicConstraints: overConstrained.problematicConstraints || [],
        suggestion: overConstrained.suggestion,
        canRevert: true,
        details: overConstrained.reason,
      };
    }
    
    // Check for conflicts
    const conflicts = this.detectConflicts(system);
    if (conflicts) {
      return {
        reason: 'conflicting',
        problematicConstraints: conflicts.problematicConstraints || [],
        suggestion: conflicts.suggestion,
        canRevert: true,
        details: conflicts.reason,
      };
    }
    
    // Check for degenerate geometry
    const degenerate = this.detectDegenerate(system);
    if (degenerate) {
      return {
        reason: 'degenerate',
        problematicConstraints: degenerate.problematicConstraints || [],
        suggestion: degenerate.suggestion,
        canRevert: true,
        details: degenerate.reason,
      };
    }
    
    // Unknown failure
    return {
      reason: 'unknown',
      problematicConstraints: [],
      suggestion: 'Try simplifying the constraint system or check for invalid geometry',
      canRevert: true,
      details: result.error || 'Solver failed for unknown reason',
    };
  }

  /**
   * Calculate expected degrees of freedom for entities
   */
  private calculateExpectedDOF(entities: Map<string, EntityGeometry>): number {
    let dof = 0;
    
    for (const [, entity] of entities) {
      // Count free variables (not fixed)
      for (const [, variable] of entity.variables) {
        if (!variable.isFixed) {
          dof++;
        }
      }
    }
    
    return dof;
  }

  /**
   * Calculate actual degrees of freedom after constraints
   */
  private calculateActualDOF(system: ConstraintSystem): number {
    const expectedDOF = this.calculateExpectedDOF(system.entities);
    
    // Each constraint removes DOF based on its type
    let constrainedDOF = 0;
    
    for (const constraint of system.constraints) {
      constrainedDOF += this.getConstraintDOFRemoval(constraint);
    }
    
    return expectedDOF - constrainedDOF;
  }

  /**
   * Get how many DOF a constraint removes
   */
  private getConstraintDOFRemoval(constraint: Constraint): number {
    const dofMap: Record<string, number> = {
      'coincident': 2,
      'horizontal': 1,
      'vertical': 1,
      'parallel': 1,
      'perpendicular': 1,
      'tangent': 1,
      'equal': 1,
      'concentric': 2,
      'fix': 3, // Locks entity completely
      'midpoint': 2,
      'distance': 1,
      'radius': 1,
      'diameter': 1,
      'angle': 1,
    };
    
    return dofMap[constraint.type] || 0;
  }

  /**
   * Find redundant constraints
   */
  private findRedundantConstraints(system: ConstraintSystem): string[] {
    // Simple heuristic: find constraints on already fully constrained entities
    const redundant: string[] = [];
    const entityConstraintCount = new Map<string, number>();
    
    // Count constraints per entity
    for (const constraint of system.constraints) {
      for (const entityId of constraint.entityIds) {
        const count = entityConstraintCount.get(entityId) || 0;
        entityConstraintCount.set(entityId, count + 1);
      }
    }
    
    // Find entities with excessive constraints
    for (const [entityId, count] of entityConstraintCount) {
      const entity = system.entities.get(entityId);
      if (entity) {
        const maxConstraints = entity.variables.size; // Rough estimate
        if (count > maxConstraints * 1.5) {
          // Find constraints on this entity
          for (const constraint of system.constraints) {
            if (constraint.entityIds.includes(entityId)) {
              redundant.push(constraint.id);
            }
          }
        }
      }
    }
    
    return [...new Set(redundant)]; // Remove duplicates
  }

  /**
   * Check if two constraints are conflicting
   */
  private areConflicting(c1: Constraint, c2: Constraint, entities: Map<string, EntityGeometry>): boolean {
    // Same entities?
    const sameEntities = c1.entityIds.every(id => c2.entityIds.includes(id)) &&
                         c2.entityIds.every(id => c1.entityIds.includes(id));
    
    if (!sameEntities) {
      return false;
    }
    
    // Horizontal + Vertical on same line
    if ((c1.type === 'horizontal' && c2.type === 'vertical') ||
        (c1.type === 'vertical' && c2.type === 'horizontal')) {
      return true;
    }
    
    // Different distance values on same entities
    if (c1.type === 'distance' && c2.type === 'distance') {
      const v1 = c1.parameters.value as number;
      const v2 = c2.parameters.value as number;
      if (Math.abs(v1 - v2) > 0.001) {
        return true;
      }
    }
    
    // Different radius/diameter values on same circle
    if ((c1.type === 'radius' || c1.type === 'diameter') &&
        (c2.type === 'radius' || c2.type === 'diameter')) {
      let v1 = c1.parameters.value as number;
      let v2 = c2.parameters.value as number;
      
      // Convert diameter to radius for comparison
      if (c1.type === 'diameter') v1 /= 2;
      if (c2.type === 'diameter') v2 /= 2;
      
      if (Math.abs(v1 - v2) > 0.001) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if entity geometry is degenerate
   */
  private isDegenerate(entity: EntityGeometry): string | null {
    for (const [varName, variable] of entity.variables) {
      // Check for invalid values
      if (varName === 'radius') {
        if (variable.value <= 0) {
          return `Entity has zero or negative radius: ${variable.value}`;
        }
      }
      
      if (varName.includes('length')) {
        if (variable.value < 0) {
          return `Entity has negative length: ${variable.value}`;
        }
      }
    }
    
    // Check for zero-length lines
    if (entity.variables.has('startX') && entity.variables.has('endX')) {
      const startX = entity.variables.get('startX')!.value;
      const startY = entity.variables.get('startY')!.value;
      const endX = entity.variables.get('endX')!.value;
      const endY = entity.variables.get('endY')!.value;
      
      const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
      if (length < 0.001) {
        return 'Line has zero length';
      }
    }
    
    return null;
  }

  /**
   * Build constraint dependency graph
   */
  private buildDependencyGraph(system: ConstraintSystem): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    
    // Initialize nodes
    for (const constraint of system.constraints) {
      if (!graph.has(constraint.id)) {
        graph.set(constraint.id, new Set());
      }
    }
    
    // Build edges (constraints that share entities)
    for (let i = 0; i < system.constraints.length; i++) {
      for (let j = i + 1; j < system.constraints.length; j++) {
        const c1 = system.constraints[i];
        const c2 = system.constraints[j];
        
        // Check if they share any entities
        const sharesEntity = c1.entityIds.some(id => c2.entityIds.includes(id));
        
        if (sharesEntity) {
          graph.get(c1.id)!.add(c2.id);
          graph.get(c2.id)!.add(c1.id);
        }
      }
    }
    
    return graph;
  }

  /**
   * Find cycles in dependency graph using DFS
   */
  private findCycles(graph: Map<string, Set<string>>): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];
    
    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);
      
      const neighbors = graph.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push(path.slice(cycleStart));
          }
        }
      }
      
      recursionStack.delete(node);
    };
    
    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }
    
    return cycles;
  }
}
