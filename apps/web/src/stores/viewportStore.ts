/**
 * Viewport Store
 * Manages viewport state, camera, and mode switching (2D sketch ↔ 3D model)
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { SketchPlane } from '@flows/cad-kernel';

export type ViewportMode = 'sketch' | '3d' | 'assembly';
export type RenderStyle = 'shaded' | 'shaded-edges' | 'wireframe' | 'hidden-line' | 'x-ray';
export type ViewPreset = 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right' | 'iso' | 'custom';

export interface CameraState {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  zoom: number;
  fov: number;
}

export interface ViewportState {
  // Mode
  mode: ViewportMode;
  previousMode?: ViewportMode;
  
  // Active elements
  activeSketch: string | null;
  activePlane: SketchPlane | null;
  
  // Camera
  camera: CameraState;
  projection: 'perspective' | 'orthographic';
  viewPreset: ViewPreset;
  
  // Rendering
  renderStyle: RenderStyle;
  showGrid: boolean;
  showAxes: boolean;
  showPlanes: boolean;
  showDimensions: boolean;
  showEdges: boolean;
  showHiddenLines: boolean;
  
  // Selection
  selectedEntities: string[];
  hoveredEntity: string | null;
  selectionFilter: 'all' | 'faces' | 'edges' | 'vertices' | 'sketches' | 'features';
  
  // Animation state
  isTransitioning: boolean;
}

interface ViewportActions {
  // Mode switching
  enterSketchMode: (planeId: string, plane: SketchPlane, sketchId?: string) => void;
  exitSketchMode: () => void;
  editSketch: (sketchId: string, plane: SketchPlane) => void;
  enter3DMode: () => void;
  
  // Camera controls
  setCameraPosition: (position: { x: number; y: number; z: number }) => void;
  setCameraTarget: (target: { x: number; y: number; z: number }) => void;
  setCamera: (camera: Partial<CameraState>) => void;
  setViewPreset: (preset: ViewPreset) => void;
  setProjection: (projection: 'perspective' | 'orthographic') => void;
  
  // Rendering
  setRenderStyle: (style: RenderStyle) => void;
  toggleGrid: () => void;
  toggleAxes: () => void;
  togglePlanes: () => void;
  toggleDimensions: () => void;
  toggleEdges: () => void;
  
  // Selection
  setSelection: (entityIds: string[]) => void;
  addToSelection: (entityId: string) => void;
  removeFromSelection: (entityId: string) => void;
  clearSelection: () => void;
  setHoveredEntity: (entityId: string | null) => void;
  setSelectionFilter: (filter: ViewportState['selectionFilter']) => void;
  
  // Utility
  setTransitioning: (isTransitioning: boolean) => void;
  reset: () => void;
}

const DEFAULT_CAMERA: CameraState = {
  position: { x: 500, y: 500, z: 500 },
  target: { x: 0, y: 0, z: 0 },
  zoom: 1,
  fov: 50,
};

const INITIAL_STATE: ViewportState = {
  mode: '3d',
  activeSketch: null,
  activePlane: null,
  camera: DEFAULT_CAMERA,
  projection: 'perspective',
  viewPreset: 'iso',
  renderStyle: 'shaded-edges',
  showGrid: true,
  showAxes: true,
  showPlanes: false,
  showDimensions: true,
  showEdges: true,
  showHiddenLines: false,
  selectedEntities: [],
  hoveredEntity: null,
  selectionFilter: 'all',
  isTransitioning: false,
};

export const useViewportStore = create<ViewportState & ViewportActions>()(
  immer((set) => ({
    ...INITIAL_STATE,
    
    // Mode switching
    enterSketchMode: (plane: SketchPlane, sketchId?: string) => {
      set((state) => {
        state.previousMode = state.mode;
        state.mode = 'sketch';
        state.activeSketch = sketchId || `sketch-${Date.now()}`;
        state.activePlane = plane;
        state.projection = 'orthographic';
        state.showPlanes = true;
        state.isTransitioning = true;
        
        // Position camera normal to plane
        const distance = 500;
        state.camera.position = {
          x: plane.origin.x + plane.normal.x * distance,
          y: plane.origin.y + plane.normal.y * distance,
          z: plane.origin.z + plane.normal.z * distance,
        };
        state.camera.target = plane.origin;
      });
    },
    
    exitSketchMode: () => {
      set((state) => {
        const previousMode = state.previousMode || '3d';
        state.mode = previousMode;
        state.activeSketch = null;
        state.activePlane = null;
        state.projection = 'perspective';
        state.showPlanes = false;
        state.isTransitioning = true;
        
        // Return to isometric view
        const distance = 500;
        state.camera.position = { x: distance, y: distance, z: distance };
        state.camera.target = { x: 0, y: 0, z: 0 };
        state.viewPreset = 'iso';
      });
    },
    
    editSketch: (sketchId: string, plane: SketchPlane) => {
      set((state) => {
        state.previousMode = state.mode;
        state.mode = 'sketch';
        state.activeSketch = sketchId;
        state.activePlane = plane;
        state.projection = 'orthographic';
        state.showPlanes = true;
        state.isTransitioning = true;
        
        const distance = 500;
        state.camera.position = {
          x: plane.origin.x + plane.normal.x * distance,
          y: plane.origin.y + plane.normal.y * distance,
          z: plane.origin.z + plane.normal.z * distance,
        };
        state.camera.target = plane.origin;
      });
    },
    
    enter3DMode: () => {
      set((state) => {
        state.mode = '3d';
        state.activeSketch = null;
        state.activePlane = null;
        state.projection = 'perspective';
        state.showPlanes = false;
      });
    },
    
    // Camera controls
    setCameraPosition: (position) => {
      set((state) => {
        state.camera.position = position;
        state.viewPreset = 'custom';
      });
    },
    
    setCameraTarget: (target) => {
      set((state) => {
        state.camera.target = target;
      });
    },
    
    setCamera: (camera) => {
      set((state) => {
        Object.assign(state.camera, camera);
      });
    },
    
    setViewPreset: (preset) => {
      set((state) => {
        state.viewPreset = preset;
        state.isTransitioning = true;
        
        const distance = 500;
        const target = state.camera.target;
        
        switch (preset) {
          case 'front':
            state.camera.position = { x: target.x, y: target.y - distance, z: target.z };
            break;
          case 'back':
            state.camera.position = { x: target.x, y: target.y + distance, z: target.z };
            break;
          case 'top':
            state.camera.position = { x: target.x, y: target.y, z: target.z + distance };
            break;
          case 'bottom':
            state.camera.position = { x: target.x, y: target.y, z: target.z - distance };
            break;
          case 'left':
            state.camera.position = { x: target.x - distance, y: target.y, z: target.z };
            break;
          case 'right':
            state.camera.position = { x: target.x + distance, y: target.y, z: target.z };
            break;
          case 'iso':
            state.camera.position = {
              x: target.x + distance,
              y: target.y + distance,
              z: target.z + distance,
            };
            break;
        }
      });
    },
    
    setProjection: (projection) => {
      set((state) => {
        state.projection = projection;
      });
    },
    
    // Rendering
    setRenderStyle: (style) => {
      set((state) => {
        state.renderStyle = style;
        
        // Auto-adjust edge visibility based on style
        if (style === 'shaded-edges' || style === 'wireframe') {
          state.showEdges = true;
        } else if (style === 'shaded') {
          state.showEdges = false;
        }
        
        if (style === 'hidden-line') {
          state.showHiddenLines = true;
          state.showEdges = true;
        }
      });
    },
    
    toggleGrid: () => {
      set((state) => {
        state.showGrid = !state.showGrid;
      });
    },
    
    toggleAxes: () => {
      set((state) => {
        state.showAxes = !state.showAxes;
      });
    },
    
    togglePlanes: () => {
      set((state) => {
        state.showPlanes = !state.showPlanes;
      });
    },
    
    toggleDimensions: () => {
      set((state) => {
        state.showDimensions = !state.showDimensions;
      });
    },
    
    toggleEdges: () => {
      set((state) => {
        state.showEdges = !state.showEdges;
      });
    },
    
    // Selection
    setSelection: (entityIds) => {
      set((state) => {
        state.selectedEntities = entityIds;
      });
    },
    
    addToSelection: (entityId) => {
      set((state) => {
        if (!state.selectedEntities.includes(entityId)) {
          state.selectedEntities.push(entityId);
        }
      });
    },
    
    removeFromSelection: (entityId) => {
      set((state) => {
        state.selectedEntities = state.selectedEntities.filter(id => id !== entityId);
      });
    },
    
    clearSelection: () => {
      set((state) => {
        state.selectedEntities = [];
      });
    },
    
    setHoveredEntity: (entityId) => {
      set((state) => {
        state.hoveredEntity = entityId;
      });
    },
    
    setSelectionFilter: (filter) => {
      set((state) => {
        state.selectionFilter = filter;
      });
    },
    
    // Utility
    setTransitioning: (isTransitioning) => {
      set((state) => {
        state.isTransitioning = isTransitioning;
      });
    },
    
    reset: () => {
      set(INITIAL_STATE);
    },
  }))
);
