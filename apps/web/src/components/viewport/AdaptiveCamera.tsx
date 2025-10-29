/**
 * Adaptive Camera
 * Switches between orthographic (2D sketch) and perspective (3D model) based on mode
 */

import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useViewportStore } from '../../stores/viewportStore';

export function AdaptiveCamera() {
  const { mode, projection, camera: cameraState, isTransitioning, setTransitioning } = useViewportStore();
  const { camera, gl, size } = useThree();
  
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const animationProgress = useRef(0);
  
  // Update camera type based on projection
  useEffect(() => {
    const aspect = size.width / size.height;
    let newCamera: THREE.Camera;
    
    if (projection === 'orthographic') {
      const frustumSize = 500;
      newCamera = new THREE.OrthographicCamera(
        -frustumSize * aspect / 2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        10000
      );
    } else {
      newCamera = new THREE.PerspectiveCamera(
        cameraState.fov,
        aspect,
        0.1,
        10000
      );
    }
    
    // Copy position and rotation from current camera
    newCamera.position.copy(camera.position);
    newCamera.rotation.copy(camera.rotation);
    newCamera.up.copy(camera.up);
    
    gl.render(new THREE.Scene(), newCamera);
  }, [projection, size, camera, gl, cameraState.fov]);
  
  // Update camera position with smooth transition
  useEffect(() => {
    if (isTransitioning) {
      targetPosition.current.set(
        cameraState.position.x,
        cameraState.position.y,
        cameraState.position.z
      );
      targetLookAt.current.set(
        cameraState.target.x,
        cameraState.target.y,
        cameraState.target.z
      );
      animationProgress.current = 0;
    } else {
      camera.position.set(
        cameraState.position.x,
        cameraState.position.y,
        cameraState.position.z
      );
      camera.lookAt(
        cameraState.target.x,
        cameraState.target.y,
        cameraState.target.z
      );
    }
  }, [cameraState, camera, isTransitioning]);
  
  // Smooth camera animation
  useFrame((state, delta) => {
    if (isTransitioning && animationProgress.current < 1) {
      animationProgress.current += delta * 2; // 0.5 second transition
      
      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        setTransitioning(false);
      }
      
      // Ease out cubic
      const t = 1 - Math.pow(1 - animationProgress.current, 3);
      
      // Interpolate position
      camera.position.lerp(targetPosition.current, t);
      
      // Look at target
      const currentLookAt = new THREE.Vector3();
      camera.getWorldDirection(currentLookAt);
      currentLookAt.multiplyScalar(100).add(camera.position);
      currentLookAt.lerp(targetLookAt.current, t);
      camera.lookAt(currentLookAt);
      
      camera.updateProjectionMatrix();
    }
  });
  
  // Handle resize
  useEffect(() => {
    const aspect = size.width / size.height;
    
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    } else if (camera instanceof THREE.OrthographicCamera) {
      const frustumSize = 500;
      camera.left = -frustumSize * aspect / 2;
      camera.right = frustumSize * aspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
    }
  }, [size, camera]);
  
  return null;
}
