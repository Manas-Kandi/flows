/**
 * Profile Extraction from Sketches
 * Identifies closed loops and regions for feature creation
 */

import type { Point2D, Profile } from './types';

export interface SketchEntity {
  id: string;
  type: 'line' | 'arc' | 'circle' | 'spline';
  startPoint?: Point2D;
  endPoint?: Point2D;
  center?: Point2D;
  radius?: number;
  controlPoints?: Point2D[];
}

/**
 * Extract closed profiles from sketch entities
 */
export function extractProfiles(entities: SketchEntity[]): Profile[] {
  const profiles: Profile[] = [];
  
  // First, extract closed entities (circles)
  for (const entity of entities) {
    if (entity.type === 'circle' && entity.center && entity.radius) {
      profiles.push(createCircleProfile(entity));
    }
  }
  
  // Then, find connected chains of entities forming closed loops
  const usedEntities = new Set<string>();
  
  for (const entity of entities) {
    if (usedEntities.has(entity.id) || entity.type === 'circle') {
      continue;
    }
    
    const loop = findClosedLoop(entity, entities, usedEntities);
    
    if (loop.length > 0) {
      const profile = createLoopProfile(loop, entities);
      if (profile) {
        profiles.push(profile);
        loop.forEach(id => usedEntities.add(id));
      }
    }
  }
  
  // Classify profiles as inner (holes) or outer
  return classifyProfiles(profiles);
}

/**
 * Find a closed loop starting from an entity
 */
function findClosedLoop(
  startEntity: SketchEntity,
  allEntities: SketchEntity[],
  usedEntities: Set<string>,
  tolerance: number = 0.001
): string[] {
  if (!startEntity.startPoint || !startEntity.endPoint) {
    return [];
  }
  
  const loop: string[] = [startEntity.id];
  let currentPoint = startEntity.endPoint;
  const startPoint = startEntity.startPoint;
  
  let iterations = 0;
  const maxIterations = allEntities.length;
  
  while (iterations < maxIterations) {
    iterations++;
    
    // Check if we've closed the loop
    if (pointsEqual(currentPoint, startPoint, tolerance)) {
      return loop;
    }
    
    // Find next connected entity
    let found = false;
    
    for (const entity of allEntities) {
      if (usedEntities.has(entity.id) || loop.includes(entity.id)) {
        continue;
      }
      
      if (!entity.startPoint || !entity.endPoint) {
        continue;
      }
      
      // Check if entity connects
      if (pointsEqual(currentPoint, entity.startPoint, tolerance)) {
        loop.push(entity.id);
        currentPoint = entity.endPoint;
        found = true;
        break;
      } else if (pointsEqual(currentPoint, entity.endPoint, tolerance)) {
        // Entity is reversed
        loop.push(entity.id);
        currentPoint = entity.startPoint;
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Can't continue, not a closed loop
      return [];
    }
  }
  
  return [];
}

/**
 * Check if two points are equal within tolerance
 */
function pointsEqual(p1: Point2D, p2: Point2D, tolerance: number): boolean {
  return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
}

/**
 * Create profile from circle entity
 */
function createCircleProfile(entity: SketchEntity): Profile {
  if (!entity.center || !entity.radius) {
    throw new Error('Circle entity missing center or radius');
  }
  
  const vertices = createCircleVertices(entity.center, entity.radius, 64);
  const area = Math.PI * entity.radius * entity.radius;
  
  return {
    id: `profile-${entity.id}`,
    entityIds: [entity.id],
    isInner: false,
    area,
    centroid: entity.center,
    vertices,
  };
}

/**
 * Create vertices for circle
 */
function createCircleVertices(center: Point2D, radius: number, segments: number): Point2D[] {
  const vertices: Point2D[] = [];
  
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    vertices.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  }
  
  return vertices;
}

/**
 * Create profile from loop of entities
 */
function createLoopProfile(
  loop: string[],
  entities: SketchEntity[]
): Profile | null {
  const entityMap = new Map(entities.map(e => [e.id, e]));
  const vertices: Point2D[] = [];
  
  for (const entityId of loop) {
    const entity = entityMap.get(entityId);
    if (!entity) continue;
    
    // Add vertices from entity
    const entityVertices = getEntityVertices(entity);
    vertices.push(...entityVertices);
  }
  
  if (vertices.length < 3) {
    return null;
  }
  
  const area = calculatePolygonArea(vertices);
  const centroid = calculateCentroid(vertices);
  
  return {
    id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    entityIds: loop,
    isInner: false,
    area: Math.abs(area),
    centroid,
    vertices,
  };
}

/**
 * Get vertices from entity
 */
function getEntityVertices(entity: SketchEntity, segments: number = 16): Point2D[] {
  switch (entity.type) {
    case 'line':
      return entity.startPoint && entity.endPoint 
        ? [entity.startPoint, entity.endPoint]
        : [];
    
    case 'arc':
      if (!entity.center || !entity.radius || !entity.startPoint || !entity.endPoint) {
        return [];
      }
      return createArcVertices(
        entity.center,
        entity.radius,
        entity.startPoint,
        entity.endPoint,
        segments
      );
    
    case 'spline':
      return entity.controlPoints || [];
    
    default:
      return [];
  }
}

/**
 * Create vertices for arc
 */
function createArcVertices(
  center: Point2D,
  radius: number,
  startPoint: Point2D,
  endPoint: Point2D,
  segments: number
): Point2D[] {
  const vertices: Point2D[] = [];
  
  const startAngle = Math.atan2(startPoint.y - center.y, startPoint.x - center.x);
  const endAngle = Math.atan2(endPoint.y - center.y, endPoint.x - center.x);
  
  let deltaAngle = endAngle - startAngle;
  if (deltaAngle < 0) deltaAngle += Math.PI * 2;
  
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (i / segments) * deltaAngle;
    vertices.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  }
  
  return vertices;
}

/**
 * Calculate polygon area using shoelace formula
 */
function calculatePolygonArea(vertices: Point2D[]): number {
  let area = 0;
  
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  
  return area / 2;
}

/**
 * Calculate centroid of polygon
 */
function calculateCentroid(vertices: Point2D[]): Point2D {
  let cx = 0;
  let cy = 0;
  let area = 0;
  
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    const cross = vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
    cx += (vertices[i].x + vertices[j].x) * cross;
    cy += (vertices[i].y + vertices[j].y) * cross;
    area += cross;
  }
  
  area /= 2;
  const factor = 1 / (6 * area);
  
  return {
    x: cx * factor,
    y: cy * factor,
  };
}

/**
 * Classify profiles as inner or outer based on containment
 */
function classifyProfiles(profiles: Profile[]): Profile[] {
  // Sort by area descending
  profiles.sort((a, b) => b.area - a.area);
  
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      if (isPointInPolygon(profiles[j].centroid, profiles[i].vertices)) {
        profiles[j].isInner = !profiles[i].isInner;
      }
    }
  }
  
  return profiles;
}

/**
 * Check if point is inside polygon using ray casting
 */
function isPointInPolygon(point: Point2D, vertices: Point2D[]): boolean {
  let inside = false;
  
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}
