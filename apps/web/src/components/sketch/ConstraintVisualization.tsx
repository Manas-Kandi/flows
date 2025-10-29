/**
 * Constraint Visualization - Render constraints on canvas
 */

import type { SketchEntity } from '../../types/sketch';
import type { Constraint } from '../../types';
import type { Point2D } from '../../types';

interface ConstraintVisualizationProps {
  constraints: Constraint[];
  entities: Map<string, SketchEntity>;
}

export function drawConstraints(
  ctx: CanvasRenderingContext2D,
  constraints: Constraint[],
  entities: Map<string, SketchEntity>
) {
  ctx.save();
  
  for (const constraint of constraints) {
    drawConstraint(ctx, constraint, entities);
  }
  
  ctx.restore();
}

function drawConstraint(
  ctx: CanvasRenderingContext2D,
  constraint: Constraint,
  entities: Map<string, SketchEntity>
) {
  ctx.strokeStyle = '#00ff88';
  ctx.fillStyle = '#00ff88';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  
  switch (constraint.type as any) {
    case 'coincident':
      drawCoincidentConstraint(ctx, constraint, entities);
      break;
    case 'horizontal':
      drawHorizontalConstraint(ctx, constraint, entities);
      break;
    case 'vertical':
      drawVerticalConstraint(ctx, constraint, entities);
      break;
    case 'parallel':
      drawParallelConstraint(ctx, constraint, entities);
      break;
    case 'perpendicular':
      drawPerpendicularConstraint(ctx, constraint, entities);
      break;
    case 'distance':
      drawDistanceConstraint(ctx, constraint, entities);
      break;
    case 'radius':
      drawRadiusConstraint(ctx, constraint, entities);
      break;
    case 'angle':
      drawAngleConstraint(ctx, constraint, entities);
      break;
    case 'fix':
      drawFixConstraint(ctx, constraint, entities);
      break;
  }
  
  ctx.setLineDash([]);
}

function drawCoincidentConstraint(
  ctx: CanvasRenderingContext2D,
  constraint: Constraint,
  entities: Map<string, SketchEntity>
) {
  const [entity1Id, entity2Id] = constraint.entities;
  const entity1 = entities.get(entity1Id);
  const entity2 = entities.get(entity2Id);
  
  if (!entity1 || !entity2) return;
  
  // Get points from entities
  const point1 = getEntityPoint(entity1);
  const point2 = getEntityPoint(entity2);
  
  if (point1 && point2) {
    // Draw a small square at the coincident point
    const size = 6;
    ctx.strokeRect(point1.x - size/2, point1.y - size/2, size, size);
  }
}

function drawHorizontalConstraint(
  ctx: CanvasRenderingContext2D,
  constraint: Constraint,
  entities: Map<string, SketchEntity>
) {
  const entityId = constraint.entities[0];
  const entity = entities.get(entityId);
  
  if (!entity || entity.type !== 'line') return;
  
  // Draw horizontal symbol
  const midPoint = {
    x: (entity.start.x + entity.end.x) / 2,
    y: (entity.start.y + entity.end.y) / 2,
  };
  
  ctx.beginPath();
  ctx.moveTo(midPoint.x - 10, midPoint.y);
  ctx.lineTo(midPoint.x + 10, midPoint.y);
  ctx.stroke();
}

function drawVerticalConstraint(
  ctx: CanvasRenderingContext2D,
  constraint: Constraint,
  entities: Map<string, SketchEntity>
) {
  const entityId = constraint.entities[0];
  const entity = entities.get(entityId);
  
  if (!entity || entity.type !== 'line') return;
  
  // Draw vertical symbol
  const midPoint = {
    x: (entity.start.x + entity.end.x) / 2,
    y: (entity.start.y + entity.end.y) / 2,
  };
  
  ctx.beginPath();
  ctx.moveTo(midPoint.x, midPoint.y - 10);
  ctx.lineTo(midPoint.x, midPoint.y + 10);
  ctx.stroke();
}

function drawParallelConstraint(
  ctx: CanvasRenderingContext2D,
  constraint: Constraint,
  entities: Map<string, SketchEntity>
) {
  const [entity1Id, entity2Id] = constraint.entities;
  const entity1 = entities.get(entity1Id);
  const entity2 = entities.get(entity2Id);
  
  if (!entity1 || !entity2 || entity1.type !== 'line' || entity2.type !== 'line') return;
  
  // Draw parallel symbols on both lines
  drawParallelSymbol(ctx, entity1);
  drawParallelSymbol(ctx, entity2);
}

function drawParallelSymbol(ctx: CanvasRenderingContext2D, line: any) {
  const midPoint = {
    x: (line.start.x + line.end.x) / 2,
    y: (line.start.y + line.end.y) / 2,
  };
  
  // Calculate perpendicular direction
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / len * 8;
  const perpY = dx / len * 8;
  
  ctx.beginPath();
  ctx.moveTo(midPoint.x + perpX, midPoint.y + perpY);
  ctx.lineTo(midPoint.x - perpX, midPoint.y - perpY);
  ctx.stroke();
}

