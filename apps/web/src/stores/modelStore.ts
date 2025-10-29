import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Part, Sketch, Feature, SketchEntity, Constraint } from '@types/index';

interface ModelState {
  currentPart?: Part;
  activeSketch?: Sketch;
  selectedFeature?: string;
  selectedEntities: string[];
  
  // Sketch actions
  createSketch: (plane: string) => void;
  addSketchEntity: (entity: SketchEntity) => void;
  updateSketchEntity: (entityId: string, updates: Partial<SketchEntity>) => void;
  deleteSketchEntity: (entityId: string) => void;
  addConstraint: (constraint: Constraint) => void;
  removeConstraint: (constraintId: string) => void;
  
  // Feature actions
  addFeature: (feature: Feature) => void;
  updateFeature: (featureId: string, updates: Partial<Feature>) => void;
  deleteFeature: (featureId: string) => void;
  suppressFeature: (featureId: string, suppressed: boolean) => void;
  reorderFeature: (featureId: string, newIndex: number) => void;
  
  // Selection
  setSelection: (entityIds: string[]) => void;
  clearSelection: () => void;
}

export const useModelStore = create<ModelState>()(
  immer((set, get) => ({
    currentPart: undefined,
    activeSketch: undefined,
    selectedFeature: undefined,
    selectedEntities: [],

    createSketch: (plane) => {
      const newSketch: Sketch = {
        id: `sketch-${Date.now()}`,
        name: `Sketch ${get().currentPart?.sketches.length ?? 0 + 1}`,
        entities: [],
        constraints: [],
        plane,
      };

      set((state) => {
        if (state.currentPart) {
          state.currentPart.sketches.push(newSketch);
          state.activeSketch = newSketch;
        }
      });
    },

    addSketchEntity: (entity) => {
      set((state) => {
        if (state.activeSketch) {
          state.activeSketch.entities.push(entity);
        }
      });
    },

    updateSketchEntity: (entityId, updates) => {
      set((state) => {
        if (state.activeSketch) {
          const entity = state.activeSketch.entities.find((e) => e.id === entityId);
          if (entity) {
            Object.assign(entity, updates);
          }
        }
      });
    },

    deleteSketchEntity: (entityId) => {
      set((state) => {
        if (state.activeSketch) {
          state.activeSketch.entities = state.activeSketch.entities.filter(
            (e) => e.id !== entityId
          );
        }
      });
    },

    addConstraint: (constraint) => {
      set((state) => {
        if (state.activeSketch) {
          state.activeSketch.constraints.push(constraint);
        }
      });
    },

    removeConstraint: (constraintId) => {
      set((state) => {
        if (state.activeSketch) {
          state.activeSketch.constraints = state.activeSketch.constraints.filter(
            (c) => c.id !== constraintId
          );
        }
      });
    },

    addFeature: (feature) => {
      set((state) => {
        if (state.currentPart) {
          state.currentPart.features.push(feature);
        }
      });
    },

    updateFeature: (featureId, updates) => {
      set((state) => {
        if (state.currentPart) {
          const feature = state.currentPart.features.find((f) => f.id === featureId);
          if (feature) {
            Object.assign(feature, updates);
          }
        }
      });
    },

    deleteFeature: (featureId) => {
      set((state) => {
        if (state.currentPart) {
          state.currentPart.features = state.currentPart.features.filter(
            (f) => f.id !== featureId
          );
        }
      });
    },

    suppressFeature: (featureId, suppressed) => {
      set((state) => {
        if (state.currentPart) {
          const feature = state.currentPart.features.find((f) => f.id === featureId);
          if (feature) {
            feature.suppressed = suppressed;
          }
        }
      });
    },

    reorderFeature: (featureId, newIndex) => {
      set((state) => {
        if (state.currentPart) {
          const features = state.currentPart.features;
          const currentIndex = features.findIndex((f) => f.id === featureId);
          if (currentIndex !== -1) {
            const [feature] = features.splice(currentIndex, 1);
            features.splice(newIndex, 0, feature);
          }
        }
      });
    },

    setSelection: (entityIds) => {
      set({ selectedEntities: entityIds });
    },

    clearSelection: () => {
      set({ selectedEntities: [] });
    },
  }))
);
