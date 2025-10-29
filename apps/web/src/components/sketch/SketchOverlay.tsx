/**
 * Sketch Overlay - 2D sketching interface overlaid on 3D viewport
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useSketchStore } from '../../stores/sketchStore';
import { useModelStore } from '../../stores/modelStore';
import { SketchCanvas } from './SketchCanvas';
import type { SketchEntity } from '../../types/sketch';
import { project3DToScreen, projectScreenTo3DPlane } from '../../lib/3d/projection';

interface SketchOverlayProps {
  camera: THREE.PerspectiveCamera;
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  width: number;
  height: number;
}

export function SketchOverlay({ camera, gl, scene, width, height }: SketchOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePlane, setActivePlane] = useState<THREE.Mesh | null>(null);
  const [sketchEntities, setSketchEntities] = useState<SketchEntity[]>([]);
  
  const { activeSketchId, getAllEntities, toolState } = useSketchStore();
  const { sketchState } = useModelStore();
  
  // Project 3D entities to 2D canvas
  const projectEntities = useCallback(() => {
    if (!activeSketchId || !activePlane) return [];
    
    const entities = getAllEntities();
    const projected2D: SketchEntity[] = [];
    
    // Get plane transformation matrix
    const planeMatrix = activePlane.matrixWorld;
    const inversePlaneMatrix = planeMatrix.clone().invert();
    
    entities.forEach(entity => {
      // Transform entity from 3D world to 2D plane coordinates
      const projectedEntity = projectEntityToPlane(entity, inversePlaneMatrix);
      if (projectedEntity) {
        projected2D.push(projectedEntity);
      }
    });
    
    return projected2D;
  }, [activeSketchId, activePlane, getAllEntities]);
  
  // Update projected entities when sketch changes
  useEffect(() => {
    const projected = projectEntities();
    setSketchEntities(projected);
  }, [projectEntities]);
  
  // Handle mouse events with 3D projection
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!activePlane || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Project screen coordinates to 3D plane
    const worldPos = projectScreenTo3DPlane(x, y, width, height, camera, activePlane);
    if (worldPos) {
      // Update sketch store with 3D position
      useSketchStore.getState().setCursorPosition({
        x: worldPos.x,
        y: worldPos.y
      });
    }
  }, [activePlane, camera, width, height]);
  
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!activePlane || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Project screen coordinates to 3D plane
    const worldPos = projectScreenTo3DPlane(x, y, width, height, camera, activePlane);
    if (worldPos) {
      // Add point in 3D space
      useSketchStore.getState().addDrawingPoint({
        x: worldPos.x,
        y: worldPos.y
      });
    }
  }, [activePlane, camera, width, height]);
  
  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    >
      {/* 2D Canvas for sketching */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 pointer-events-auto"
        style={{ cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
      />
      
      {/* Sketch Canvas Component */}
      <SketchCanvas 
        width={width} 
        height={height}
        entities={sketchEntities}
        className="absolute inset-0 pointer-events-none"
      />
      
      {/* Sketch Mode Indicator */}
      {activeSketchId && (
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded text-sm">
          Sketch Mode: {activeSketchId}
        </div>
      )}
    </div>
  );
}

// Helper function to project entity from 3D to plane coordinates
function projectEntityToPlane(entity: SketchEntity, planeMatrix: THREE.Matrix4): SketchEntity | null {
  // Create a copy of the entity
  const projected = { ...entity };
  
  // Transform entity points based on entity type
  switch (entity.type) {
    case 'line':
      const start3D = new THREE.Vector3(entity.start.x, entity.start.y, 0);
      const end3D = new THREE.Vector3(entity.end.x, entity.end.y, 0);
      
      start3D.applyMatrix4(planeMatrix);
      end3D.applyMatrix4(planeMatrix);
      
      (projected as any).start = { x: start3D.x, y: start3D.y };
      (projected as any).end = { x: end3D.x, y: end3D.y };
      break;
      
    case 'circle':
    case 'arc':
      const center3D = new THREE.Vector3(entity.center.x, entity.center.y, 0);
      center3D.applyMatrix4(planeMatrix);
      
      (projected as any).center = { x: center3D.x, y: center3D.y };
      break;
      
    case 'point':
      const pos3D = new THREE.Vector3(entity.position.x, entity.position.y, 0);
      pos3D.applyMatrix4(planeMatrix);
      
      (projected as any).position = { x: pos3D.x, y: pos3D.y };
      break;
      
    case 'rectangle':
      const tl3D = new THREE.Vector3(entity.topLeft.x, entity.topLeft.y, 0);
      const br3D = new THREE.Vector3(entity.bottomRight.x, entity.bottomRight.y, 0);
      
      tl3D.applyMatrix4(planeMatrix);
      br3D.applyMatrix4(planeMatrix);
      
      (projected as any).topLeft = { x: tl3D.x, y: tl3D.y };
      (projected as any).bottomRight = { x: br3D.x, y: br3D.y };
      break;
  }
  
  return projected;
}
