/**
 * Hidden Line Renderer
 * 
 * Renders 3D models with:
 * - Visible edges as solid black lines
 * - Hidden edges as dashed gray lines
 * - Professional CAD appearance
 */

import * as THREE from 'three';
import { EdgeGeometry } from 'three/examples/jsm/geometries/EdgeGeometry';

export interface RenderStyle {
  mode: 'shaded' | 'wireframe' | 'hidden-line' | 'shaded-with-edges';
  showVisibleEdges: boolean;
  showHiddenEdges: boolean;
  showSilhouette: boolean;
}

export const DEFAULT_STYLE: RenderStyle = {
  mode: 'shaded-with-edges',
  showVisibleEdges: true,
  showHiddenEdges: true,
  showSilhouette: true,
};

export class HiddenLineRenderer {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  
  // Render targets
  private depthTarget: THREE.WebGLRenderTarget;
  
  // Materials
  private solidMaterial: THREE.MeshStandardMaterial;
  private visibleEdgeMaterial: THREE.LineBasicMaterial;
  private hiddenEdgeMaterial: THREE.LineDashedMaterial;
  private silhouetteMaterial: THREE.LineBasicMaterial;
  
  // Edge geometries cache
  private edgeCache = new Map<string, THREE.EdgesGeometry>();
  
  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // Initialize materials
    this.initializeMaterials();
    
