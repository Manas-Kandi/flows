/**
 * Snap detection system for sketch tools
 */

import type { Point2D } from '../../types';
import type { SketchEntity, SnapTarget, SnapSettings, SketchLine, SketchCircle, SketchArc } from '../../types/sketch';
import {
  distance,
  midpoint,
  closestPointOnLine,
  linesIntersect,
  snapToGrid,
  angle,
  closestPointOnCircle,
  isAngleInArc,
} from './geometry';

export class SnapDetector {
  private settings: SnapSettings;
  private entities: SketchEntity[];
  
  constructor(settings: SnapSettings, entities: SketchEntity[]) {
    this.settings = settings;
    this.entities = entities;
  }
  
  /**
   * Find the best snap target for a given point
   */
  findSnapTarget(point: Point2D, gridSize: number): SnapTarget | null {
    if (!this.settings.enabled) return null;
    
    const candidates: SnapTarget[] = [];
    
    // Grid snap
    if (this.settings.gridSnap) {
      const gridPoint = snapToGrid(point, gridSize);
      candidates.push({
        type: 'grid',
        position: gridPoint,
        distance: distance(point, gridPoint),
      });
    }
    
    // Entity snaps
    for (const entity of this.entities) {
      if (entity.isConstruction) continue; // Skip construction geometry for now
      
      // Endpoint snap
      if (this.settings.endpointSnap) {
        const endpoints = this.getEndpoints(entity);
        for (const endpoint of endpoints) {
          const dist = distance(point, endpoint);
          if (dist < this.settings.snapDistance) {
            candidates.push({
              type: 'endpoint',
              position: endpoint,
              entityId: entity.id,
              distance: dist,
            });
          }
        }
      }
      
      // Midpoint snap
      if (this.settings.midpointSnap) {
        const mid = this.getMidpoint(entity);
        if (mid) {
          const dist = distance(point, mid);
          if (dist < this.settings.snapDistance) {
            candidates.push({
              type: 'midpoint',
              position: mid,
              entityId: entity.id,
              distance: dist,
            });
          }
        }
      }
      
      // Center snap
      if (this.settings.centerSnap) {
        const center = this.getCenter(entity);
        if (center) {
          const dist = distance(point, center);
          if (dist < this.settings.snapDistance) {
            candidates.push({
              type: 'center',
              position: center,
              entityId: entity.id,
              distance: dist,
            });
          }
        }
      }
      
      // Nearest point on curve
      const nearest = this.getNearestPointOn(entity, point);
      if (nearest && nearest.distance < this.settings.snapDistance) {
        candidates.push({
          type: 'nearest',
          position: nearest.position,
          entityId: entity.id,
          distance: nearest.distance,
        });
      }
    }
    
    // Intersection snap
    if (this.settings.intersectionSnap) {
      const intersections = this.findIntersections(point);
      candidates.push(...intersections);
    }
    
    // Find closest candidate
    if (candidates.length === 0) return null;
    
    candidates.sort((a, b) => a.distance - b.distance);
    
    // Prioritize certain snap types
    const priorityOrder: Record<string, number> = {
      endpoint: 1,
      center: 2,
      midpoint: 3,
      intersection: 4,
      perpendicular: 5,
      tangent: 6,
      nearest: 7,
      grid: 8,
    };
    
    // Get best snaps within snap distance
    const bestSnaps = candidates.filter(c => c.distance < this.settings.snapDistance);
    if (bestSnaps.length === 0) return null;
    
    // Sort by priority then distance
    bestSnaps.sort((a, b) => {
      const priorityDiff = (priorityOrder[a.type] || 99) - (priorityOrder[b.type] || 99);
      if (priorityDiff !== 0) return priorityDiff;
      return a.distance - b.distance;
    });
    
    return bestSnaps[0];
  }
  
  /**
   * Get endpoints of an entity
   */
  private getEndpoints(entity: SketchEntity): Point2D[] {
    switch (entity.type) {
      case 'line': {
        const line = entity as SketchLine;
        return [line.start, line.end];
      }
      case 'arc': {
        const arc = entity as SketchArc;
        return [
          { x: arc.center.x + arc.radius * Math.cos(arc.startAngle), y: arc.center.y + arc.radius * Math.sin(arc.startAngle) },
          { x: arc.center.x + arc.radius * Math.cos(arc.endAngle), y: arc.center.y + arc.radius * Math.sin(arc.endAngle) },
        ];
      }
      case 'point': {
        return [(entity as any).position];
      }
      default:
        return [];
    }
  }
  
  /**
   * Get midpoint of an entity
   */
  private getMidpoint(entity: SketchEntity): Point2D | null {
    switch (entity.type) {
      case 'line': {
        const line = entity as SketchLine;
        return midpoint(line.start, line.end);
      }
      case 'arc': {
        const arc = entity as SketchArc;
        const midAngle = (arc.startAngle + arc.endAngle) / 2;
        return {
          x: arc.center.x + arc.radius * Math.cos(midAngle),
          y: arc.center.y + arc.radius * Math.sin(midAngle),
        };
      }
      default:
        return null;
    }
  }
  
  /**
   * Get center of an entity
   */
  private getCenter(entity: SketchEntity): Point2D | null {
    switch (entity.type) {
      case 'circle': {
        const circle = entity as SketchCircle;
        return circle.center;
      }
      case 'arc': {
        const arc = entity as SketchArc;
        return arc.center;
      }
      case 'rectangle': {
        const rect = entity as any;
        return midpoint(rect.topLeft, rect.bottomRight);
      }
      default:
        return null;
    }
  }
  
  /**
   * Get nearest point on entity
   */
  private getNearestPointOn(entity: SketchEntity, point: Point2D): { position: Point2D; distance: number } | null {
    switch (entity.type) {
      case 'line': {
        const line = entity as SketchLine;
        const nearest = closestPointOnLine(line, point);
        return {
          position: nearest,
          distance: distance(point, nearest),
        };
      }
      case 'circle': {
        const circle = entity as SketchCircle;
        const nearest = closestPointOnCircle(circle, point);
        return {
          position: nearest,
          distance: distance(point, nearest),
        };
      }
      case 'arc': {
        const arc = entity as SketchArc;
        const ang = angle(arc.center, point);
        
        if (isAngleInArc(arc, ang)) {
          const nearest = closestPointOnCircle(arc as SketchCircle, point);
          return {
            position: nearest,
            distance: distance(point, nearest),
          };
        }
        return null;
      }
      default:
        return null;
    }
  }
  
  /**
   * Find intersections near a point
   */
  private findIntersections(point: Point2D): SnapTarget[] {
    const intersections: SnapTarget[] = [];
    
    const lines = this.entities.filter(e => e.type === 'line') as SketchLine[];
    
    // Line-line intersections
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const intersection = linesIntersect(lines[i], lines[j]);
        if (intersection) {
          const dist = distance(point, intersection);
          if (dist < this.settings.snapDistance) {
            intersections.push({
              type: 'intersection',
              position: intersection,
              entityId: `${lines[i].id},${lines[j].id}`,
              distance: dist,
            });
          }
        }
      }
    }
    
    // TODO: Add circle-line, circle-circle intersections
    
    return intersections;
  }
  
  /**
   * Update settings
   */
  updateSettings(settings: SnapSettings) {
    this.settings = settings;
  }
  
  /**
   * Update entities
   */
  updateEntities(entities: SketchEntity[]) {
    this.entities = entities;
  }
}
