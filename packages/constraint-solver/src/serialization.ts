/**
 * Constraint System Serialization
 * 
 * Save and load constrained sketches with version migration support
 */

import type { ConstraintSystem, Constraint, EntityGeometry, ConstraintType, ConstraintStrength } from './types';

export interface SerializedConstraintSystem {
  version: '1.0';
  metadata: {
    name?: string;
    createdAt: string;
    modifiedAt: string;
    solverVersion: string;
    author?: string;
    description?: string;
  };
  entities: Array<{
    id: string;
    type: string;
    geometry: Record<string, any>;
  }>;
  constraints: Array<{
    id: string;
    type: string;
    entityIds: string[];
    parameters: Record<string, any>;
    strength?: string;
    suppressed?: boolean;
    isAuto?: boolean;
  }>;
  parameters?: Array<{
    name: string;
    value: number;
    unit: string;
    expression?: string;
    description?: string;
  }>;
}

export class ConstraintSerializer {
  private version = '1.0';
  private solverVersion = '0.1.0';

  /**
   * Serialize constraint system to JSON
   */
  serialize(system: ConstraintSystem, metadata?: Partial<SerializedConstraintSystem['metadata']>): string {
    const now = new Date().toISOString();
    
    const data: SerializedConstraintSystem = {
      version: this.version,
      metadata: {
        createdAt: now,
        modifiedAt: now,
        solverVersion: this.solverVersion,
        ...metadata,
      },
      entities: this.serializeEntities(system.entities),
      constraints: this.serializeConstraints(system.constraints),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Deserialize JSON to constraint system
   */
  deserialize(json: string): ConstraintSystem {
    const data: SerializedConstraintSystem = JSON.parse(json);

    // Version migration if needed
    const migrated = this.migrate(data);

    // Reconstruct entities
    const entities = new Map<string, EntityGeometry>();
    for (const entityData of migrated.entities) {
      const entity = this.deserializeEntity(entityData);
      entities.set(entityData.id, entity);
    }

    // Reconstruct constraints
    const constraints: Constraint[] = migrated.constraints.map(c => this.deserializeConstraint(c));

    return { entities, constraints };
  }

  /**
   * Serialize entities to plain objects
   */
  private serializeEntities(entities: Map<string, EntityGeometry>): SerializedConstraintSystem['entities'] {
    const serialized: SerializedConstraintSystem['entities'] = [];

    for (const [id, entity] of entities) {
      const geometry: Record<string, any> = {};
      
      // Extract geometry data from variables
      for (const [varName, variable] of entity.variables) {
        geometry[varName] = variable.value;
      }

      serialized.push({
        id,
        type: entity.type || 'unknown',
        geometry,
      });
    }

    return serialized;
  }

  /**
   * Serialize constraints to plain objects
   */
  private serializeConstraints(constraints: Constraint[]): SerializedConstraintSystem['constraints'] {
    return constraints.map(c => ({
      id: c.id,
      type: c.type,
      entityIds: [...c.entityIds],
      parameters: { ...c.parameters },
      strength: c.strength,
      suppressed: (c as any).suppressed,
      isAuto: (c as any).isAuto,
    }));
  }

  /**
   * Deserialize entity from plain object
   */
  private deserializeEntity(data: SerializedConstraintSystem['entities'][0]): EntityGeometry {
    const variables = new Map();

    // Reconstruct variables from geometry data
    for (const [key, value] of Object.entries(data.geometry)) {
      variables.set(key, {
        value: value as number,
        isFixed: false,
      });
    }

    return {
      type: data.type,
      variables,
    };
  }

  /**
   * Deserialize constraint from plain object
   */
  private deserializeConstraint(data: SerializedConstraintSystem['constraints'][0]): Constraint {
    return {
      id: data.id,
      type: data.type as ConstraintType,
      entityIds: data.entityIds,
      parameters: data.parameters,
      strength: (data.strength as ConstraintStrength) || 'required',
    };
  }

  /**
   * Migrate older versions to current version
   */
  private migrate(data: SerializedConstraintSystem): SerializedConstraintSystem {
    // Currently only version 1.0 exists
    // Future versions will add migration logic here
    
    if (data.version === '1.0') {
      return data;
    }

    // Example migration for hypothetical v0.9 -> v1.0
    // if (data.version === '0.9') {
    //   return this.migrateFrom09To10(data);
    // }

    console.warn(`Unknown version ${data.version}, attempting to load as-is`);
    return data;
  }

  /**
   * Validate serialized data before deserializing
   */
  validate(json: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const data = JSON.parse(json);

      // Check required fields
      if (!data.version) {
        errors.push('Missing version field');
      }

      if (!data.entities || !Array.isArray(data.entities)) {
        errors.push('Missing or invalid entities array');
      }

      if (!data.constraints || !Array.isArray(data.constraints)) {
        errors.push('Missing or invalid constraints array');
      }

      if (!data.metadata) {
        errors.push('Missing metadata');
      }

      // Validate entities
      if (data.entities) {
        for (let i = 0; i < data.entities.length; i++) {
          const entity = data.entities[i];
          if (!entity.id) {
            errors.push(`Entity ${i} missing id`);
          }
          if (!entity.type) {
            errors.push(`Entity ${i} missing type`);
          }
          if (!entity.geometry) {
            errors.push(`Entity ${i} missing geometry`);
          }
        }
      }

      // Validate constraints
      if (data.constraints) {
        for (let i = 0; i < data.constraints.length; i++) {
          const constraint = data.constraints[i];
          if (!constraint.id) {
            errors.push(`Constraint ${i} missing id`);
          }
          if (!constraint.type) {
            errors.push(`Constraint ${i} missing type`);
          }
          if (!constraint.entityIds || !Array.isArray(constraint.entityIds)) {
            errors.push(`Constraint ${i} missing or invalid entityIds`);
          }
        }
      }

      // Validate entity references in constraints
      if (data.entities && data.constraints) {
        const entityIds = new Set(data.entities.map((e: any) => e.id));
        for (const constraint of data.constraints) {
          for (const entityId of constraint.entityIds) {
            if (!entityIds.has(entityId)) {
              errors.push(`Constraint ${constraint.id} references non-existent entity ${entityId}`);
            }
          }
        }
      }

    } catch (e) {
      errors.push(`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Save to file (browser)
   */
  async saveToFile(system: ConstraintSystem, filename: string, metadata?: any): Promise<void> {
    const json = this.serialize(system, metadata);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.flows') ? filename : `${filename}.flows`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Load from file (browser)
   */
  async loadFromFile(file: File): Promise<ConstraintSystem> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          
          // Validate before deserializing
          const validation = this.validate(json);
          if (!validation.valid) {
            reject(new Error(`Invalid file: ${validation.errors.join(', ')}`));
            return;
          }

          const system = this.deserialize(json);
          resolve(system);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

/**
 * Utility functions for common serialization tasks
 */

export function exportSketch(system: ConstraintSystem, name: string): string {
  const serializer = new ConstraintSerializer();
  return serializer.serialize(system, { name });
}

export function importSketch(json: string): ConstraintSystem {
  const serializer = new ConstraintSerializer();
  return serializer.deserialize(json);
}

export function validateSketchFile(json: string): { valid: boolean; errors: string[] } {
  const serializer = new ConstraintSerializer();
  return serializer.validate(json);
}
