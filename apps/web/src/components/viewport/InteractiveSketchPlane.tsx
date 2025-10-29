/**
 * Interactive Sketch Plane
 * Handles drawing interactions directly in 3D viewport on the sketch plane
 */

import { useRef, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SketchPlane } from '@flows/cad-kernel';
import { worldToSketch, sketchToWorld } from '@flows/cad-kernel';
import { useSketchStore } from '../../stores/sketchStore';
import { Line, Circle } from '@react-three/drei';

interface InteractiveSketchPlaneProps {
  plane: SketchPlane;
  sketchId: string;
}

export function InteractiveSketchPlane({ plane, sketchId }: InteractiveSketchPlaneProps) {
  const { camera, raycaster, gl } = useThree();
  const planeRef = useRef<THREE.Mesh>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<THREE.Vector3[]>([]);
  
  const { activeTool, addEntity } = useSketchStore();
  
  // Create Three.js plane for raycasting
  const threePlane = new THREE.Plane(
    new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z),
    -new THREE.Vector3(plane.origin.x, plane.origin.y, plane.origin.z).dot(
      new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z)
    )
  );
  
  const getIntersectionPoint = useCallback((event: any) => {
    const mouse = new THREE.Vector2(
      (event.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(event.clientY / gl.domElement.clientHeight) * 2 + 1
    );
    
    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(threePlane, intersection);
    
    return intersection;
  }, [camera, raycaster, threePlane, gl]);
  
  const handlePointerDown = useCallback((event: any) => {
    const point = getIntersectionPoint(event);
    if (!point) return;
    
    event.stopPropagation();
    
    switch (activeTool) {
      case 'line':
        if (!isDrawing) {
          setCurrentPoints([point]);
          setIsDrawing(true);
        } else {
          // Finish line
          const start2D = worldToSketch(
            { x: currentPoints[0].x, y: currentPoints[0].y, z: currentPoints[0].z },
            plane
          );
          const end2D = worldToSketch(
            { x: point.x, y: point.y, z: point.z },
            plane
          );
          
          addEntity({
            id: `line-${Date.now()}`,
            type: 'line',
            points: [start2D, end2D],
            constraints: [],
            isConstruction: false,
            selected: false,
          });
          
          setCurrentPoints([]);
          setIsDrawing(false);
        }
        break;
        
      case 'circle':
        if (!isDrawing) {
          setCurrentPoints([point]);
          setIsDrawing(true);
        } else {
          // Finish circle
          const center2D = worldToSketch(
            { x: currentPoints[0].x, y: currentPoints[0].y, z: currentPoints[0].z },
            plane
          );
          const edge2D = worldToSketch(
            { x: point.x, y: point.y, z: point.z },
            plane
          );
          
          const radius = Math.sqrt(
            Math.pow(edge2D.x - center2D.x, 2) + Math.pow(edge2D.y - center2D.y, 2)
          );
          
          addEntity({
            id: `circle-${Date.now()}`,
            type: 'circle',
            center: center2D,
            radius,
            constraints: [],
            isConstruction: false,
            selected: false,
          });
          
          setCurrentPoints([]);
          setIsDrawing(false);
        }
        break;
    }
  }, [activeTool, isDrawing, currentPoints, plane, addEntity, getIntersectionPoint]);
  
  const handlePointerMove = useCallback((event: any) => {
    if (!isDrawing) return;
    
    const point = getIntersectionPoint(event);
    if (!point) return;
    
    // Update preview
    setCurrentPoints([currentPoints[0], point]);
  }, [isDrawing, currentPoints, getIntersectionPoint]);
  
  return (
    <group>
      {/* Invisible plane for raycasting */}
      <mesh
        ref={planeRef}
        position={[plane.origin.x, plane.origin.y, plane.origin.z]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <planeGeometry args={[plane.size, plane.size]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      
      {/* Preview of current drawing */}
      {isDrawing && currentPoints.length === 2 && (
        <>
          {activeTool === 'line' && (
            <Line
              points={currentPoints}
              color="#0078D7"
              lineWidth={2}
            />
          )}
          {activeTool === 'circle' && (
            <Circle
              args={[currentPoints[0].distanceTo(currentPoints[1]), 32]}
              position={currentPoints[0]}
              rotation={[
                Math.atan2(plane.normal.y, plane.normal.z),
                Math.atan2(plane.normal.x, plane.normal.z),
                0
              ]}
            >
              <lineBasicMaterial color="#0078D7" />
            </Circle>
          )}
        </>
      )}
    </group>
  );
}
