/**
 * Feature Store
 * Manages 3D features and feature tree
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Feature } from '../types';
import { FeatureDependencyGraph } from '@flows/cad-kernel';

interface FeatureState {
  features: Map<string, Feature>;
  featureTree: Feature[];
  dependencyGraph: FeatureDependencyGraph;
  selectedFeature: string | null;
  editingFeature: string | null;
}

interface FeatureActions {
  // Feature CRUD
  addFeature: (feature: Feature) => void;
  updateFeature: (featureId: string, updates: Partial<Feature>) => void;
  removeFeature: (featureId: string) => void;
  getFeature: (featureId: string) => Feature | undefined;
  getFeatures: () => Feature[];
  
  // Feature tree
  reorderFeature: (featureId: string, newIndex: number) => void;
  suppressFeature: (featureId: string) => void;
  unsuppressFeature: (featureId: string) => void;
  
  // Selection
  selectFeature: (featureId: string | null) => void;
  setEditingFeature: (featureId: string | null) => void;
  
  // Regeneration
  regenerateFeature: (featureId: string) => Promise<void>;
  regenerateFromSketch: (sketchId: string) => Promise<void>;
  regenerateAll: () => Promise<void>;
  
  // Utility
  clear: () => void;
}

export const useFeatureStore = create<FeatureState & FeatureActions>()(
  immer((set, get) => ({
    features: new Map(),
    featureTree: [],
    dependencyGraph: new FeatureDependencyGraph(),
    selectedFeature: null,
    editingFeature: null,
    
    // Feature CRUD
    addFeature: (feature) => {
      set((state) => {
        state.features.set(feature.id, feature);
        state.featureTree.push(feature);
        state.dependencyGraph.addFeature(feature);
      });
    },
    
    updateFeature: (featureId, updates) => {
      set((state) => {
        const feature = state.features.get(featureId);
        if (feature) {
          Object.assign(feature, updates);
          
          // Update in tree
          const treeIndex = state.featureTree.findIndex(f => f.id === featureId);
          if (treeIndex >= 0) {
            Object.assign(state.featureTree[treeIndex], updates);
          }
        }
      });
    },
    
    removeFeature: (featureId) => {
      set((state) => {
        state.features.delete(featureId);
        state.featureTree = state.featureTree.filter(f => f.id !== featureId);
        state.dependencyGraph.removeFeature(featureId);
        
        if (state.selectedFeature === featureId) {
          state.selectedFeature = null;
        }
        if (state.editingFeature === featureId) {
          state.editingFeature = null;
        }
      });
    },
    
    getFeature: (featureId) => {
      return get().features.get(featureId);
    },
    
    getFeatures: () => {
      return Array.from(get().features.values());
    },
    
    // Feature tree
    reorderFeature: (featureId, newIndex) => {
      set((state) => {
        const currentIndex = state.featureTree.findIndex(f => f.id === featureId);
        if (currentIndex >= 0 && currentIndex !== newIndex) {
          const [feature] = state.featureTree.splice(currentIndex, 1);
          state.featureTree.splice(newIndex, 0, feature);
        }
      });
    },
    
    suppressFeature: (featureId) => {
      get().updateFeature(featureId, { suppressed: true });
    },
    
    unsuppressFeature: (featureId) => {
      get().updateFeature(featureId, { suppressed: false });
    },
    
    // Selection
    selectFeature: (featureId) => {
      set((state) => {
        state.selectedFeature = featureId;
      });
    },
    
    setEditingFeature: (featureId) => {
      set((state) => {
        state.editingFeature = featureId;
      });
    },
    
    // Regeneration
    regenerateFeature: async (featureId) => {
      // Placeholder for actual geometry regeneration
      console.log('Regenerating feature:', featureId);
      
      // In production, this would:
      // 1. Get feature parameters
      // 2. Get linked sketch
      // 3. Extract profile
      // 4. Call geometry kernel
      // 5. Update feature geometry
    },
    
    regenerateFromSketch: async (sketchId) => {
      const { dependencyGraph } = get();
      const affectedFeatures = dependencyGraph.getRegenerationOrder(sketchId);
      
      console.log('Regenerating features from sketch:', sketchId, affectedFeatures);
      
      // Regenerate in order
      for (const featureId of affectedFeatures) {
        await get().regenerateFeature(featureId);
      }
    },
    
    regenerateAll: async () => {
      const features = get().featureTree;
      
      console.log('Regenerating all features');
      
      for (const feature of features) {
        if (!feature.suppressed) {
          await get().regenerateFeature(feature.id);
        }
      }
    },
    
    // Utility
    clear: () => {
      set((state) => {
        state.features.clear();
        state.featureTree = [];
        state.dependencyGraph.clear();
        state.selectedFeature = null;
        state.editingFeature = null;
      });
    },
  }))
);