    // Create depth render target
    const size = renderer.getSize(new THREE.Vector2());
    this.depthTarget = new THREE.WebGLRenderTarget(size.width, size.height, {
      depthBuffer: true,
      stencilBuffer: false,
    });
  }
  
  /**
   * Initialize rendering materials
   */
  private initializeMaterials() {
    // Solid material (default gray)
    this.solidMaterial = new THREE.MeshStandardMaterial({
      color: 0xC8C8C8,        // Light gray (200, 200, 200)
      metalness: 0.3,
      roughness: 0.6,
      envMapIntensity: 0.5,
      side: THREE.FrontSide,
    });
    
    // Visible edges (solid black)
    this.visibleEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0x1E1E1E,        // Dark gray/black
      linewidth: 1,
      depthTest: true,
      depthWrite: false,
    });
    
    // Hidden edges (dashed gray)
    this.hiddenEdgeMaterial = new THREE.LineDashedMaterial({
      color: 0x808080,        // Medium gray
      linewidth: 1,
      dashSize: 4,            // 4px dash
      gapSize: 2,             // 2px gap
      depthTest: true,
      depthWrite: false,
    });
    
    // Silhouette edges (thick black)
    this.silhouetteMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,        // Black
      linewidth: 2,
      depthTest: true,
      depthWrite: false,
    });
  }
  
  /**
   * Main render function
   */
  render(style: RenderStyle = DEFAULT_STYLE) {
    switch (style.mode) {
      case 'shaded':
        this.renderShaded();
        break;
      case 'wireframe':
        this.renderWireframe();
        break;
      case 'hidden-line':
        this.renderHiddenLine(style);
        break;
      case 'shaded-with-edges':
        this.renderShadedWithEdges(style);
        break;
    }
  }
  
  /**
   * Render solid shading only
   */
  private renderShaded() {
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Render wireframe only
   */
  private renderWireframe() {
    // TODO: Implement wireframe rendering
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.material.wireframe = true;
      }
    });
    
    this.renderer.render(this.scene, this.camera);
    
    // Reset
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.material.wireframe = false;
      }
    });
  }
  
  /**
   * Render with hidden line visualization
   * 
   * Three-pass rendering:
   * 1. Render solids to depth buffer
   * 2. Render visible edges (depth test pass)
   * 3. Render hidden edges (depth test fail)
   */
  private renderHiddenLine(style: RenderStyle) {
    const gl = this.renderer.getContext();
    
    // Clear
    this.renderer.clear();
    
    // Pass 1: Render solids to depth buffer only
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.visible = true;
      }
    });
    
    gl.colorMask(false, false, false, false);  // Don't write color
    this.renderer.render(this.scene, this.camera);
    gl.colorMask(true, true, true, true);      // Re-enable color
    
    // Pass 2: Render visible edges
    if (style.showVisibleEdges) {
      this.renderEdges('visible');
    }
    
    // Pass 3: Render hidden edges
    if (style.showHiddenEdges) {
      this.renderEdges('hidden');
    }
  }
  
  /**
   * Render shaded with edge lines
   */
  private renderShadedWithEdges(style: RenderStyle) {
    // Render solid geometry first
    this.renderer.render(this.scene, this.camera);
    
    // Then render edges on top
    if (style.showVisibleEdges) {
      this.renderEdges('visible');
    }
    
    if (style.showHiddenEdges) {
      this.renderEdges('hidden');
    }
  }
  
  /**
   * Render edges (visible or hidden)
   */
  private renderEdges(type: 'visible' | 'hidden') {
    const edgeScene = new THREE.Scene();
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const edges = this.getOrCreateEdges(object);
        
        if (edges) {
          const material = type === 'visible' 
            ? this.visibleEdgeMaterial.clone()
            : this.hiddenEdgeMaterial.clone();
          
          // For hidden edges, reverse depth test
          if (type === 'hidden') {
            material.depthFunc = THREE.GreaterDepth;  // Pass if behind
          } else {
            material.depthFunc = THREE.LessEqualDepth;  // Pass if at or in front
          }
          
          const edgeLines = new THREE.LineSegments(edges, material);
          edgeLines.position.copy(object.position);
          edgeLines.rotation.copy(object.rotation);
          edgeLines.scale.copy(object.scale);
          edgeLines.computeLineDistances(); // For dashed lines
          
          edgeScene.add(edgeLines);
        }
      }
    });
    
    this.renderer.render(edgeScene, this.camera);
  }
  
  /**
   * Get or create edge geometry for a mesh
   */
  private getOrCreateEdges(mesh: THREE.Mesh): THREE.EdgesGeometry | null {
    const id = mesh.uuid;
    
    if (this.edgeCache.has(id)) {
      return this.edgeCache.get(id)!;
    }
    
    if (mesh.geometry) {
      // Create edge geometry with threshold angle
      const edges = new THREE.EdgesGeometry(mesh.geometry, 15); // 15° threshold
      this.edgeCache.set(id, edges);
      return edges;
    }
    
    return null;
  }
  
  /**
   * Clear edge cache
   */
  clearCache() {
    this.edgeCache.clear();
  }
  
  /**
   * Update when geometry changes
   */
  invalidateEdges(meshId: string) {
    this.edgeCache.delete(meshId);
  }
  
  /**
   * Resize render targets
   */
  setSize(width: number, height: number) {
    this.depthTarget.setSize(width, height);
  }
  
  /**
   * Cleanup
   */
  dispose() {
    this.depthTarget.dispose();
    this.solidMaterial.dispose();
    this.visibleEdgeMaterial.dispose();
    this.hiddenEdgeMaterial.dispose();
    this.silhouetteMaterial.dispose();
    
    this.edgeCache.forEach(geometry => geometry.dispose());
    this.edgeCache.clear();
  }
}

/**
 * Helper: Create CAD-style material
 */
export function createCADMaterial(color: number = 0xC8C8C8): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.3,
    roughness: 0.6,
    envMapIntensity: 0.5,
  });
}

/**
 * Helper: Setup professional CAD lighting
 */
export function setupCADLighting(scene: THREE.Scene) {
  // Remove existing lights
  scene.children
    .filter(child => child instanceof THREE.Light)
    .forEach(light => scene.remove(light));
  
  // Ambient light (soft fill)
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);
  
  // Key light (main directional)
  const key = new THREE.DirectionalLight(0xffffff, 0.8);
  key.position.set(5, 10, 7);
  key.castShadow = true;
  scene.add(key);
  
  // Fill light (soften shadows)
  const fill = new THREE.DirectionalLight(0xffffff, 0.3);
  fill.position.set(-5, 0, -5);
  scene.add(fill);
  
  // Rim light (edge highlight)
  const rim = new THREE.DirectionalLight(0xffffff, 0.2);
  rim.position.set(0, -5, -10);
  scene.add(rim);
  
  // Hemisphere light (sky/ground)
  const hemisphere = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
  scene.add(hemisphere);
}
