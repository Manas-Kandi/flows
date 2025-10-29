/**
 * Sketch Renderer
 * Renders 2D sketch entities in 3D space on a sketch plane
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { SketchPlane } from '@flows/cad-kernel';
import { sketchToWorld } from '@flows/cad-kernel';
import { useModelStore } from '../../stores/modelStore';
import { SketchMaterials } from '../../rendering/MaterialSystem';

interface SketchRendererProps {
  sketchId: string;
  plane: SketchPlane;
  layer: number;
}

export function SketchRenderer({ sketchId, plane, layer }: SketchRendererProps) {
  const sketch = useModelStore((state) => 
    state.sketches.get(sketchId)
  );
  
  if (!sketch) return null;
  
  return (
    <group name={`sketch-${sketchId}`} layers={layer}>
      {/* Render each sketch entity */}
      {sketch.entities.map((entity) => (
        <SketchEntity
          key={entity.id}
          entity={entity}
          plane={plane}
        />
      ))}
    </group>
  );
}

interface SketchEntityProps {
  entity: any; // SketchEntity from store
  plane: SketchPlane;
}

function SketchEntity({ entity, plane }: SketchEntityProps) {
  const geometry = useMemo(() => {
    return createEntityGeometry(entity, plane);
  }, [entity, plane]);
  
  if (!geometry) return null;
  
  // Select material based on entity state
  let material = SketchMaterials.normal;
  if (entity.selected) {
    material = SketchMaterials.selected;
  } else if (entity.isConstruction) {
    material = SketchMaterials.construction;
  }
  
  return <primitive object={geometry} material={material} />;
}

/**
 * Create Three.js geometry from sketch entity
 */
function createEntityGeometry(
  entity: any,
  plane: SketchPlane
): THREE.Object3D | null {
  switch (entity.type) {
    case 'line':
      return createLineGeometry(entity, plane);
    
    case 'circle':
      return createCircleGeometry(entity, plane);
    
    case 'arc':
      return createArcGeometry(entity, plane);
    
    case 'rectangle':
      return createRectangleGeometry(entity, plane);
    
    default:
      return null;
  }
}

/**
 * Create line geometry
 */
function createLineGeometry(entity: any, plane: SketchPlane): THREE.Line {
  if (!entity.points || entity.points.length < 2) {
    return new THREE.Line();
  }
  
  const points = entity.points.map((p: any) => {
    const world = sketchToWorld(p, plane);
    return new THREE.Vector3(world.x, world.y, world.z);
  });
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry);
}

/**
 * Create circle geometry
 */
function createCircleGeometry(entity: any, plane: SketchPlane): THREE.Line {
  if (!entity.center || !entity.radius) {
    return new THREE.Line();
  }
  
  const segments = 64;
  const points: THREE.Vector3[] = [];
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = entity.center.x + Math.cos(angle) * entity.radius;
    const y = entity.center.y + Math.sin(angle) * entity.radius;
    
    const world = sketchToWorld({ x, y }, plane);
    points.push(new THREE.Vector3(world.x, world.y, world.z));
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry);
}

/**
 * Create arc geometry
 */
function createArcGeometry(entity: any, plane: SketchPlane): THREE.Line {
  if (!entity.center || !entity.radius || !entity.startAngle || !entity.endAngle) {
    return new THREE.Line();
  }
  
  const segments = 32;
  const points: THREE.Vector3[] = [];
  const startAngle = entity.startAngle;
  const endAngle = entity.endAngle;
  const deltaAngle = endAngle - startAngle;
  
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (i / segments) * deltaAngle;
    const x = entity.center.x + Math.cos(angle) * entity.radius;
    const y = entity.center.y + Math.sin(angle) * entity.radius;
    
    const world = sketchToWorld({ x, y }, plane);
    points.push(new THREE.Vector3(world.x, world.y, world.z));
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry);
}

/**
 * Create rectangle geometry
 */
function createRectangleGeometry(entity: any, plane: SketchPlane): THREE.Line {
  if (!entity.points || entity.points.length < 2) {
    return new THREE.Line();
  }
  
  const p1 = entity.points[0];
  const p2 = entity.points[1];
  
  // Create four corners
  const corners = [
    { x: p1.x, y: p1.y },
    { x: p2.x, y: p1.y },
    { x: p2.x, y: p2.y },
    { x: p1.x, y: p2.y },
    { x: p1.x, y: p1.y }, // Close the loop
  ];
  
  const points = corners.map(corner => {
    const world = sketchToWorld(corner, plane);
    return new THREE.Vector3(world.x, world.y, world.z);
  });
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry);
}
