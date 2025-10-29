/**
 * Auto-Constraint System
 * 
 * Automatically applies constraints based on geometric relationships
 * Similar to SolidWorks and Fusion 360 auto-constraint behavior
 */

import type { Constraint, EntityGeometry, ConstraintType } from './types';

export interface AutoConstraintRule {
  name: string;
  description: string;
  constraintType: ConstraintType;
  tolerance: number;
  priority: number;
  condition: (
    entity: EntityGeometry,
    entityId: string,
    context: AutoConstraintContext
  ) => boolean;
  createConstraint: (
    entityId: string,
    context: AutoConstraintContext
  ) => Constraint | null;
}

export interface AutoConstraintContext {
  allEntities: Map<string, EntityGeometry>;
  existingConstraints: Constraint[];
  tolerance: {
    angle: number; // degrees
    distance: number; // mm
  };
}

export interface AutoConstraintSettings {
  enabled: boolean;
  rules: {
    horizontal: boolean;
    vertical: boolean;
    perpendicular: boolean;
    parallel: boolean;
    tangent: boolean;
    coincident: boolean;
  };
  tolerance: {
    angle: number;
    distance: number;
  };
  confirmBeforeApply: boolean;
  showNotifications: boolean;
}

export const DEFAULT_SETTINGS: AutoConstraintSettings = {
  enabled: true,
  rules: {
    horizontal: true,
    vertical: true,
    perpendicular: true,
    parallel: true,
    tangent: true,
    coincident: true,
  },
  tolerance: {
    angle: 5, // degrees
    distance: 1, // mm
  },
  confirmBeforeApply: false,
  showNotifications: true,
};

export class AutoConstraintEngine {
  private settings: AutoConstraintSettings;
  private rules: AutoConstraintRule[];

  constructor(settings: AutoConstraintSettings = DEFAULT_SETTINGS) {
    this.settings = settings;
    this.rules = this.initializeRules();
  }

  /**
   * Evaluate all rules for a single entity
   */
  evaluateEntity(
    entityId: string,
    entity: EntityGeometry,
    context: AutoConstraintContext
  ): Constraint[] {
    if (!this.settings.enabled) {
      return [];
    }

    const autoConstraints: Constraint[] = [];

    // Sort rules by priority (higher first)
    const sortedRules = [...this.rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      // Check if rule is enabled
      const ruleEnabled = this.isRuleEnabled(rule.constraintType);
      if (!ruleEnabled) {
        continue;
      }

      // Check if constraint already exists
      if (this.hasExistingConstraint(entityId, rule.constraintType, context)) {
        continue;
      }

      // Evaluate rule condition
      if (rule.condition(entity, entityId, context)) {
        const constraint = rule.createConstraint(entityId, context);
        if (constraint) {
          autoConstraints.push({
            ...constraint,
            strength: 'weak', // Auto-constraints are weak
            isAuto: true,
          } as Constraint);
        }
      }
    }

    return autoConstraints;
  }

