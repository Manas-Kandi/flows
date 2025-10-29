/**
 * Extrude Tool - Convert 2D sketches to 3D geometry
 */

import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { useSketchStore } from '../../stores/sketchStore';
import { useModelStore } from '../../stores/modelStore';
import type { SketchEntity } from '../../types/sketch';

interface ExtrudeToolProps {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
}

export function ExtrudeTool({ camera, scene }: ExtrudeToolProps) {
  const [extrudeDistance, setExtrudeDistance] = useState(10);
  const [isExtruding, setIsExtruding] = useState(false);
  const [previewMesh, setPreviewMesh] = useState<THREE.Mesh | null>(null);
  
  const { activeSketchId, getAllEntities } = useSketchStore();
  const { addFeature } = useModelStore();
  
  // Create extruded geometry from sketch entities
  const createExtrudeGeometry = useCallback((entities: SketchEntity[], distance: number): THREE.BufferGeometry | null => {
    if (entities.length === 0) return null;
    
    // Create shape from sketch entities
    const shape = new THREE.Shape();
    
    // Process entities to create a closed shape
    entities.forEach((entity, index) => {
      switch (entity.type) {
        case 'line':
          if (index === 0) {
            shape.moveTo(entity.start.x, entity.start.y);
          } else {
            shape.lineTo(entity.start.x, entity.start.y);
          }
          shape.lineTo(entity.end.x, entity.end.y);
          break;
          
        case 'arc':
          const arcPath = new THREE.Path();
          arcPath.arc(
            entity.center.x,
            entity.center.y,
            entity.radius,
            entity.startAngle,
            entity.endAngle,
            false
          );
          shape.add(arcPath);
          break;
          
        case 'rectangle':
          const width = entity.bottomRight.x - entity.topLeft.x;
          const height = entity.bottomRight.y - entity.topLeft.y;
          shape.rect(entity.topLeft.x, entity.topLeft.y, width, height);
          break;
          
        case 'circle':
          const circlePath = new THREE.Path();
          circlePath.arc(entity.center.x, entity.center.y, entity.radius, 0, Math.PI * 2, false);
          shape.add(circlePath);
          break;
      }
    });
    
    // Extrude the shape
    const extrudeSettings = {
      depth: distance,
      bevelEnabled: false,
      steps: 1,
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Center the geometry
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
      const center = new THREE.Vector3();
      geometry.boundingBox.getCenter(center);
      geometry.translate(-center.x, -center.y, -distance / 2);
    }
    
    return geometry;
  }, []);
  
  // Update preview when extrude distance changes
  useEffect(() => {
    if (!activeSketchId || !isExtruding) return;
    
    const entities = getAllEntities();
    const geometry = createExtrudeGeometry(entities, extrudeDistance);
    
    if (geometry) {
      // Remove old preview
      if (previewMesh) {
        scene.remove(previewMesh);
        previewMesh.geometry.dispose();
      }
      
      // Create new preview mesh
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.3,
        wireframe: false
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      setPreviewMesh(mesh);
    }
    
    return () => {
      // Cleanup preview on unmount
      if (previewMesh) {
        scene.remove(previewMesh);
        previewMesh.geometry.dispose();
      }
    };
  }, [extrudeDistance, isExtruding, activeSketchId, getAllEntities, createExtrudeGeometry, scene, previewMesh]);
  
  // Handle extrude execution
  const executeExtrude = useCallback(() => {
    if (!activeSketchId) return;
    
    const entities = getAllEntities();
    const geometry = createExtrudeGeometry(entities, extrudeDistance);
    
    if (geometry) {
      // Create final mesh
      const material = new THREE.MeshPhongMaterial({
        color: 0x8888ff,
        shininess: 100
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      
      // Add as feature to model
      const feature = {
        id: `extrude-${Date.now()}`,
        type: 'extrude',
        sketchId: activeSketchId,
        distance: extrudeDistance,
        mesh: mesh,
        parameters: {
          distance: extrudeDistance
        }
      };
      
      addFeature(feature);
      scene.add(mesh);
      
      // Clean up preview
      if (previewMesh) {
        scene.remove(previewMesh);
        previewMesh.geometry.dispose();
        setPreviewMesh(null);
      }
      
      setIsExtruding(false);
    }
  }, [activeSketchId, getAllEntities, createExtrudeGeometry, extrudeDistance, addFeature, scene, previewMesh]);
  
  // Start extrude process
  const startExtrude = useCallback(() => {
    if (!activeSketchId) return;
    setIsExtruding(true);
    setExtrudeDistance(10);
  }, [activeSketchId]);
  
  // Cancel extrude
  const cancelExtrude = useCallback(() => {
    setIsExtruding(false);
    if (previewMesh) {
      scene.remove(previewMesh);
      previewMesh.geometry.dispose();
      setPreviewMesh(null);
    }
  }, [previewMesh, scene]);
  
  return (
    <div className="absolute top-4 right-4 bg-gray-800 border border-gray-700 rounded p-4 text-white">
      <h3 className="text-lg font-semibold mb-3">Extrude Tool</h3>
      
      {!isExtruding ? (
        <div>
          <p className="text-sm text-gray-400 mb-3">
            Extrude the current sketch into 3D geometry
          </p>
          <button
            onClick={startExtrude}
            disabled={!activeSketchId}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors"
          >
            Start Extrude
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Extrude Distance: {extrudeDistance.toFixed(1)}
            </label>
            <input
              type="range"
              min="1"
              max="100"
              step="0.5"
              value={extrudeDistance}
              onChange={(e) => setExtrudeDistance(parseFloat(e.target.value))}
              className="w-full"
            />
            <input
              type="number"
              min="1"
              max="100"
              step="0.5"
              value={extrudeDistance}
              onChange={(e) => setExtrudeDistance(parseFloat(e.target.value))}
              className="w-full mt-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={executeExtrude}
              className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded transition-colors"
            >
              Apply
            </button>
            <button
              onClick={cancelExtrude}
              className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {activeSketchId && (
        <div className="mt-3 text-xs text-gray-400">
          Sketch: {activeSketchId}
        </div>
      )}
    </div>
  );
}
