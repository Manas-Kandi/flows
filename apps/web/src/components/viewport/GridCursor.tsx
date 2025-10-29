/**
 * Grid Cursor - Visual indicator showing current snap position
 * Adapts size based on camera zoom level
 */

import { useThree } from '@react-three/fiber';
import { useSketchStore } from '../../stores/sketchStore';
import { sketchToWorld } from '@flows/cad-kernel';
import type { SketchPlane } from '@flows/cad-kernel';

interface GridCursorProps {
  plane: SketchPlane;
}

export function GridCursor({ plane }: GridCursorProps) {
  const { camera } = useThree();
  const { toolState } = useSketchStore();
  const cursorPosition = toolState.cursorPosition;
  
  if (!cursorPosition) return null;
  
  // Convert 2D cursor position to 3D
  const point3D = sketchToWorld(cursorPosition, plane);
  
  // Calculate adaptive size based on camera distance
  const cameraDistance = camera.position.distanceTo({
    x: point3D.x,
    y: point3D.y,
    z: point3D.z,
  } as any);
  
  // Scale cursor: closer = smaller, farther = larger
  // Base size of 3, scales with distance (min 2, max 15)
  const baseSize = Math.max(2, Math.min(15, cameraDistance * 0.015));
  const crosshairSize = baseSize;
  const circleSize = baseSize * 0.4;
  
  return (
    <group position={[point3D.x, point3D.y, point3D.z]}>
      {/* Crosshair indicator - horizontal line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([-crosshairSize, 0, 0, crosshairSize, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#0078D7" linewidth={2} />
      </line>
      
      {/* Crosshair indicator - vertical line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, -crosshairSize, 0, 0, crosshairSize, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#0078D7" linewidth={2} />
      </line>
      
      {/* Small circle at center */}
      <mesh>
        <circleGeometry args={[circleSize, 16]} />
        <meshBasicMaterial color="#0078D7" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}
