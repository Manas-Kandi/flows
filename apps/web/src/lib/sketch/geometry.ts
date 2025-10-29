/**
 * Sketch geometry utilities and calculations
 */

import type { Point2D } from '../../types';
import type { SketchEntity, SketchLine, SketchCircle, SketchArc, BoundingBox } from '../../types/sketch';

// ============================================================================
// Distance and Length Calculations
// ============================================================================

export function distance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSquared(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}

export function lineLength(line: SketchLine): number {
  return distance(line.start, line.end);
}

// ============================================================================
// Angle Calculations
// ============================================================================

export function angle(p1: Point2D, p2: Point2D): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

export function angleBetweenLines(line1: SketchLine, line2: SketchLine): number {
  const angle1 = angle(line1.start, line1.end);
  const angle2 = angle(line2.start, line2.end);
  let diff = angle2 - angle1;
  
  // Normalize to [-π, π]
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  
  return diff;
}

export function normalizeAngle(rad: number): number {
  while (rad > Math.PI) rad -= 2 * Math.PI;
  while (rad < -Math.PI) rad += 2 * Math.PI;
  return rad;
}

export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ============================================================================
// Point Operations
// ============================================================================

export function midpoint(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

export function lerp(p1: Point2D, p2: Point2D, t: number): Point2D {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

export function rotate(point: Point2D, center: Point2D, angle: number): Point2D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function translate(point: Point2D, dx: number, dy: number): Point2D {
  return {
    x: point.x + dx,
    y: point.y + dy,
  };
}

export function scale(point: Point2D, center: Point2D, factor: number): Point2D {
  return {
    x: center.x + (point.x - center.x) * factor,
    y: center.y + (point.y - center.y) * factor,
  };
}

// ============================================================================
// Vector Operations
// ============================================================================

export function normalize(p1: Point2D, p2: Point2D): Point2D {
  const len = distance(p1, p2);
  if (len === 0) return { x: 0, y: 0 };
  return {
    x: (p2.x - p1.x) / len,
    y: (p2.y - p1.y) / len,
  };
}

export function dotProduct(v1: Point2D, v2: Point2D): number {
  return v1.x * v2.x + v1.y * v2.y;
}

export function crossProduct(v1: Point2D, v2: Point2D): number {
  return v1.x * v2.y - v1.y * v2.x;
}

export function perpendicular(v: Point2D): Point2D {
  return { x: -v.y, y: v.x };
}

// ============================================================================
// Line Operations
// ============================================================================

export function pointOnLine(line: SketchLine, t: number): Point2D {
  return lerp(line.start, line.end, t);
}

export function closestPointOnLine(line: SketchLine, point: Point2D): Point2D {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  const lengthSquared = dx * dx + dy * dy;
  
  if (lengthSquared === 0) return line.start;
  
  const t = Math.max(0, Math.min(1,
    ((point.x - line.start.x) * dx + (point.y - line.start.y) * dy) / lengthSquared
  ));
  
  return pointOnLine(line, t);
}

export function distanceToLine(line: SketchLine, point: Point2D): number {
  const closest = closestPointOnLine(line, point);
  return distance(point, closest);
}

export function isPointOnLine(line: SketchLine, point: Point2D, tolerance = 0.1): boolean {
  return distanceToLine(line, point) < tolerance;
}

export function linesIntersect(line1: SketchLine, line2: SketchLine): Point2D | null {
  const x1 = line1.start.x, y1 = line1.start.y;
  const x2 = line1.end.x, y2 = line1.end.y;
  const x3 = line2.start.x, y3 = line2.start.y;
  const x4 = line2.end.x, y4 = line2.end.y;
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null; // Parallel lines
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }
  
  return null;
}

// ============================================================================
// Circle Operations
// ============================================================================

export function pointOnCircle(circle: SketchCircle, angle: number): Point2D {
  return {
    x: circle.center.x + circle.radius * Math.cos(angle),
    y: circle.center.y + circle.radius * Math.sin(angle),
  };
}

export function isPointOnCircle(circle: SketchCircle, point: Point2D, tolerance = 0.1): boolean {
  const dist = distance(circle.center, point);
  return Math.abs(dist - circle.radius) < tolerance;
}

export function closestPointOnCircle(circle: SketchCircle, point: Point2D): Point2D {
  const dir = normalize(circle.center, point);
  return {
    x: circle.center.x + dir.x * circle.radius,
    y: circle.center.y + dir.y * circle.radius,
  };
}

// ============================================================================
// Arc Operations
// ============================================================================

export function pointOnArc(arc: SketchArc, angle: number): Point2D {
  return {
    x: arc.center.x + arc.radius * Math.cos(angle),
    y: arc.center.y + arc.radius * Math.sin(angle),
  };
}

export function isAngleInArc(arc: SketchArc, angle: number): boolean {
  let { startAngle, endAngle } = arc;
  
  // Normalize angles
  angle = normalizeAngle(angle);
  startAngle = normalizeAngle(startAngle);
  endAngle = normalizeAngle(endAngle);
  
  if (startAngle <= endAngle) {
    return angle >= startAngle && angle <= endAngle;
  } else {
    return angle >= startAngle || angle <= endAngle;
  }
}

export function arcLength(arc: SketchArc): number {
  const angleSpan = Math.abs(arc.endAngle - arc.startAngle);
  return arc.radius * angleSpan;
}

// ============================================================================
// Bounding Box
// ============================================================================

export function getEntityBoundingBox(entity: SketchEntity): BoundingBox {
  switch (entity.type) {
    case 'line': {
      const line = entity as SketchLine;
      return {
        min: {
          x: Math.min(line.start.x, line.end.x),
          y: Math.min(line.start.y, line.end.y),
        },
        max: {
          x: Math.max(line.start.x, line.end.x),
          y: Math.max(line.start.y, line.end.y),
        },
      };
    }
    
    case 'circle': {
      const circle = entity as SketchCircle;
      return {
        min: {
          x: circle.center.x - circle.radius,
          y: circle.center.y - circle.radius,
        },
        max: {
          x: circle.center.x + circle.radius,
          y: circle.center.y + circle.radius,
        },
      };
    }
    
    case 'arc': {
      const arc = entity as SketchArc;
      // Simplified - full implementation would check arc span
      return {
        min: {
          x: arc.center.x - arc.radius,
          y: arc.center.y - arc.radius,
        },
        max: {
          x: arc.center.x + arc.radius,
          y: arc.center.y + arc.radius,
        },
      };
    }
    
    case 'point': {
      const point = (entity as any).position;
      return {
        min: { ...point },
        max: { ...point },
      };
    }
    
    default:
      return {
        min: { x: 0, y: 0 },
        max: { x: 0, y: 0 },
      };
  }
}

export function isPointInBoundingBox(point: Point2D, bbox: BoundingBox, margin = 0): boolean {
  return (
    point.x >= bbox.min.x - margin &&
    point.x <= bbox.max.x + margin &&
    point.y >= bbox.min.y - margin &&
    point.y <= bbox.max.y + margin
  );
}

export function expandBoundingBox(bbox: BoundingBox, margin: number): BoundingBox {
  return {
    min: {
      x: bbox.min.x - margin,
      y: bbox.min.y - margin,
    },
    max: {
      x: bbox.max.x + margin,
      y: bbox.max.y + margin,
    },
  };
}

// ============================================================================
// Constraint Helpers
// ============================================================================

export function isHorizontal(line: SketchLine, tolerance = 0.01): boolean {
  const ang = angle(line.start, line.end);
  return Math.abs(ang) < tolerance || Math.abs(Math.abs(ang) - Math.PI) < tolerance;
}

export function isVertical(line: SketchLine, tolerance = 0.01): boolean {
  const ang = angle(line.start, line.end);
  return Math.abs(Math.abs(ang) - Math.PI / 2) < tolerance;
}

export function areParallel(line1: SketchLine, line2: SketchLine, tolerance = 0.01): boolean {
  const ang = angleBetweenLines(line1, line2);
  return Math.abs(ang) < tolerance || Math.abs(Math.abs(ang) - Math.PI) < tolerance;
}

export function arePerpendicular(line1: SketchLine, line2: SketchLine, tolerance = 0.01): boolean {
  const ang = angleBetweenLines(line1, line2);
  return Math.abs(Math.abs(ang) - Math.PI / 2) < tolerance;
}

// ============================================================================
// Grid Snapping
// ============================================================================

export function snapToGrid(point: Point2D, gridSize: number): Point2D {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

export function snapToAngle(startPoint: Point2D, endPoint: Point2D, snapAngles: number[]): Point2D {
  const currentAngle = angle(startPoint, endPoint);
  const dist = distance(startPoint, endPoint);
  
  // Find closest snap angle
  let closestAngle = currentAngle;
  let minDiff = Infinity;
  
  for (const snapAngle of snapAngles) {
    const diff = Math.abs(normalizeAngle(currentAngle - snapAngle));
    if (diff < minDiff) {
      minDiff = diff;
      closestAngle = snapAngle;
    }
  }
  
  // If within snap tolerance (5 degrees)
  if (minDiff < degToRad(5)) {
    return {
      x: startPoint.x + dist * Math.cos(closestAngle),
      y: startPoint.y + dist * Math.sin(closestAngle),
    };
  }
  
  return endPoint;
}

// ============================================================================
// Entity Hit Testing
// ============================================================================

export function hitTestEntity(entity: SketchEntity, point: Point2D, tolerance = 5): boolean {
  switch (entity.type) {
    case 'line':
      return distanceToLine(entity as SketchLine, point) < tolerance;
    
    case 'circle':
      return isPointOnCircle(entity as SketchCircle, point, tolerance);
    
    case 'arc': {
      const arc = entity as SketchArc;
      const dist = Math.abs(distance(arc.center, point) - arc.radius);
      if (dist > tolerance) return false;
      
      const ang = angle(arc.center, point);
      return isAngleInArc(arc, ang);
    }
    
    case 'point': {
      const p = (entity as any).position;
      return distance(point, p) < tolerance;
    }
    
    default:
      return false;
  }
}
