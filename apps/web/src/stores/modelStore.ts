import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Part, Sketch, Feature, SketchEntity } from '../types';
import type { Constraint as AppConstraint } from '../types';
import { ConstraintSolver, type Constraint, type EntityGeometry } from '@flows/constraint-solver';
import { createEntityGeometry, updateEntityGeometry } from '@flows/constraint-solver';

interface SketchState {
  activeSketch: string | null;
  sketches: Map<string, Sketch>;
  entities: Map<string, SketchEntity>;
  constraints: Map<string, AppConstraint>;
}

interface ModelState {
  currentPart?: Part;
  activeSketch?: Sketch;
  sketches: Map<string, Sketch>;
  entities: Map<string, SketchEntity>;
  constraints: Map<string, AppConstraint>;
  features: Map<string, Feature>;
  selectedFeature?: string;
  selectedEntities: string[];
  sketchState: SketchState;
  constraintSolver: ConstraintSolver;
  
  // Sketch actions
  createSketch: (plane: string) => void;
  addSketchEntity: (entity: SketchEntity) => void;
  updateSketchEntity: (entityId: string, updates: Partial<SketchEntity>) => void;
  deleteSketchEntity: (entityId: string) => void;
  addConstraint: (constraint: AppConstraint) => void;
  removeConstraint: (constraintId: string) => void;
  updateConstraint: (constraintId: string, updates: Partial<AppConstraint>) => void;
  clearAllConstraints: () => void;
  
  // Constraint solving
  solveConstraints: () => void;
  
  // 3D Feature actions
  addFeature: (feature: Feature) => void;
  removeFeature: (featureId: string) => void;
  updateFeature: (featureId: string, updates: Partial<Feature>) => void;
  getFeatures: () => Feature[];
  
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
    sketches: new Map(),
    entities: new Map(),
    constraints: new Map(),
    features: new Map(),
    sketchState: {
      activeSketch: null,
      sketches: new Map(),
      entities: new Map(),
      constraints: new Map(),
    },
    constraintSolver: new ConstraintSolver(),

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
        // Also remove from sketchState
        state.sketchState.constraints.delete(constraintId);
      });
    },

    solveConstraints: () => {
      const { sketchState, constraintSolver } = get();
      
      if (!sketchState.activeSketch) return false;
      
      try {
        // Build constraint system
        const entities = new Map();
        const appConstraints = Array.from(sketchState.constraints.values());
        
        // Convert AppConstraint to solver Constraint format
        const constraints: Constraint[] = appConstraints.map(appConstraint => ({
          id: appConstraint.id,
          type: appConstraint.type as any, // Type assertion for compatibility
          entityIds: appConstraint.entities || [],
          parameters: appConstraint.value !== undefined ? { value: appConstraint.value } as Record<string, number> : {} as Record<string, number>,
          strength: appConstraint.satisfied ? 'required' : 'strong',
        }));
        
        // Convert entities to solver format
        for (const [id, entity] of sketchState.entities) {
          const geometry = createEntityGeometry(id, entity.type, entity);
          entities.set(id, geometry);
        }
        
        // Solve the system
        const result = constraintSolver.solve({
          entities,
          constraints,
          variables: new Map(),
        });
        
        if (result.success) {
          // Update entities with solved positions
          set((state) => {
            for (const [id, entity] of state.sketchState.entities) {
              const updatedEntity = updateEntityGeometry(entity, entity.type, result.variables);
              state.sketchState.entities.set(id, updatedEntity);
              
              // Also update in activeSketch if it exists
              if (state.activeSketch) {
                const sketchEntity = state.activeSketch.entities.find(e => e.id === id);
                if (sketchEntity) {
                  Object.assign(sketchEntity, updatedEntity);
                }
              }
            }
          });
          return true;
        } else {
          console.warn('Constraint solving failed:', result.error);
          return false;
        }
      } catch (error) {
        console.error('Error solving constraints:', error);
        return false;
      }
    },

    clearAllConstraints: () => {
      set((state) => {
        state.sketchState.constraints.clear();
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

    // 3D Feature management
    addFeature: (feature) => {
      set((state) => {
        state.features.set(feature.id, feature);
      });
    },

    removeFeature: (featureId) => {
      set((state) => {
        state.features.delete(featureId);
      });
    },

    updateFeature: (featureId, updates) => {
      set((state) => {
        const feature = state.features.get(featureId);
        if (feature) {
          Object.assign(feature, updates);
        }
      });
    },

    getFeatures: () => {
      return Array.from(get().features.values());
    },

    setSelection: (entityIds) => {
      set({ selectedEntities: entityIds });
    },

    clearSelection: () => {
      set({ selectedEntities: [] });
    },
  }))
);
