/**
 * Geometric constraint solver using Kiwi.js
 */

import { Solver, Variable, Constraint as KiwiConstraint, Expression, Strength, Operator } from 'kiwi.js';
import type { 
  Constraint, 
  ConstraintSystem, 
  EntityGeometry, 
  SolverResult, 
  SolverVariable,
  Point2D 
} from './types';

export class ConstraintSolver {
  private solver: Solver;
  private variables: Map<string, Variable> = new Map();
  
  constructor() {
    this.solver = new Solver();
  }
  
  /**
   * Solve a constraint system
   */
  solve(system: ConstraintSystem): SolverResult {
    try {
      // Clear previous solver state
      this.solver = new Solver();
      this.variables.clear();
      
      // Create variables for all entity parameters
      this.createVariables(system.entities);
      
      // Set initial values for all variables
      this.setInitialValues(system.entities);
      
      // Add constraints to solver
      this.addConstraints(system.constraints, system.entities);
      
      // Update variables (this solves the system)
      this.solver.updateVariables();
      
      // Extract results
      const result = new Map<string, number>();
      for (const [id, variable] of this.variables) {
        result.set(id, variable.value());
      }
      
      return {
        success: true,
        variables: result,
        iterations: 1, // kiwi.js doesn't expose iteration count
      };
    } catch (error) {
      return {
        success: false,
        variables: new Map(),
        error: error instanceof Error ? error.message : 'Unknown error',
        iterations: 0,
      };
    }
  }
  
  /**
   * Create solver variables for entity geometry
   */
  private createVariables(entities: Map<string, EntityGeometry>): void {
    for (const [entityId, entity] of entities) {
      for (const [varId, varDef] of entity.variables) {
        const fullName = `${entityId}_${varId}`;
        const variable = new Variable(fullName);
        
        if (varDef.isFixed) {
          // Fixed variables get strong stay constraint at their initial value
          this.solver.addConstraint(new KiwiConstraint(variable, Operator.Eq, varDef.value, Strength.strong));
        }
        
        this.variables.set(fullName, variable);
      }
    }
  }
  
  /**
   * Set initial values for variables
   */
  private setInitialValues(entities: Map<string, EntityGeometry>): void {
    for (const [entityId, entity] of entities) {
      for (const [varId, varDef] of entity.variables) {
        const fullName = `${entityId}_${varId}`;
        const variable = this.variables.get(fullName);
        if (variable) {
          // Add as edit variable to suggest initial value
          this.solver.addEditVariable(variable, Strength.weak);
          this.solver.suggestValue(variable, varDef.value);
        }
      }
    }
  }
  
  /**
   * Add constraints to the solver
   */
  private addConstraints(constraints: Constraint[], entities: Map<string, EntityGeometry>): void {
    for (const constraint of constraints) {
      this.addConstraint(constraint, entities);
    }
  }
  
  /**
   * Add a single constraint to the solver
   */
  private addConstraint(constraint: Constraint, entities: Map<string, EntityGeometry>): void {
    const strength = this.getKiwiStrength(constraint.strength || 'required');
    
    switch (constraint.type) {
      case 'coincident':
        this.addCoincidentConstraint(constraint, entities, strength);
        break;
      case 'horizontal':
        this.addHorizontalConstraint(constraint, entities, strength);
        break;
      case 'vertical':
        this.addVerticalConstraint(constraint, entities, strength);
        break;
      case 'parallel':
        this.addParallelConstraint(constraint, entities, strength);
        break;
      case 'perpendicular':
        this.addPerpendicularConstraint(constraint, entities, strength);
        break;
      case 'distance':
        this.addDistanceConstraint(constraint, entities, strength);
        break;
      case 'radius':
        this.addRadiusConstraint(constraint, entities, strength);
        break;
      case 'angle':
        this.addAngleConstraint(constraint, entities, strength);
        break;
      case 'fix':
        this.addFixConstraint(constraint, entities, strength);
        break;
      default:
        console.warn(`Unsupported constraint type: ${constraint.type}`);
    }
  }
  
