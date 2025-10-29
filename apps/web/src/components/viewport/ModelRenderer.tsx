/**
 * Model Renderer
 * Renders 3D solid models with various render styles
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { useModelStore } from '../../stores/modelStore';
import { createCADMaterial, EdgeMaterials } from '../../rendering/MaterialSystem';
import type { RenderStyle } from '../../stores/viewportStore';

interface ModelRendererProps {
  layer: number;
  renderStyle: RenderStyle;
}

export function ModelRenderer({ layer, renderStyle }: ModelRendererProps) {
  const features = useModelStore((state) => state.getFeatures());
  
  return (
    <group name="cad-model" layers={layer}>
      {features.map((feature) => (
        <FeatureRenderer
          key={feature.id}
          feature={feature}
          renderStyle={renderStyle}
        />
      ))}
    </group>
  );
}

interface FeatureRendererProps {
  feature: any; // Feature from store
  renderStyle: RenderStyle;
}

function FeatureRenderer({ feature, renderStyle }: FeatureRendererProps) {
  // For now, create placeholder geometry
  // In production, this would use geometry from the geometry kernel
  const geometry = useMemo(() => {
    return createFeatureGeometry(feature);
  }, [feature]);
  
  if (!geometry || feature.suppressed || feature.failed) {
    return null;
  }
  
  const material = useMemo(() => {
    return createFeatureMaterial(renderStyle);
  }, [renderStyle]);
  
  return (
    <group name={`feature-${feature.id}`}>
      {/* Solid geometry */}
      {(renderStyle === 'shaded' || renderStyle === 'shaded-edges') && (
        <mesh geometry={geometry} material={material} castShadow receiveShadow />
      )}
      
      {/* Edges */}
      {(renderStyle === 'shaded-edges' || renderStyle === 'wireframe' || renderStyle === 'hidden-line') && (
        <EdgeRenderer geometry={geometry} />
      )}
      
      {/* X-Ray mode */}
      {renderStyle === 'x-ray' && (
        <>
          <mesh
            geometry={geometry}
            material={createCADMaterial({
              color: 0xC8C8C8,
              transparent: true,
              opacity: 0.3,
            })}
          />
          <EdgeRenderer geometry={geometry} />
        </>
      )}
    </group>
  );
}

/**
 * Edge Renderer
 */
function EdgeRenderer({ geometry }: { geometry: THREE.BufferGeometry }) {
  const edgeGeometry = useMemo(() => {
    return new THREE.EdgesGeometry(geometry, 15); // 15 degree threshold
  }, [geometry]);
  
  return (
    <lineSegments geometry={edgeGeometry} material={EdgeMaterials.visible} />
  );
}

/**
 * Create placeholder geometry for feature
 * In production, this would use OpenCascade.js or similar
 */
function createFeatureGeometry(feature: any): THREE.BufferGeometry {
  // Placeholder: create simple geometry based on feature type
  switch (feature.type) {
    case 'extrude': {
      const params = feature.parameters;
      const distance = params?.distance || 10;
      // Simple box as placeholder
      return new THREE.BoxGeometry(50, 50, distance);
    }
    
    case 'revolve': {
      // Simple cylinder as placeholder
      return new THREE.CylinderGeometry(25, 25, 50, 32);
    }
    
    case 'fillet':
    case 'chamfer': {
      // Return parent geometry (would modify edges in production)
      return new THREE.BoxGeometry(50, 50, 50);
    }
    
    default:
      return new THREE.BoxGeometry(10, 10, 10);
  }
}

/**
 * Create material based on render style
 */
function createFeatureMaterial(renderStyle: RenderStyle): THREE.Material {
  switch (renderStyle) {
    case 'shaded':
    case 'shaded-edges':
      return createCADMaterial();
    
    case 'wireframe':
      return new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true,
      });
    
    case 'hidden-line':
      return new THREE.MeshBasicMaterial({
        color: 0xffffff,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
    
    case 'x-ray':
      return createCADMaterial({
        transparent: true,
        opacity: 0.3,
      });
    
    default:
      return createCADMaterial();
  }
}
