/**
 * Snap detection system for sketch tools
 */

import type { Point2D } from '../../types';
import type { 
  SketchEntity, 
  SnapTarget, 
  SnapSettings, 
  SketchLine, 
  SketchCircle, 
  SketchArc,
  SketchEllipse,
  SketchPolygon,
  SketchSlot,
  SketchSpline,
} from '../../types/sketch';
import {
  distance,
  midpoint,
  closestPointOnLine,
  linesIntersect,
  snapToGrid,
  angle,
  closestPointOnCircle,
  isAngleInArc,
  getPolygonVertices,
  polygonEdges,
  closestPointOnEllipse,
  slotRadius,
  slotDirection,
  splinePointAt,
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
          type: this.getNearestSnapType(entity),
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
      case 'ellipse': {
        const ellipse = entity as SketchEllipse;
        return [
          { x: ellipse.center.x + ellipse.majorAxis * Math.cos(ellipse.rotation), y: ellipse.center.y + ellipse.majorAxis * Math.sin(ellipse.rotation) },
          { x: ellipse.center.x - ellipse.majorAxis * Math.cos(ellipse.rotation), y: ellipse.center.y - ellipse.majorAxis * Math.sin(ellipse.rotation) },
        ];
      }
      case 'polygon': {
        return getPolygonVertices(entity as SketchPolygon);
      }
      case 'slot': {
        const slot = entity as SketchSlot;
        return [slot.start, slot.end];
      }
      case 'spline': {
        const spline = entity as SketchSpline;
        if (spline.controlPoints.length === 0) {
          return [];
        }
        const first = spline.controlPoints[0];
        const last = spline.controlPoints[spline.controlPoints.length - 1];
        return [first, last];
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
      case 'slot': {
        const slot = entity as SketchSlot;
        return midpoint(slot.start, slot.end);
      }
      case 'polygon': {
        const vertices = getPolygonVertices(entity as SketchPolygon);
        if (vertices.length === 0) return null;
        const sum = vertices.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }), { x: 0, y: 0 });
        return {
          x: sum.x / vertices.length,
          y: sum.y / vertices.length,
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
      case 'ellipse': {
        return (entity as SketchEllipse).center;
      }
      case 'slot': {
        const slot = entity as SketchSlot;
        return midpoint(slot.start, slot.end);
      }
      case 'polygon': {
        return this.getMidpoint(entity);
      }
      case 'spline': {
        const spline = entity as SketchSpline;
        if (spline.controlPoints.length === 0) return null;
        const sum = spline.controlPoints.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
        return {
          x: sum.x / spline.controlPoints.length,
          y: sum.y / spline.controlPoints.length,
        };
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
      case 'ellipse': {
        const ellipse = entity as SketchEllipse;
        const nearest = closestPointOnEllipse(ellipse, point);
        return {
          position: nearest,
          distance: distance(point, nearest),
        };
      }
      case 'polygon': {
        const edges = polygonEdges(entity as SketchPolygon);
        let best: { position: Point2D; distance: number } | null = null;
        edges.forEach((edge) => {
          const p = closestPointOnLine(edge, point);
          const d = distance(point, p);
          if (!best || d < best.distance) {
            best = { position: p, distance: d };
          }
        });
        return best;
      }
      case 'slot': {
        const slot = entity as SketchSlot;
        const line = closestPointOnLine({
          type: 'line',
          id: `${slot.id}-center`,
          sketchId: slot.sketchId,
          isConstruction: slot.isConstruction,
          isSelected: slot.isSelected,
          isHighlighted: slot.isHighlighted,
          createdAt: slot.createdAt,
          start: slot.start,
          end: slot.end,
        } as SketchLine, point);
        const radius = slotRadius(slot);
        const dir = slotDirection(slot);
        const perp = { x: -dir.y, y: dir.x };
        // Determine which side the point is on
        const dot = (point.x - line.x) * perp.x + (point.y - line.y) * perp.y;
        const offset = {
          x: line.x + perp.x * Math.sign(dot) * radius,
          y: line.y + perp.y * Math.sign(dot) * radius,
        };
        return {
          position: offset,
          distance: distance(point, offset),
        };
      }
      case 'spline': {
        const spline = entity as SketchSpline;
        const segments = 32;
        let best: { position: Point2D; distance: number } | null = null;
        let prev = spline.controlPoints[0];
        for (let i = 1; i <= segments; i++) {
          const t = i / segments;
          const current = splinePointAt(spline, t);
          const candidate = closestPointOnLine({
            id: `${spline.id}-seg-${i}`,
            type: 'line',
            sketchId: spline.sketchId,
            isConstruction: spline.isConstruction,
            isSelected: spline.isSelected,
            isHighlighted: spline.isHighlighted,
            createdAt: spline.createdAt,
            start: prev,
            end: current,
          } as SketchLine, point);
          const d = distance(point, candidate);
          if (!best || d < best.distance) {
            best = { position: candidate, distance: d };
          }
          prev = current;
        }
        return best;
      }
      default:
        return null;
    }
  }

  private getNearestSnapType(entity: SketchEntity): SnapTarget['type'] {
    switch (entity.type) {
      case 'line':
      case 'slot':
        return 'perpendicular';
      case 'circle':
      case 'arc':
      case 'ellipse':
        return 'tangent';
      default:
        return 'nearest';
    }
  }
  
  /**
   * Find intersections near a point
   */
  private findIntersections(point: Point2D): SnapTarget[] {
    const intersections: SnapTarget[] = [];
    
    const lineEntities = this.entities.filter(e => e.type === 'line' || e.type === 'slot');
    const lines: SketchLine[] = lineEntities.map((entity) => {
      if (entity.type === 'line') return entity as SketchLine;
      const slot = entity as SketchSlot;
      return {
        id: `${slot.id}-centerline`,
        type: 'line',
        sketchId: slot.sketchId,
        isConstruction: slot.isConstruction,
        isSelected: slot.isSelected,
        isHighlighted: slot.isHighlighted,
        createdAt: slot.createdAt,
        start: slot.start,
        end: slot.end,
      };
    });
    const circles = this.entities.filter(e => e.type === 'circle') as SketchCircle[];
    const arcs = this.entities.filter(e => e.type === 'arc') as SketchArc[];
    
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
    
    // Circle/Arc with lines
    [...circles, ...arcs].forEach((circleEntity) => {
      const circle: SketchCircle = circleEntity.type === 'arc'
        ? {
            ...(circleEntity as unknown as SketchArc),
            type: 'circle',
            radius: (circleEntity as SketchArc).radius,
            center: (circleEntity as SketchArc).center,
            sketchId: circleEntity.sketchId,
            id: circleEntity.id,
            isConstruction: circleEntity.isConstruction,
            isSelected: circleEntity.isSelected,
            isHighlighted: circleEntity.isHighlighted,
            createdAt: circleEntity.createdAt,
          }
        : (circleEntity as SketchCircle);
      
      lines.forEach((line) => {
        const intersectionsPoints = this.circleLineIntersections(circle, line);
        intersectionsPoints.forEach((pt) => {
          const dist = distance(point, pt);
          if (dist < this.settings.snapDistance) {
            intersections.push({
              type: 'intersection',
              position: pt,
              entityId: `${circle.id},${line.id}`,
              distance: dist,
            });
          }
        });
      });
    });
    
    // Circle-circle intersections
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const points = this.circleCircleIntersections(circles[i], circles[j]);
        points.forEach((pt) => {
          const dist = distance(point, pt);
          if (dist < this.settings.snapDistance) {
            intersections.push({
              type: 'intersection',
              position: pt,
              entityId: `${circles[i].id},${circles[j].id}`,
              distance: dist,
            });
          }
        });
      }
    }
    
    return intersections;
  }
  
  private circleLineIntersections(circle: SketchCircle, line: SketchLine): Point2D[] {
    const x1 = line.start.x - circle.center.x;
    const y1 = line.start.y - circle.center.y;
    const x2 = line.end.x - circle.center.x;
    const y2 = line.end.y - circle.center.y;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dr2 = dx * dx + dy * dy;
    const D = x1 * y2 - x2 * y1;
    const discriminant = circle.radius * circle.radius * dr2 - D * D;
    
    if (discriminant < 0) {
      return [];
    }
    
    const sqrtDisc = Math.sqrt(Math.max(discriminant, 0));
    const signDy = dy < 0 ? -1 : 1;
    
    const intersections: Point2D[] = [];
    const ix1 = (D * dy + signDy * dx * sqrtDisc) / dr2 + circle.center.x;
    const iy1 = (-D * dx + Math.abs(dy) * sqrtDisc) / dr2 + circle.center.y;
    intersections.push({ x: ix1, y: iy1 });
    
    if (discriminant !== 0) {
      const ix2 = (D * dy - signDy * dx * sqrtDisc) / dr2 + circle.center.x;
      const iy2 = (-D * dx - Math.abs(dy) * sqrtDisc) / dr2 + circle.center.y;
      intersections.push({ x: ix2, y: iy2 });
    }
    
    return intersections;
  }
  
  private circleCircleIntersections(c1: SketchCircle, c2: SketchCircle): Point2D[] {
    const dx = c2.center.x - c1.center.x;
    const dy = c2.center.y - c1.center.y;
    const d = Math.hypot(dx, dy);
    
    if (d === 0 || d > c1.radius + c2.radius || d < Math.abs(c1.radius - c2.radius)) {
      return [];
    }
    
    const a = (c1.radius * c1.radius - c2.radius * c2.radius + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, c1.radius * c1.radius - a * a));
    const xm = c1.center.x + (a * dx) / d;
    const ym = c1.center.y + (a * dy) / d;
    const rx = -dy * (h / d);
    const ry = dx * (h / d);
    
    const p1 = { x: xm + rx, y: ym + ry };
    const points = [p1];
    
    if (h !== 0) {
      const p2 = { x: xm - rx, y: ym - ry };
      points.push(p2);
    }
    
    return points;
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