  /**
   * Coincident constraint - two points at same location
   */
  private addCoincidentConstraint(constraint: Constraint, entities: Map<string, EntityGeometry>, strength: number): void {
    const [point1Id, point2Id] = constraint.entityIds;
    
    const x1 = this.variables.get(`${point1Id}_x`);
    const y1 = this.variables.get(`${point1Id}_y`);
    const x2 = this.variables.get(`${point2Id}_x`);
    const y2 = this.variables.get(`${point2Id}_y`);
    
    if (x1 && y1 && x2 && y2) {
      this.solver.addConstraint(new KiwiConstraint(x1, Operator.Eq, x2, strength));
      this.solver.addConstraint(new KiwiConstraint(y1, Operator.Eq, y2, strength));
    }
  }
  
  /**
   * Horizontal constraint - line angle = 0° or 180°
   */
  private addHorizontalConstraint(constraint: Constraint, entities: Map<string, EntityGeometry>, strength: number): void {
    const lineId = constraint.entityIds[0];
    
    const y1 = this.variables.get(`${lineId}_start_y`);
    const y2 = this.variables.get(`${lineId}_end_y`);
    
    if (y1 && y2) {
      this.solver.addConstraint(new KiwiConstraint(y1, Operator.Eq, y2, strength));
    }
  }
  
  /**
   * Vertical constraint - line angle = 90° or 270°
   */
  private addVerticalConstraint(constraint: Constraint, entities: Map<string, EntityGeometry>, strength: number): void {
    const lineId = constraint.entityIds[0];
    
    const x1 = this.variables.get(`${lineId}_start_x`);
    const x2 = this.variables.get(`${lineId}_end_x`);
    
    if (x1 && x2) {
      this.solver.addConstraint(new KiwiConstraint(x1, Operator.Eq, x2, strength));
    }
  }
  
  /**
   * Parallel constraint - two lines have same angle
   */
  private addParallelConstraint(constraint: Constraint, entities: Map<string, EntityGeometry>, strength: number): void {
    const [line1Id, line2Id] = constraint.entityIds;
    
    const x1a = this.variables.get(`${line1Id}_start_x`);
    const y1a = this.variables.get(`${line1Id}_start_y`);
    const x1b = this.variables.get(`${line1Id}_end_x`);
    const y1b = this.variables.get(`${line1Id}_end_y`);
    
    const x2a = this.variables.get(`${line2Id}_start_x`);
    const y2a = this.variables.get(`${line2Id}_start_y`);
    const x2b = this.variables.get(`${line2Id}_end_x`);
    const y2b = this.variables.get(`${line2Id}_end_y`);
    
    if (x1a && y1a && x1b && y1b && x2a && y2a && x2b && y2b) {
      // Create expressions for line directions
      const dx1 = new Expression(x1b).minus(x1a);
      const dy1 = new Expression(y1b).minus(y1a);
      const dx2 = new Expression(x2b).minus(x2a);
      const dy2 = new Expression(y2b).minus(y2a);
      
      // Cross product = 0 for parallel lines: dy1 * dx2 = dy2 * dx1
      // Use tuple notation for multiplication: [coefficient, expression]
      const leftSide = new Expression([1, dy1], [1, dx2]);
      const rightSide = new Expression([1, dy2], [1, dx1]);
      this.solver.addConstraint(new KiwiConstraint(
        leftSide, 
        Operator.Eq,
        rightSide, 
        strength
      ));
    }
  }
  
