/**
 * CAD Material System
 * Professional material definitions for CAD visualization
 */

import * as THREE from 'three';

export interface CADMaterialConfig {
  color: number | string;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  transparent?: boolean;
  emissive?: number | string;
  emissiveIntensity?: number;
}

/**
 * Default CAD material appearance
 */
export const DefaultCADMaterial: CADMaterialConfig = {
  color: 0xC8C8C8,        // Light gray (200, 200, 200)
  metalness: 0.3,         // Slightly metallic
  roughness: 0.6,         // Matte finish
  opacity: 1.0,
};

/**
 * Selection highlight material
 */
export const SelectionMaterial: CADMaterialConfig = {
  color: 0x0078D7,        // Blue
  metalness: 0.2,
  roughness: 0.7,
  emissive: 0x0078D7,
  emissiveIntensity: 0.3,
  opacity: 0.8,
  transparent: true,
};

/**
 * Hover highlight material
 */
export const HoverMaterial: CADMaterialConfig = {
  color: 0xFF8C00,        // Orange
  metalness: 0.2,
  roughness: 0.7,
  emissive: 0xFF8C00,
  emissiveIntensity: 0.2,
  opacity: 0.6,
  transparent: true,
};

/**
 * Sketch plane material
 */
export const PlaneMaterial: CADMaterialConfig = {
  color: 0x8080FF,        // Light blue
  metalness: 0,
  roughness: 1,
  opacity: 0.2,
  transparent: true,
};

/**
 * Construction geometry material
 */
export const ConstructionMaterial: CADMaterialConfig = {
  color: 0x808080,        // Gray
  metalness: 0,
  roughness: 1,
  opacity: 0.5,
  transparent: true,
};

/**
 * Create a Three.js material from config
 */
export function createCADMaterial(
  config: Partial<CADMaterialConfig> = {}
): THREE.MeshStandardMaterial {
  const finalConfig = {
    ...DefaultCADMaterial,
    ...config,
  };
  
  return new THREE.MeshStandardMaterial({
    color: finalConfig.color,
    metalness: finalConfig.metalness,
    roughness: finalConfig.roughness,
    opacity: finalConfig.opacity,
    transparent: finalConfig.transparent,
    emissive: finalConfig.emissive,
    emissiveIntensity: finalConfig.emissiveIntensity,
    side: THREE.DoubleSide,
  });
}

/**
 * Edge line materials
 */
export const EdgeMaterials = {
  visible: new THREE.LineBasicMaterial({
    color: 0x1E1E1E,      // Dark gray/black
    linewidth: 1,
    fog: false,
  }),
  
  hidden: new THREE.LineDashedMaterial({
    color: 0x808080,      // Medium gray
    linewidth: 1,
    dashSize: 4,
    gapSize: 2,
    fog: false,
  }),
  
  silhouette: new THREE.LineBasicMaterial({
    color: 0x000000,      // Black
    linewidth: 2,
    fog: false,
  }),
  
  construction: new THREE.LineDashedMaterial({
    color: 0x808080,
    linewidth: 1,
    dashSize: 3,
    gapSize: 3,
    fog: false,
  }),
};

/**
 * Sketch entity materials (2D)
 */
export const SketchMaterials = {
  normal: new THREE.LineBasicMaterial({
    color: 0x000000,      // Black
    linewidth: 2,
  }),
  
  construction: new THREE.LineDashedMaterial({
    color: 0x808080,      // Gray
    linewidth: 1,
    dashSize: 4,
    gapSize: 2,
  }),
  
  selected: new THREE.LineBasicMaterial({
    color: 0x0078D7,      // Blue
    linewidth: 3,
  }),
  
  hover: new THREE.LineBasicMaterial({
    color: 0xFF8C00,      // Orange
    linewidth: 3,
  }),
  
  constrained: new THREE.LineBasicMaterial({
    color: 0x00AA00,      // Green (fully constrained)
    linewidth: 2,
  }),
};

/**
 * Dimension/annotation materials
 */
export const DimensionMaterials = {
  line: new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 1,
  }),
  
  text: {
    color: 0x000000,
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
  },
};

/**
 * Material presets for different part types
 */
export const MaterialPresets = {
  aluminum: createCADMaterial({
    color: 0xC0C0C0,
    metalness: 0.8,
    roughness: 0.2,
  }),
  
  steel: createCADMaterial({
    color: 0xB0B0B0,
    metalness: 0.9,
    roughness: 0.3,
  }),
  
  plastic: createCADMaterial({
    color: 0xFFFFFF,
    metalness: 0,
    roughness: 0.7,
  }),
  
  glass: createCADMaterial({
    color: 0xFFFFFF,
    metalness: 0,
    roughness: 0.1,
    opacity: 0.3,
    transparent: true,
  }),
  
  rubber: createCADMaterial({
    color: 0x303030,
    metalness: 0,
    roughness: 0.9,
  }),
};

/**
 * Clone a material with modifications
 */
export function cloneMaterial(
  material: THREE.Material,
  overrides: Partial<CADMaterialConfig> = {}
): THREE.Material {
  const cloned = material.clone();
  
  if (cloned instanceof THREE.MeshStandardMaterial) {
    if (overrides.color !== undefined) cloned.color.set(overrides.color);
    if (overrides.metalness !== undefined) cloned.metalness = overrides.metalness;
    if (overrides.roughness !== undefined) cloned.roughness = overrides.roughness;
    if (overrides.opacity !== undefined) cloned.opacity = overrides.opacity;
    if (overrides.transparent !== undefined) cloned.transparent = overrides.transparent;
    if (overrides.emissive !== undefined) cloned.emissive.set(overrides.emissive);
    if (overrides.emissiveIntensity !== undefined) {
      cloned.emissiveIntensity = overrides.emissiveIntensity;
    }
  }
  
  return cloned;
}
