/**
 * Geometry utilities for constraint solver
 */

import type { Point2D, EntityGeometry, SolverVariable } from './types';

/**
 * Create entity geometry from sketch entities
 */
export function createEntityGeometry(entityId: string, entityType: string, geometry: any): EntityGeometry {
  const variables = new Map<string, SolverVariable>();
  
  switch (entityType) {
    case 'point': {
      const point = geometry as Point2D;
      variables.set('x', { id: `${entityId}_x`, value: point.x });
      variables.set('y', { id: `${entityId}_y`, value: point.y });
      break;
    }
    
    case 'line': {
      const line = geometry as { start: Point2D; end: Point2D };
      variables.set('start_x', { id: `${entityId}_start_x`, value: line.start.x });
      variables.set('start_y', { id: `${entityId}_start_y`, value: line.start.y });
      variables.set('end_x', { id: `${entityId}_end_x`, value: line.end.x });
      variables.set('end_y', { id: `${entityId}_end_y`, value: line.end.y });
      break;
    }
    
    case 'circle': {
      const circle = geometry as { center: Point2D; radius: number };
      variables.set('center_x', { id: `${entityId}_center_x`, value: circle.center.x });
      variables.set('center_y', { id: `${entityId}_center_y`, value: circle.center.y });
      variables.set('radius', { id: `${entityId}_radius`, value: circle.radius });
      break;
    }
    
    case 'arc': {
      const arc = geometry as { center: Point2D; radius: number; startAngle: number; endAngle: number };
      variables.set('center_x', { id: `${entityId}_center_x`, value: arc.center.x });
      variables.set('center_y', { id: `${entityId}_center_y`, value: arc.center.y });
      variables.set('radius', { id: `${entityId}_radius`, value: arc.radius });
      variables.set('start_angle', { id: `${entityId}_start_angle`, value: arc.startAngle });
      variables.set('end_angle', { id: `${entityId}_end_angle`, value: arc.endAngle });
      break;
    }
  }
  
  return {
    id: entityId,
    type: entityType as any,
    variables,
  };
}

/**
 * Update entity geometry from solver results
 */
export function updateEntityGeometry(entity: any, entityType: string, results: Map<string, number>): any {
  const entityId = entity.id;
  
  switch (entityType) {
    case 'point': {
      const x = results.get(`${entityId}_x`);
      const y = results.get(`${entityId}_y`);
      if (x !== undefined && y !== undefined) {
        return { ...entity, position: { x, y } };
      }
      break;
    }
    
    case 'line': {
      const startX = results.get(`${entityId}_start_x`);
      const startY = results.get(`${entityId}_start_y`);
      const endX = results.get(`${entityId}_end_x`);
      const endY = results.get(`${entityId}_end_y`);
      
      if (startX !== undefined && startY !== undefined && endX !== undefined && endY !== undefined) {
        return {
          ...entity,
          start: { x: startX, y: startY },
          end: { x: endX, y: endY },
        };
      }
      break;
    }
    
    case 'circle': {
      const centerX = results.get(`${entityId}_center_x`);
      const centerY = results.get(`${entityId}_center_y`);
      const radius = results.get(`${entityId}_radius`);
      
      if (centerX !== undefined && centerY !== undefined && radius !== undefined) {
        return {
          ...entity,
          center: { x: centerX, y: centerY },
          radius,
        };
      }
      break;
    }
    
    case 'arc': {
      const centerX = results.get(`${entityId}_center_x`);
      const centerY = results.get(`${entityId}_center_y`);
      const radius = results.get(`${entityId}_radius`);
      const startAngle = results.get(`${entityId}_start_angle`);
      const endAngle = results.get(`${entityId}_end_angle`);
      
      if (centerX !== undefined && centerY !== undefined && radius !== undefined && 
          startAngle !== undefined && endAngle !== undefined) {
        return {
          ...entity,
          center: { x: centerX, y: centerY },
          radius,
          startAngle,
          endAngle,
        };
      }
      break;
    }
  }
  
  return entity;
}

/**
 * Calculate degrees of freedom for an entity
 */
export function calculateDOF(entity: EntityGeometry): number {
  let dof = 0;
  
  for (const [, variable] of entity.variables) {
    if (!variable.isFixed) {
      dof++;
    }
  }
  
  // Adjust for entity type
  switch (entity.type) {
    case 'point':
      return Math.min(dof, 2); // Max 2 DOF (x, y)
    case 'line':
      return Math.min(dof, 4); // Max 4 DOF (x1, y1, x2, y2)
    case 'circle':
      return Math.min(dof, 3); // Max 3 DOF (cx, cy, r)
    case 'arc':
      return Math.min(dof, 5); // Max 5 DOF (cx, cy, r, start, end)
    default:
      return dof;
  }
}
