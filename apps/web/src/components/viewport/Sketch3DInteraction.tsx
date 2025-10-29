/**
 * Sketch 3D Interaction
 * Handles drawing sketch entities directly in 3D viewport via raycasting
 * Fusion 360-style: click in 3D scene, entities appear on the sketch plane
 */

import { useRef, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SketchPlane } from '@flows/cad-kernel';
import { worldToSketch } from '@flows/cad-kernel';
import { useSketchStore } from '../../stores/sketchStore';

interface Sketch3DInteractionProps {
  plane: SketchPlane;
  enabled: boolean;
}

export function Sketch3DInteraction({ plane, enabled }: Sketch3DInteractionProps) {
  const { camera, raycaster, gl } = useThree();
  const { toolState, addEntity, setIsDrawing, setCursorPosition } = useSketchStore();
  
  const drawingPoints = useRef<THREE.Vector3[]>([]);
  const threePlane = useRef<THREE.Plane>();
  
  // Create Three.js plane for raycasting
  useEffect(() => {
    const normal = new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z).normalize();
    const origin = new THREE.Vector3(plane.origin.x, plane.origin.y, plane.origin.z);
    const distance = -origin.dot(normal);
    threePlane.current = new THREE.Plane(normal, distance);
  }, [plane]);
  
  // Get intersection point with sketch plane from mouse position
  const getIntersectionPoint = useCallback((clientX: number, clientY: number): THREE.Vector3 | null => {
    if (!threePlane.current) return null;
    
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    
    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(threePlane.current, intersection);
    
    return hit;
  }, [camera, raycaster, gl]);
  
  // Convert 3D point to 2D sketch coordinates
  const to2D = useCallback((point3D: THREE.Vector3) => {
    return worldToSketch(
      { x: point3D.x, y: point3D.y, z: point3D.z },
      plane
    );
  }, [plane]);
  
  // Snap point to grid
  const snapToGrid = useCallback((point: { x: number; y: number }, gridSize: number = 10) => {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  }, []);
  
  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!enabled) return;
    
    const point = getIntersectionPoint(event.clientX, event.clientY);
    if (point) {
      let point2D = to2D(point);
      // Snap to grid (10mm grid)
      point2D = snapToGrid(point2D, 10);
      setCursorPosition(point2D);
    }
  }, [enabled, getIntersectionPoint, to2D, snapToGrid, setCursorPosition]);
  
  const handlePointerDown = useCallback((event: PointerEvent) => {
    if (!enabled) return;
    if (event.button !== 0) return; // Only left click
    
    const point = getIntersectionPoint(event.clientX, event.clientY);
    if (!point) return;
    
    let point2D = to2D(point);
    // Snap to grid (10mm grid)
    point2D = snapToGrid(point2D, 10);
    
    switch (toolState.activeTool) {
      case 'line': {
        if (drawingPoints.current.length === 0) {
          // Start line
          drawingPoints.current = [point];
          setIsDrawing(true);
        } else {
          // Finish line
          let start2D = to2D(drawingPoints.current[0]);
          start2D = snapToGrid(start2D, 10);
          
          addEntity({
            type: 'line',
            sketchId: 'active',
            start: start2D,
            end: point2D,
            isConstruction: false,
            isSelected: false,
            isHighlighted: false,
          } as any);
          
          drawingPoints.current = [];
          setIsDrawing(false);
        }
        break;
      }
      
      case 'circle': {
        if (drawingPoints.current.length === 0) {
          // Start circle (center)
          drawingPoints.current = [point];
          setIsDrawing(true);
        } else {
          // Finish circle (radius)
          const center2D = to2D(drawingPoints.current[0]);
          const radius = Math.sqrt(
            Math.pow(point2D.x - center2D.x, 2) + 
            Math.pow(point2D.y - center2D.y, 2)
          );
          
          addEntity({
            type: 'circle',
            sketchId: 'active',
            center: center2D,
            radius,
            isConstruction: false,
            isSelected: false,
            isHighlighted: false,
          } as any);
          
          drawingPoints.current = [];
          setIsDrawing(false);
        }
        break;
      }
      
      case 'rectangle': {
        if (drawingPoints.current.length === 0) {
          // Start rectangle
          drawingPoints.current = [point];
          setIsDrawing(true);
        } else {
          // Finish rectangle
          const p1 = to2D(drawingPoints.current[0]);
          const p2 = point2D;
          
          addEntity({
            type: 'rectangle',
            sketchId: 'active',
            topLeft: { x: Math.min(p1.x, p2.x), y: Math.max(p1.y, p2.y) },
            bottomRight: { x: Math.max(p1.x, p2.x), y: Math.min(p1.y, p2.y) },
            isConstruction: false,
            isSelected: false,
            isHighlighted: false,
          } as any);
          
          drawingPoints.current = [];
          setIsDrawing(false);
        }
        break;
      }
      
      case 'arc': {
        if (drawingPoints.current.length === 0) {
          // Start point
          drawingPoints.current = [point];
          setIsDrawing(true);
        } else if (drawingPoints.current.length === 1) {
          // End point
          drawingPoints.current.push(point);
        } else {
          // Mid point - complete arc
          const start2D = to2D(drawingPoints.current[0]);
          const end2D = to2D(drawingPoints.current[1]);
          const mid2D = point2D;
          
          // Calculate arc from 3 points
          // For now, simple approximation
          const centerX = (start2D.x + end2D.x) / 2;
          const centerY = (start2D.y + end2D.y) / 2;
          const radius = Math.sqrt(
            Math.pow(mid2D.x - centerX, 2) + 
            Math.pow(mid2D.y - centerY, 2)
          );
          
          const startAngle = Math.atan2(start2D.y - centerY, start2D.x - centerX);
          const endAngle = Math.atan2(end2D.y - centerY, end2D.x - centerX);
          
          addEntity({
            type: 'arc',
            sketchId: 'active',
            center: { x: centerX, y: centerY },
            radius,
            startAngle,
            endAngle,
            isConstruction: false,
            isSelected: false,
            isHighlighted: false,
          } as any);
          
          drawingPoints.current = [];
          setIsDrawing(false);
        }
        break;
      }
      
      case 'point': {
        addEntity({
          type: 'point',
          sketchId: 'active',
          position: point2D,
          isConstruction: false,
          isSelected: false,
          isHighlighted: false,
        } as any);
        break;
      }
    }
  }, [enabled, toolState, getIntersectionPoint, to2D, addEntity, setIsDrawing]);
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    if (event.key === 'Escape') {
      // Cancel current operation
      drawingPoints.current = [];
      setIsDrawing(false);
    }
  }, [enabled, setIsDrawing]);
  
  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;
    
    const canvas = gl.domElement;
    
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handlePointerMove, handlePointerDown, handleKeyDown, gl]);
  
  return null; // This component only handles interaction, no rendering
}
