/**
 * Sketch Plane - 3D plane for 2D sketching in 3D space
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useSketchStore } from '../../stores/sketchStore';
import { useModelStore } from '../../stores/modelStore';

interface SketchPlaneProps {
  plane: 'XY' | 'YZ' | 'XZ' | 'custom';
  position?: [number, number, number];
  rotation?: [number, number, number];
  size?: number;
  visible?: boolean;
}

export function SketchPlane({ 
  plane = 'XY', 
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size = 100,
  visible = true 
}: SketchPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { activeSketchId, sketches } = useSketchStore();
  const { setActiveSketch } = useModelStore();
  
  // Set plane orientation based on type
  const getRotation = () => {
    switch (plane) {
      case 'XY':
        return [0, 0, 0];
      case 'YZ':
        return [0, Math.PI / 2, 0];
      case 'XZ':
        return [Math.PI / 2, 0, 0];
      case 'custom':
        return [rotation.x, rotation.y, rotation.z];
      default:
        return [0, 0, 0];
    }
  };
  
  // Handle click to activate sketch
  const handleClick = (event: THREE.Event) => {
    event.stopPropagation();
    
    // Create or activate sketch on this plane
    const sketchId = `sketch-${plane}-${Date.now()}`;
    setActiveSketch(sketchId);
    
    // Create sketch entity if it doesn't exist
    if (!sketches.has(sketchId)) {
      useSketchStore.getState().createSketch(sketchId);
    }
  };
  
  return (
    <group position={position} rotation={getRotation()}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
      >
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial 
          color={0x2563eb}
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.1}
          visible={visible}
        />
      </mesh>
      <gridHelper args={[size, size / 5, 0x444444, 0x222222]} />
    </group>
  );
}
