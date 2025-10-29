/**
 * Extrude Feature Implementation
 */

import type { ExtrudeParameters, Profile, Vector3, Point3D, SolidGeometry, Face } from '../types';
import { sketchToWorld } from '../planes';
import type { SketchPlane } from '../types';

/**
 * Generate extrude geometry from profile
 */
export function extrudeProfile(
  profile: Profile,
  parameters: ExtrudeParameters,
  plane: SketchPlane
): SolidGeometry {
  const { distance, direction, operation } = parameters;
  
  // Calculate extrusion direction
  let extrusionVector: Vector3;
  
  switch (direction) {
    case 'normal':
      extrusionVector = {
        x: plane.normal.x * distance,
        y: plane.normal.y * distance,
        z: plane.normal.z * distance,
      };
      break;
    
    case 'reverse':
      extrusionVector = {
        x: -plane.normal.x * distance,
        y: -plane.normal.y * distance,
        z: -plane.normal.z * distance,
      };
      break;
    
    case 'symmetric':
      extrusionVector = {
        x: plane.normal.x * (distance / 2),
        y: plane.normal.y * (distance / 2),
        z: plane.normal.z * (distance / 2),
      };
      break;
    
    default:
      extrusionVector = { x: 0, y: 0, z: distance };
  }
  
  // Convert 2D profile vertices to 3D
  const baseVertices: Point3D[] = profile.vertices.map(v2d => 
    sketchToWorld(v2d, plane)
  );
  
  // Create top vertices by translating base vertices
  const topVertices: Point3D[] = baseVertices.map(v => ({
    x: v.x + extrusionVector.x,
    y: v.y + extrusionVector.y,
    z: v.z + extrusionVector.z,
  }));
  
  // For symmetric, also create bottom vertices
  let bottomVertices: Point3D[] = [];
  if (direction === 'symmetric') {
    bottomVertices = baseVertices.map(v => ({
      x: v.x - extrusionVector.x,
      y: v.y - extrusionVector.y,
      z: v.z - extrusionVector.z,
    }));
  }
  
  // Combine all vertices
  const allVertices = direction === 'symmetric'
    ? [...bottomVertices, ...topVertices]
    : [...baseVertices, ...topVertices];
  
  // Generate faces
  const faces = generateExtrudeFaces(
    baseVertices.length,
    direction === 'symmetric'
  );
  
  // Calculate volume
  const volume = calculateExtrudeVolume(profile.area, distance);
  
  return {
    id: `extrude-solid-${Date.now()}`,
    vertices: allVertices,
    faces,
    edges: [], // Will be computed from faces
    volume,
  };
}

/**
 * Generate faces for extruded solid
 */
function generateExtrudeFaces(
  vertexCount: number,
  isSymmetric: boolean
): Face[] {
  const faces: Face[] = [];
  const baseOffset = isSymmetric ? vertexCount : 0;
  const topOffset = isSymmetric ? vertexCount : vertexCount;
  
  // Bottom face (if symmetric, otherwise base face)
  if (isSymmetric) {
    const bottomIndices: number[] = [];
    for (let i = 0; i < vertexCount; i++) {
      bottomIndices.push(i);
    }
    faces.push({
      id: `face-bottom`,
      vertexIndices: bottomIndices,
      normal: { x: 0, y: 0, z: -1 }, // Placeholder
      area: 0, // Will calculate
    });
  } else {
    const baseIndices: number[] = [];
    for (let i = 0; i < vertexCount; i++) {
      baseIndices.push(i);
    }
    faces.push({
      id: `face-base`,
      vertexIndices: baseIndices,
      normal: { x: 0, y: 0, z: -1 },
      area: 0,
    });
  }
  
  // Top face
  const topIndices: number[] = [];
  for (let i = 0; i < vertexCount; i++) {
    topIndices.push(topOffset + i);
  }
  faces.push({
    id: `face-top`,
    vertexIndices: topIndices,
    normal: { x: 0, y: 0, z: 1 },
    area: 0,
  });
  
  // Side faces
  for (let i = 0; i < vertexCount; i++) {
    const next = (i + 1) % vertexCount;
    
    const sideIndices = isSymmetric
      ? [i, next, topOffset + next, topOffset + i]
      : [baseOffset + i, baseOffset + next, topOffset + next, topOffset + i];
    
    faces.push({
      id: `face-side-${i}`,
      vertexIndices: sideIndices,
      normal: { x: 0, y: 0, z: 0 }, // Will calculate
      area: 0,
    });
  }
  
  return faces;
}

/**
 * Calculate volume of extrusion
 */
function calculateExtrudeVolume(baseArea: number, distance: number): number {
  return baseArea * distance;
}

/**
 * Validate extrude parameters
 */
export function validateExtrudeParameters(params: ExtrudeParameters): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (params.distance <= 0) {
    errors.push('Distance must be greater than 0');
  }
  
  if (params.draft && (params.draft < -89 || params.draft > 89)) {
    errors.push('Draft angle must be between -89° and 89°');
  }
  
  if (params.thinFeature?.enabled) {
    if (!params.thinFeature.thickness || params.thinFeature.thickness <= 0) {
      errors.push('Thin feature thickness must be greater than 0');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create default extrude parameters
 */
export function createDefaultExtrudeParameters(): ExtrudeParameters {
  return {
    distance: 10,
    direction: 'normal',
    operation: 'new',
    endType: 'blind',
  };
}
