/**
 * Plane Renderer
 * Visualizes sketch planes in 3D space
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { StandardPlanes } from '@flows/cad-kernel';
import { useViewportStore } from '../../stores/viewportStore';

export function PlaneRenderer() {
  const { activePlane, showPlanes } = useViewportStore();
  
  if (!showPlanes) return null;
  
  return (
    <>
      {/* Standard Planes */}
      <StandardPlaneVisuals />
      
      {/* Active Plane */}
      {activePlane && <PlaneVisual plane={activePlane} isActive />}
    </>
  );
}

function StandardPlaneVisuals() {
  return (
    <group name="standard-planes">
      <PlaneVisual plane={StandardPlanes.XY} color="#8080ff" opacity={0.15} />
      <PlaneVisual plane={StandardPlanes.XZ} color="#ff8080" opacity={0.15} />
      <PlaneVisual plane={StandardPlanes.YZ} color="#80ff80" opacity={0.15} />
    </group>
  );
}

interface PlaneVisualProps {
  plane: typeof StandardPlanes.XY;
  isActive?: boolean;
  color?: string;
  opacity?: number;
}

function PlaneVisual({ plane, isActive = false, color, opacity }: PlaneVisualProps) {
  const size = plane.size || 200;
  
  // Create plane geometry aligned with local axes
  const { geometry, position, rotation } = useMemo(() => {
    const geom = new THREE.PlaneGeometry(size, size);
    
    // Calculate rotation from plane normal
    const planeNormal = new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z);
    const up = new THREE.Vector3(0, 0, 1);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, planeNormal.normalize());
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    
    return {
      geometry: geom,
      position: new THREE.Vector3(plane.origin.x, plane.origin.y, plane.origin.z),
      rotation: euler,
    };
  }, [plane, size]);
  
  // Create grid helper aligned with plane
  const gridHelper = useMemo(() => {
    const grid = new THREE.GridHelper(size, 20, 0x888888, 0xcccccc);
    
    // Rotate grid to match plane orientation
    const planeNormal = new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z);
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, planeNormal.normalize());
    grid.setRotationFromQuaternion(quaternion);
    
    grid.position.set(plane.origin.x, plane.origin.y, plane.origin.z);
    
    return grid;
  }, [plane, size]);
  
  const materialColor = color || (isActive ? '#4080ff' : '#8080ff');
  const materialOpacity = opacity ?? (isActive ? 0.3 : 0.1);
  
  return (
    <group name={`plane-${plane.id}`}>
      {/* Plane surface */}
      <mesh
        geometry={geometry}
        position={position}
        rotation={rotation}
      >
        <meshBasicMaterial
          color={materialColor}
          transparent
          opacity={materialOpacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Grid */}
      {isActive && <primitive object={gridHelper} />}
      
      {/* Plane axes */}
      {isActive && (
        <group position={position}>
          {/* X axis (red) */}
          <arrowHelper
            args={[
              new THREE.Vector3(plane.xAxis.x, plane.xAxis.y, plane.xAxis.z),
              new THREE.Vector3(0, 0, 0),
              size * 0.4,
              0xff0000,
              size * 0.1,
              size * 0.05,
            ]}
          />
          {/* Y axis (green) */}
          <arrowHelper
            args={[
              new THREE.Vector3(plane.yAxis.x, plane.yAxis.y, plane.yAxis.z),
              new THREE.Vector3(0, 0, 0),
              size * 0.4,
              0x00ff00,
              size * 0.1,
              size * 0.05,
            ]}
          />
        </group>
      )}
    </group>
  );
}