  /**
   * Perpendicular constraint - lines are at 90°
   */
  private addPerpendicularConstraint(constraint: Constraint, entities: Map<string, EntityGeometry>, strength: number): void {
    const [line1Id, line2Id] = constraint.entityIds;
    
    const x1a = this.variables.get(`${line1Id}_start_x`);
    const y1a = this.variables.get(`${line1Id}_start_y`);
    const x1b = this.variables.get(`${line1Id}_end_x`);
    const y1b = this.variables.get(`${line1Id}_end_y`);
    
    const x2a = this.variables.get(`${line2Id}_start_x`);
    const y2a = this.variables.get(`${line2Id}_start_y`);
    const x2b = this.variables.get(`${line2Id}_end_x`);
    const y2b = this.variables.get(`${line2Id}_end_y`);
    
    if (x1a && y1a && x1b && y1b && x2a && y2a && x2b && y2b) {
      // Create expressions for line directions
      const dx1 = new Expression(x1b).minus(x1a);
      const dy1 = new Expression(y1b).minus(y1a);
      const dx2 = new Expression(x2b).minus(x2a);
      const dy2 = new Expression(y2b).minus(y2a);
      
      // Dot product = 0 for perpendicular lines: dx1 * dx2 + dy1 * dy2 = 0
      // Use tuple notation for multiplication
      const dotProduct = new Expression([1, dx1], [1, dx2], [1, dy1], [1, dy2]);
      this.solver.addConstraint(new KiwiConstraint(
        dotProduct, 
        Operator.Eq, 
        0, 
        strength
      ));
    }
  }
  
  /**
   * Distance constraint - fixed distance between two points
   */
  private addDistanceConstraint(constraint: Constraint, entities: Map<string, EntityGeometry>, strength: number): void {
    const [point1Id, point2Id] = constraint.entityIds;
    const distance = constraint.parameters.distance;
    
    const x1 = this.variables.get(`${point1Id}_x`);
    const y1 = this.variables.get(`${point1Id}_y`);
    const x2 = this.variables.get(`${point2Id}_x`);
    const y2 = this.variables.get(`${point2Id}_y`);
    
    if (x1 && y1 && x2 && y2) {
      // Distance constraint: (x2 - x1)^2 + (y2 - y1)^2 = distance^2
      const dx = new Expression(x2).minus(x1);
      const dy = new Expression(y2).minus(y1);
      
      // Use tuple notation for squared terms: dx^2 + dy^2
      const distanceSquared = new Expression([1, dx], [1, dx], [1, dy], [1, dy]);
      
      this.solver.addConstraint(new KiwiConstraint(
        distanceSquared, 
        Operator.Eq, 
        distance * distance, 
        strength
      ));
    }
  }
  
  /**
   * Radius constraint - fixed radius for circle/arc
   */
  private addRadiusConstraint(constraint: Constraint, entities: Map<string, EntityGeometry>, strength: number): void {
    const entityId = constraint.entityIds[0];
    const radius = constraint.parameters.radius;
    
    const radiusVar = this.variables.get(`${entityId}_radius`);
    
    if (radiusVar) {
      this.solver.addConstraint(new KiwiConstraint(radiusVar, Operator.Eq, radius, strength));
    }
  }
  
  /**
   * Angle constraint - fixed angle between two lines
   */
  private addAngleConstraint(constraint: Constraint, entities: Map<string, EntityGeometry>, strength: number): void {
    // Simplified implementation - would need more complex math for full angle constraints
    console.warn('Angle constraint not fully implemented');
  }
  
  /**
   * Fix constraint - lock entity position
   */
  private addFixConstraint(constraint: Constraint, entities: Map<string, EntityGeometry>, strength: number): void {
    const entityId = constraint.entityIds[0];
    const entity = entities.get(entityId);
    
    if (entity) {
      for (const [varId] of entity.variables) {
        const variable = this.variables.get(`${entityId}_${varId}`);
        if (variable) {
          // Add a strong constraint to fix the variable at its current value
          this.solver.addConstraint(new KiwiConstraint(variable, Operator.Eq, variable.value(), Strength.strong));
        }
      }
    }
  }
  
  /**
   * Convert constraint strength to Kiwi strength
   */
  private getKiwiStrength(strength: string): number {
    switch (strength) {
      case 'required': return Strength.required;
      case 'strong': return Strength.strong;
      case 'medium': return Strength.medium;
      case 'weak': return Strength.weak;
      default: return Strength.required;
    }
  }
}
