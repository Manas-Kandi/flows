/**
 * CAD Lighting Setup
 * Professional 3-point lighting for CAD visualization
 */

import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';

export interface LightingConfig {
  ambient: {
    intensity: number;
    color: number;
  };
  key: {
    intensity: number;
    position: [number, number, number];
    color: number;
    castShadow: boolean;
  };
  fill: {
    intensity: number;
    position: [number, number, number];
    color: number;
  };
  rim: {
    intensity: number;
    position: [number, number, number];
    color: number;
  };
}

const DEFAULT_LIGHTING: LightingConfig = {
  ambient: {
    intensity: 0.4,
    color: 0xffffff,
  },
  key: {
    intensity: 0.8,
    position: [500, 1000, 700],
    color: 0xffffff,
    castShadow: true,
  },
  fill: {
    intensity: 0.3,
    position: [-500, 0, -500],
    color: 0xffffff,
  },
  rim: {
    intensity: 0.2,
    position: [0, -500, -1000],
    color: 0xffffff,
  },
};

export function CADLighting({ config = DEFAULT_LIGHTING }: { config?: LightingConfig }) {
  const { scene } = useThree();
  
  useEffect(() => {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      config.ambient.color,
      config.ambient.intensity
    );
    ambientLight.name = 'ambient-light';
    scene.add(ambientLight);
    
    // Key light (main light source)
    const keyLight = new THREE.DirectionalLight(
      config.key.color,
      config.key.intensity
    );
    keyLight.position.set(...config.key.position);
    keyLight.name = 'key-light';
    
    if (config.key.castShadow) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 5000;
      keyLight.shadow.camera.left = -1000;
      keyLight.shadow.camera.right = 1000;
      keyLight.shadow.camera.top = 1000;
      keyLight.shadow.camera.bottom = -1000;
      keyLight.shadow.bias = -0.0001;
    }
    
    scene.add(keyLight);
    
    // Fill light (soften shadows)
    const fillLight = new THREE.DirectionalLight(
      config.fill.color,
      config.fill.intensity
    );
    fillLight.position.set(...config.fill.position);
    fillLight.name = 'fill-light';
    scene.add(fillLight);
    
    // Rim light (edge definition)
    const rimLight = new THREE.DirectionalLight(
      config.rim.color,
      config.rim.intensity
    );
    rimLight.position.set(...config.rim.position);
    rimLight.name = 'rim-light';
    scene.add(rimLight);
    
    return () => {
      scene.remove(ambientLight);
      scene.remove(keyLight);
      scene.remove(fillLight);
      scene.remove(rimLight);
    };
  }, [scene, config]);
  
  return null;
}

/**
 * Sketch mode lighting (flat, orthographic)
 */
export function SketchLighting() {
  const { scene } = useThree();
  
  useEffect(() => {
    // Bright ambient light for 2D sketch mode
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    ambientLight.name = 'sketch-ambient';
    scene.add(ambientLight);
    
    // Single directional light from camera direction
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
    directionalLight.position.set(0, 0, 1000);
    directionalLight.name = 'sketch-directional';
    scene.add(directionalLight);
    
    return () => {
      scene.remove(ambientLight);
      scene.remove(directionalLight);
    };
  }, [scene]);
  
  return null;
}
