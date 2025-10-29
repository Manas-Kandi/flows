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
    
    case 'ellipse': {
      const ellipse = geometry as { center: Point2D; majorAxis: number; minorAxis: number; rotation: number };
      variables.set('center_x', { id: `${entityId}_center_x`, value: ellipse.center.x });
      variables.set('center_y', { id: `${entityId}_center_y`, value: ellipse.center.y });
      variables.set('major', { id: `${entityId}_major`, value: ellipse.majorAxis });
      variables.set('minor', { id: `${entityId}_minor`, value: ellipse.minorAxis });
      variables.set('rotation', { id: `${entityId}_rotation`, value: ellipse.rotation });
      break;
    }
    
    case 'slot': {
      const slot = geometry as { start: Point2D; end: Point2D; width: number };
      variables.set('start_x', { id: `${entityId}_start_x`, value: slot.start.x });
      variables.set('start_y', { id: `${entityId}_start_y`, value: slot.start.y });
      variables.set('end_x', { id: `${entityId}_end_x`, value: slot.end.x });
      variables.set('end_y', { id: `${entityId}_end_y`, value: slot.end.y });
      variables.set('width', { id: `${entityId}_width`, value: slot.width });
      break;
    }
    
    case 'polygon': {
      const polygon = geometry as { center: Point2D; radius: number; rotation: number };
      variables.set('center_x', { id: `${entityId}_center_x`, value: polygon.center.x });
      variables.set('center_y', { id: `${entityId}_center_y`, value: polygon.center.y });
      variables.set('radius', { id: `${entityId}_radius`, value: polygon.radius });
      variables.set('rotation', { id: `${entityId}_rotation`, value: polygon.rotation });
      break;
    }
    
    case 'spline': {
      const spline = geometry as { controlPoints: Point2D[] };
      spline.controlPoints.forEach((point, index) => {
        variables.set(`cp_${index}_x`, { id: `${entityId}_cp_${index}_x`, value: point.x });
        variables.set(`cp_${index}_y`, { id: `${entityId}_cp_${index}_y`, value: point.y });
      });
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
    
    case 'ellipse': {
      const centerX = results.get(`${entityId}_center_x`);
      const centerY = results.get(`${entityId}_center_y`);
      const major = results.get(`${entityId}_major`);
      const minor = results.get(`${entityId}_minor`);
      const rotation = results.get(`${entityId}_rotation`);
      if (
        centerX !== undefined &&
        centerY !== undefined &&
        major !== undefined &&
        minor !== undefined &&
        rotation !== undefined
      ) {
        return {
          ...entity,
          center: { x: centerX, y: centerY },
          majorAxis: major,
          minorAxis: minor,
          rotation,
        };
      }
      break;
    }
    
    case 'slot': {
      const startX = results.get(`${entityId}_start_x`);
      const startY = results.get(`${entityId}_start_y`);
      const endX = results.get(`${entityId}_end_x`);
      const endY = results.get(`${entityId}_end_y`);
      const width = results.get(`${entityId}_width`);
      if (
        startX !== undefined &&
        startY !== undefined &&
        endX !== undefined &&
        endY !== undefined &&
        width !== undefined
      ) {
        return {
          ...entity,
          start: { x: startX, y: startY },
          end: { x: endX, y: endY },
          width,
        };
      }
      break;
    }
    
    case 'polygon': {
      const centerX = results.get(`${entityId}_center_x`);
      const centerY = results.get(`${entityId}_center_y`);
      const radius = results.get(`${entityId}_radius`);
      const rotation = results.get(`${entityId}_rotation`);
      if (
        centerX !== undefined &&
        centerY !== undefined &&
        radius !== undefined &&
        rotation !== undefined
      ) {
        return {
          ...entity,
          center: { x: centerX, y: centerY },
          radius,
          rotation,
        };
      }
      break;
    }
    
    case 'spline': {
      const controlPoints = (entity.controlPoints || []).map((point: Point2D, index: number) => {
        const x = results.get(`${entityId}_cp_${index}_x`);
        const y = results.get(`${entityId}_cp_${index}_y`);
        return {
          x: x !== undefined ? x : point.x,
          y: y !== undefined ? y : point.y,
        };
      });
      return {
        ...entity,
        controlPoints,
      };
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
    case 'ellipse':
      return Math.min(dof, 5); // cx, cy, major, minor, rotation
    case 'slot':
      return Math.min(dof, 5); // start (2), end (2), width
    case 'polygon':
      return Math.min(dof, 4); // center (2), radius, rotation
    case 'spline':
      return dof; // depends on control points
    default:
      return dof;
  }
}