  /**
   * Evaluate rules for all entities
   */
  evaluateAll(context: AutoConstraintContext): Constraint[] {
    const allAutoConstraints: Constraint[] = [];

    for (const [entityId, entity] of context.allEntities) {
      const constraints = this.evaluateEntity(entityId, entity, context);
      allAutoConstraints.push(...constraints);
    }

    return allAutoConstraints;
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<AutoConstraintSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Check if a rule is enabled in settings
   */
  private isRuleEnabled(constraintType: ConstraintType): boolean {
    const typeMap: Record<string, keyof AutoConstraintSettings['rules']> = {
      horizontal: 'horizontal',
      vertical: 'vertical',
      perpendicular: 'perpendicular',
      parallel: 'parallel',
      tangent: 'tangent',
      coincident: 'coincident',
    };

    const key = typeMap[constraintType];
    return key ? this.settings.rules[key] : false;
  }

  /**
   * Check if entity already has a constraint of this type
   */
  private hasExistingConstraint(
    entityId: string,
    type: ConstraintType,
    context: AutoConstraintContext
  ): boolean {
    return context.existingConstraints.some(
      (c) => c.type === type && c.entityIds.includes(entityId)
    );
  }

  /**
   * Initialize all auto-constraint rules
   */
  private initializeRules(): AutoConstraintRule[] {
    return [
      // Horizontal line rule
      {
        name: 'Auto-Horizontal',
        description: 'Detect nearly horizontal lines',
        constraintType: 'horizontal',
        tolerance: this.settings.tolerance.angle,
        priority: 10,
        condition: (entity, _id, context) => {
          if (!entity.variables.has('startX')) return false;

          const startX = entity.variables.get('startX')!.value;
          const startY = entity.variables.get('startY')!.value;
          const endX = entity.variables.get('endX')!.value;
          const endY = entity.variables.get('endY')!.value;

          const angle = Math.atan2(endY - startY, endX - startX);
          const angleDeg = Math.abs((angle * 180) / Math.PI);

          return angleDeg < context.tolerance.angle || angleDeg > 180 - context.tolerance.angle;
        },
        createConstraint: (entityId) => ({
          id: `auto_horizontal_${entityId}`,
          type: 'horizontal',
          entityIds: [entityId],
          parameters: {},
          strength: 'weak',
        }),
      },

      // Vertical line rule
      {
        name: 'Auto-Vertical',
        description: 'Detect nearly vertical lines',
        constraintType: 'vertical',
        tolerance: this.settings.tolerance.angle,
        priority: 10,
        condition: (entity, _id, context) => {
          if (!entity.variables.has('startX')) return false;

          const startX = entity.variables.get('startX')!.value;
          const startY = entity.variables.get('startY')!.value;
          const endX = entity.variables.get('endX')!.value;
          const endY = entity.variables.get('endY')!.value;

          const angle = Math.atan2(endY - startY, endX - startX);
          const angleDeg = Math.abs((angle * 180) / Math.PI);

          return Math.abs(angleDeg - 90) < context.tolerance.angle;
        },
        createConstraint: (entityId) => ({
          id: `auto_vertical_${entityId}`,
          type: 'vertical',
          entityIds: [entityId],
          parameters: {},
          strength: 'weak',
        }),
      },

      // Perpendicular lines rule
      {
        name: 'Auto-Perpendicular',
        description: 'Detect perpendicular lines',
        constraintType: 'perpendicular',
        tolerance: this.settings.tolerance.angle,
        priority: 8,
        condition: (entity, entityId, context) => {
          if (!entity.variables.has('startX')) return false;

          const angle1 = this.getLineAngle(entity);

          // Find other lines
          for (const [otherId, otherEntity] of context.allEntities) {
            if (otherId === entityId) continue;
            if (!otherEntity.variables.has('startX')) continue;

            const angle2 = this.getLineAngle(otherEntity);
            const angleDiff = Math.abs(angle1 - angle2);
            const angleDiffDeg = (angleDiff * 180) / Math.PI;

            if (Math.abs(angleDiffDeg - 90) < context.tolerance.angle) {
              return true;
            }
          }

          return false;
        },
        createConstraint: (entityId, context) => {
          // Find the perpendicular line
          const entity = context.allEntities.get(entityId)!;
          const angle1 = this.getLineAngle(entity);

          for (const [otherId, otherEntity] of context.allEntities) {
            if (otherId === entityId) continue;
            if (!otherEntity.variables.has('startX')) continue;

            const angle2 = this.getLineAngle(otherEntity);
            const angleDiff = Math.abs(angle1 - angle2);
            const angleDiffDeg = (angleDiff * 180) / Math.PI;

            if (Math.abs(angleDiffDeg - 90) < context.tolerance.angle) {
              return {
                id: `auto_perpendicular_${entityId}_${otherId}`,
                type: 'perpendicular',
                entityIds: [entityId, otherId],
                parameters: {},
                strength: 'weak',
              };
            }
          }

          return null;
        },
      },

      // Parallel lines rule
      {
        name: 'Auto-Parallel',
        description: 'Detect parallel lines',
        constraintType: 'parallel',
        tolerance: this.settings.tolerance.angle,
        priority: 8,
        condition: (entity, entityId, context) => {
          if (!entity.variables.has('startX')) return false;

          const angle1 = this.getLineAngle(entity);

          // Find other lines
          for (const [otherId, otherEntity] of context.allEntities) {
            if (otherId === entityId) continue;
            if (!otherEntity.variables.has('startX')) continue;

            const angle2 = this.getLineAngle(otherEntity);
            const angleDiff = Math.abs(angle1 - angle2);
            const angleDiffDeg = (angleDiff * 180) / Math.PI;

            if (angleDiffDeg < context.tolerance.angle) {
              return true;
            }
          }

          return false;
        },
        createConstraint: (entityId, context) => {
          // Find the parallel line
          const entity = context.allEntities.get(entityId)!;
          const angle1 = this.getLineAngle(entity);

          for (const [otherId, otherEntity] of context.allEntities) {
            if (otherId === entityId) continue;
            if (!otherEntity.variables.has('startX')) continue;

            const angle2 = this.getLineAngle(otherEntity);
            const angleDiff = Math.abs(angle1 - angle2);
            const angleDiffDeg = (angleDiff * 180) / Math.PI;

            if (angleDiffDeg < context.tolerance.angle) {
              return {
                id: `auto_parallel_${entityId}_${otherId}`,
                type: 'parallel',
                entityIds: [entityId, otherId],
                parameters: {},
                strength: 'weak',
              };
            }
          }

          return null;
        },
      },

      // Coincident points rule
      {
        name: 'Auto-Coincident',
        description: 'Detect nearly coincident points',
        constraintType: 'coincident',
        tolerance: this.settings.tolerance.distance,
        priority: 9,
        condition: (entity, entityId, context) => {
          // Check line endpoints against other entities
          if (!entity.variables.has('endX')) return false;

          const endX = entity.variables.get('endX')!.value;
          const endY = entity.variables.get('endY')!.value;

          for (const [otherId, otherEntity] of context.allEntities) {
            if (otherId === entityId) continue;
            if (!otherEntity.variables.has('startX')) continue;

            const startX = otherEntity.variables.get('startX')!.value;
            const startY = otherEntity.variables.get('startY')!.value;

            const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

            if (distance < context.tolerance.distance) {
              return true;
            }
          }

          return false;
        },
        createConstraint: (entityId, context) => {
          const entity = context.allEntities.get(entityId)!;
          const endX = entity.variables.get('endX')!.value;
          const endY = entity.variables.get('endY')!.value;

          for (const [otherId, otherEntity] of context.allEntities) {
            if (otherId === entityId) continue;
            if (!otherEntity.variables.has('startX')) continue;

            const startX = otherEntity.variables.get('startX')!.value;
            const startY = otherEntity.variables.get('startY')!.value;

            const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

            if (distance < context.tolerance.distance) {
              return {
                id: `auto_coincident_${entityId}_${otherId}`,
                type: 'coincident',
                entityIds: [entityId, otherId],
                parameters: { point1: 'end', point2: 'start' },
                strength: 'weak',
              };
            }
          }

          return null;
        },
      },

      // Tangent circle-to-line rule
      {
        name: 'Auto-Tangent',
        description: 'Detect tangent relationships',
        constraintType: 'tangent',
        tolerance: this.settings.tolerance.distance,
        priority: 7,
        condition: (entity, entityId, context) => {
          // Check if circle is tangent to any line
          if (!entity.variables.has('radius')) return false;

          const centerX = entity.variables.get('centerX')!.value;
          const centerY = entity.variables.get('centerY')!.value;
          const radius = entity.variables.get('radius')!.value;

          for (const [otherId, otherEntity] of context.allEntities) {
            if (otherId === entityId) continue;
            if (!otherEntity.variables.has('startX')) continue;

            const distance = this.distancePointToLine(
              { x: centerX, y: centerY },
              otherEntity
            );

            if (Math.abs(distance - radius) < context.tolerance.distance) {
              return true;
            }
          }

          return false;
        },
        createConstraint: (entityId, context) => {
          const entity = context.allEntities.get(entityId)!;
          const centerX = entity.variables.get('centerX')!.value;
          const centerY = entity.variables.get('centerY')!.value;
          const radius = entity.variables.get('radius')!.value;

          for (const [otherId, otherEntity] of context.allEntities) {
            if (otherId === entityId) continue;
            if (!otherEntity.variables.has('startX')) continue;

            const distance = this.distancePointToLine(
              { x: centerX, y: centerY },
              otherEntity
            );

            if (Math.abs(distance - radius) < context.tolerance.distance) {
              return {
                id: `auto_tangent_${entityId}_${otherId}`,
                type: 'tangent',
                entityIds: [entityId, otherId],
                parameters: {},
                strength: 'weak',
              };
            }
          }

          return null;
        },
      },
    ];
  }

  /**
   * Helper: Get angle of a line entity
   */
  private getLineAngle(entity: EntityGeometry): number {
    const startX = entity.variables.get('startX')!.value;
    const startY = entity.variables.get('startY')!.value;
    const endX = entity.variables.get('endX')!.value;
    const endY = entity.variables.get('endY')!.value;

    return Math.atan2(endY - startY, endX - startX);
  }

  /**
   * Helper: Calculate distance from point to line
   */
  private distancePointToLine(
    point: { x: number; y: number },
    lineEntity: EntityGeometry
  ): number {
    const x0 = point.x;
    const y0 = point.y;
    const x1 = lineEntity.variables.get('startX')!.value;
    const y1 = lineEntity.variables.get('startY')!.value;
    const x2 = lineEntity.variables.get('endX')!.value;
    const y2 = lineEntity.variables.get('endY')!.value;

    const numerator = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
    const denominator = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);

    return numerator / denominator;
  }
}
