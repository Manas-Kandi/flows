/**
 * Sketch Plane System
 * Handles creation, management, and coordinate conversion for sketch planes
 */

import type { SketchPlane, Vector3, Point2D, Point3D, StandardPlaneName } from './types';

/**
 * Create a normalized vector
 */
export function normalizeVector(v: Vector3): Vector3 {
  const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (length === 0) return { x: 0, y: 0, z: 0 };
  return {
    x: v.x / length,
    y: v.y / length,
    z: v.z / length,
  };
}

/**
 * Calculate dot product of two vectors
 */
export function dot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Calculate cross product of two vectors
 */
export function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Add two vectors
 */
export function add(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  };
}

/**
 * Subtract two vectors
 */
export function subtract(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

/**
 * Multiply vector by scalar
 */
export function scale(v: Vector3, s: number): Vector3 {
  return {
    x: v.x * s,
    y: v.y * s,
    z: v.z * s,
  };
}

/**
 * Create a sketch plane with origin, normal, and local coordinate system
 */
export function createPlane(params: {
  origin: Vector3;
  normal: Vector3;
  xAxis?: Vector3;
  name?: string;
  visible?: boolean;
  size?: number;
}): SketchPlane {
  const { origin, normal, xAxis: providedXAxis, name, visible = true, size = 100 } = params;
  
  // Normalize the normal vector
  const normalizedNormal = normalizeVector(normal);
  
  // Calculate local X and Y axes
  // If X axis is provided, use it; otherwise compute it
  let xAxis: Vector3;
  let yAxis: Vector3;
  
  if (providedXAxis) {
    // Use provided X axis
    xAxis = normalizeVector(providedXAxis);
    // Y axis = normal × X axis
    yAxis = normalizeVector(cross(normalizedNormal, xAxis));
  } else {
    // Choose an arbitrary X axis perpendicular to normal
    // Use world X axis unless normal is parallel to it
    const worldX = { x: 1, y: 0, z: 0 };
    const worldY = { x: 0, y: 1, z: 0 };
    
    const dotX = Math.abs(dot(normalizedNormal, worldX));
    const dotY = Math.abs(dot(normalizedNormal, worldY));
    
    // Use the axis that's more perpendicular to the normal
    const reference = dotX < dotY ? worldX : worldY;
    
    // Y axis = normal × reference
    yAxis = normalizeVector(cross(normalizedNormal, reference));
    // X axis = Y axis × normal
    xAxis = normalizeVector(cross(yAxis, normalizedNormal));
  }
  
  return {
    id: `plane-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'standard',
    origin,
    normal: normalizedNormal,
    xAxis,
    yAxis,
    visible,
    size,
    name,
  };
}

/**
 * Standard planes (XY, XZ, YZ)
 */
export const StandardPlanes: Record<StandardPlaneName, SketchPlane> = {
  // XY Plane (Top view) - normal points up (Z+)
  XY: createPlane({
    origin: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 0, z: 1 },
    xAxis: { x: 1, y: 0, z: 0 },
    name: 'XY Plane (Top)',
    size: 200,
  }),
  
  // XZ Plane (Front view) - normal points toward viewer (Y+)
  XZ: createPlane({
    origin: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
    xAxis: { x: 1, y: 0, z: 0 },
    name: 'XZ Plane (Front)',
    size: 200,
  }),
  
  // YZ Plane (Right view) - normal points right (X+)
  YZ: createPlane({
    origin: { x: 0, y: 0, z: 0 },
    normal: { x: 1, y: 0, z: 0 },
    xAxis: { x: 0, y: 1, z: 0 },
    name: 'YZ Plane (Right)',
    size: 200,
  }),
  
  // Aliases for convenience
  Top: createPlane({
    origin: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 0, z: 1 },
    xAxis: { x: 1, y: 0, z: 0 },
    name: 'Top',
    size: 200,
  }),
  
  Front: createPlane({
    origin: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
    xAxis: { x: 1, y: 0, z: 0 },
    name: 'Front',
    size: 200,
  }),
  
  Right: createPlane({
    origin: { x: 0, y: 0, z: 0 },
    normal: { x: 1, y: 0, z: 0 },
    xAxis: { x: 0, y: 1, z: 0 },
    name: 'Right',
    size: 200,
  }),
};

/**
 * Convert 2D sketch coordinates to 3D world coordinates
 */
export function sketchToWorld(point2D: Point2D, plane: SketchPlane): Point3D {
  // World point = origin + (x * xAxis) + (y * yAxis)
  const xComponent = scale(plane.xAxis, point2D.x);
  const yComponent = scale(plane.yAxis, point2D.y);
  
  return add(plane.origin, add(xComponent, yComponent));
}

/**
 * Convert 3D world coordinates to 2D sketch coordinates
 */
export function worldToSketch(point3D: Point3D, plane: SketchPlane): Point2D {
  // Vector from plane origin to point
  const relative = subtract(point3D, plane.origin);
  
  // Project onto local X and Y axes
  return {
    x: dot(relative, plane.xAxis),
    y: dot(relative, plane.yAxis),
  };
}

/**
 * Create an offset plane parallel to an existing plane
 */
export function createOffsetPlane(
  basePlane: SketchPlane,
  offset: number,
  name?: string
): SketchPlane {
  // New origin is offset along the normal
  const newOrigin = add(basePlane.origin, scale(basePlane.normal, offset));
  
  return {
    ...basePlane,
    id: `plane-offset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'offset',
    origin: newOrigin,
    offset,
    name: name || `${basePlane.name} + ${offset}mm`,
  };
}

/**
 * Get plane by standard name
 */
export function getStandardPlane(name: StandardPlaneName): SketchPlane {
  return StandardPlanes[name];
}

/**
 * Check if a point lies on a plane (within tolerance)
 */
export function isPointOnPlane(
  point: Point3D,
  plane: SketchPlane,
  tolerance: number = 0.001
): boolean {
  const relative = subtract(point, plane.origin);
  const distance = Math.abs(dot(relative, plane.normal));
  return distance < tolerance;
}

/**
 * Project a 3D point onto a plane
 */
export function projectPointOnPlane(point: Point3D, plane: SketchPlane): Point3D {
  const relative = subtract(point, plane.origin);
  const distanceAlongNormal = dot(relative, plane.normal);
  const normalComponent = scale(plane.normal, distanceAlongNormal);
  return subtract(point, normalComponent);
}