function drawPerpendicularConstraint(
  ctx: CanvasRenderingContext2D,
  constraint: Constraint,
  entities: Map<string, SketchEntity>
) {
  const [entity1Id, entity2Id] = constraint.entities;
  const entity1 = entities.get(entity1Id);
  const entity2 = entities.get(entity2Id);
  
  if (!entity1 || !entity2 || entity1.type !== 'line' || entity2.type !== 'line') return;
  
  // Draw perpendicular symbol at intersection
  const intersection = findLineIntersection(entity1, entity2);
  if (intersection) {
    const size = 8;
    ctx.beginPath();
    ctx.moveTo(intersection.x - size/2, intersection.y - size/2);
    ctx.lineTo(intersection.x + size/2, intersection.y + size/2);
    ctx.moveTo(intersection.x + size/2, intersection.y - size/2);
    ctx.lineTo(intersection.x - size/2, intersection.y + size/2);
    ctx.stroke();
  }
}

function drawDistanceConstraint(
  ctx: CanvasRenderingContext2D,
  constraint: Constraint,
  entities: Map<string, SketchEntity>
) {
  const [entity1Id, entity2Id] = constraint.entities;
  const entity1 = entities.get(entity1Id);
  const entity2 = entities.get(entity2Id);
  
  if (!entity1 || !entity2) return;
  
  const point1 = getEntityPoint(entity1);
  const point2 = getEntityPoint(entity2);
  
  if (point1 && point2) {
    // Draw dimension line
    ctx.beginPath();
    ctx.moveTo(point1.x, point1.y);
    ctx.lineTo(point2.x, point2.y);
    ctx.stroke();
    
    // Draw dimension text
    const distance = Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
    
    const midPoint = {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2,
    };
    
    ctx.font = '10px sans-serif';
    ctx.fillText(distance.toFixed(1), midPoint.x + 5, midPoint.y - 5);
  }
}

function drawRadiusConstraint(
  ctx: CanvasRenderingContext2D,
  constraint: Constraint,
  entities: Map<string, SketchEntity>
) {
  const entityId = constraint.entities[0];
  const entity = entities.get(entityId);
  
  if (!entity || (entity.type !== 'circle' && entity.type !== 'arc')) return;
  
  // Draw radius line from center to edge
  const angle = 0; // Horizontal radius
  const endPoint = {
    x: entity.center.x + entity.radius * Math.cos(angle),
    y: entity.center.y + entity.radius * Math.sin(angle),
  };
  
  ctx.beginPath();
  ctx.moveTo(entity.center.x, entity.center.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.stroke();
  
  // Draw radius text
  ctx.font = '10px sans-serif';
  ctx.fillText(`R${entity.radius.toFixed(1)}`, endPoint.x + 5, endPoint.y);
}

function drawAngleConstraint(
  ctx: CanvasRenderingContext2D,
  constraint: Constraint,
  entities: Map<string, SketchEntity>
) {
  const [entity1Id, entity2Id] = constraint.entities;
  const entity1 = entities.get(entity1Id);
  const entity2 = entities.get(entity2Id);
  
  if (!entity1 || !entity2 || entity1.type !== 'line' || entity2.type !== 'line') return;
  
  // Find intersection point
  const intersection = findLineIntersection(entity1, entity2);
  if (intersection) {
    // Draw angle arc
    const angle1 = Math.atan2(entity1.end.y - entity1.start.y, entity1.end.x - entity1.start.x);
    const angle2 = Math.atan2(entity2.end.y - entity2.start.y, entity2.end.x - entity2.start.x);
    
    ctx.beginPath();
    ctx.arc(intersection.x, intersection.y, 20, angle1, angle2);
    ctx.stroke();
  }
}

function drawFixConstraint(
  ctx: CanvasRenderingContext2D,
  constraint: Constraint,
  entities: Map<string, SketchEntity>
) {
  const entityId = constraint.entities[0];
  const entity = entities.get(entityId);
  
  if (!entity) return;
  
  const point = getEntityCenter(entity);
  if (point) {
    // Draw pin/lock symbol
    const size = 8;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size/2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
  }
}

// Helper functions
function getEntityPoint(entity: SketchEntity): Point2D | null {
  switch (entity.type) {
    case 'point':
      return entity.position;
    case 'line':
      return entity.start; // Return start point
    case 'circle':
    case 'arc':
      return entity.center;
    default:
      return null;
  }
}

function getEntityCenter(entity: SketchEntity): Point2D | null {
  switch (entity.type) {
    case 'point':
      return entity.position;
    case 'line':
      return {
        x: (entity.start.x + entity.end.x) / 2,
        y: (entity.start.y + entity.end.y) / 2,
      };
    case 'circle':
    case 'arc':
      return entity.center;
    case 'rectangle':
      return {
        x: (entity.topLeft.x + entity.bottomRight.x) / 2,
        y: (entity.topLeft.y + entity.bottomRight.y) / 2,
      };
    default:
      return null;
  }
}

function findLineIntersection(line1: any, line2: any): Point2D | null {
  const x1 = line1.start.x, y1 = line1.start.y;
  const x2 = line1.end.x, y2 = line1.end.y;
  const x3 = line2.start.x, y3 = line2.start.y;
  const x4 = line2.end.x, y4 = line2.end.y;
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null;
  
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
