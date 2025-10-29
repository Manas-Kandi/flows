/**
 * 3D Projection Utilities - Convert between 3D world space and 2D screen coordinates
 */

import * as THREE from 'three';
import type { Point2D } from '../../types';

/**
 * Project 3D world coordinates to 2D screen coordinates
 */
export function project3DToScreen(
  worldPos: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number
): { x: number; y: number } | null {
  // Clone the world position to avoid modifying the original
  const pos = worldPos.clone();
  
  // Project to screen coordinates
  pos.project(camera);
  
  // Convert from normalized device coordinates (-1 to 1) to screen coordinates
  const x = (pos.x + 1) * width / 2;
  const y = (-pos.y + 1) * height / 2;
  
  // Check if point is behind camera
  if (pos.z > 1) {
    return null;
  }
  
  return { x, y };
}

/**
 * Project 2D screen coordinates to 3D world coordinates on a plane
 */
export function projectScreenTo3DPlane(
  screenX: number,
  screenY: number,
  width: number,
  height: number,
  camera: THREE.PerspectiveCamera,
  plane: THREE.Mesh
): THREE.Vector3 | null {
  // Convert screen coordinates to normalized device coordinates
  const x = (screenX / width) * 2 - 1;
  const y = -(screenY / height) * 2 + 1;
  
  // Create ray from camera through screen point
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  
  // Intersect ray with plane
  const intersects = raycaster.intersectObject(plane);
  
  if (intersects.length > 0) {
    return intersects[0].point;
  }
  
  return null;
}

/**
 * Project 2D screen coordinates to 3D world coordinates on a specific plane
 */
export function projectScreenToPlane(
  screenX: number,
  screenY: number,
  width: number,
  height: number,
  camera: THREE.PerspectiveCamera,
  planeOrigin: THREE.Vector3,
  planeNormal: THREE.Vector3
): THREE.Vector3 | null {
  // Convert screen coordinates to normalized device coordinates
  const x = (screenX / width) * 2 - 1;
  const y = -(screenY / height) * 2 + 1;
  
  // Create ray from camera through screen point
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  
  // Create invisible plane at specified location
  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  
  // Position and rotate plane
  plane.position.copy(planeOrigin);
  plane.lookAt(planeOrigin.clone().add(planeNormal));
  
  // Intersect ray with plane
  const intersects = raycaster.intersectObject(plane);
  
  if (intersects.length > 0) {
    return intersects[0].point;
  }
  
  return null;
}

/**
 * Transform 2D point from plane coordinates to world coordinates
 */
export function planeToWorld(
  planePoint: Point2D,
  planeMatrix: THREE.Matrix4
): THREE.Vector3 {
  const worldPoint = new THREE.Vector3(planePoint.x, planePoint.y, 0);
  worldPoint.applyMatrix4(planeMatrix);
  return worldPoint;
}

/**
 * Transform 3D point from world coordinates to plane coordinates
 */
export function worldToPlane(
  worldPoint: THREE.Vector3,
  planeMatrix: THREE.Matrix4
): Point2D | null {
  const inverseMatrix = planeMatrix.clone().invert();
  const planePoint = worldPoint.clone().applyMatrix4(inverseMatrix);
  
  return {
    x: planePoint.x,
    y: planePoint.y
  };
}

/**
 * Check if a point is visible to the camera
 */
export function isPointVisible(
  worldPos: THREE.Vector3,
  camera: THREE.PerspectiveCamera
): boolean {
  const pos = worldPos.clone();
  pos.project(camera);
  return pos.z <= 1 && pos.z >= -1;
}

/**
 * Get the normal vector of a face at the current camera angle
 */
export function getSketchPlaneNormal(
  camera: THREE.PerspectiveCamera,
  targetPoint: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
): THREE.Vector3 {
  // Create a plane that faces the camera
  const direction = new THREE.Vector3();
  direction.subVectors(camera.position, targetPoint).normalize();
  
  return direction;
}

/**
 * Create a transformation matrix for a sketch plane
 */
export function createPlaneMatrix(
  origin: THREE.Vector3,
  normal: THREE.Vector3,
  up: THREE.Vector3 = new THREE.Vector3(0, 1, 0)
): THREE.Matrix4 {
  const matrix = new THREE.Matrix4();
  
  // Create coordinate system
  const right = new THREE.Vector3();
  right.crossVectors(normal, up).normalize();
  
  const actualUp = new THREE.Vector3();
  actualUp.crossVectors(right, normal).normalize();
  
  // Create transformation matrix
  matrix.makeBasis(right, actualUp, normal);
  matrix.setPosition(origin);
  
  return matrix;
}
