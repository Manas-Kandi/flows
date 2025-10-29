/**
 * SketchCanvas - Main 2D sketching canvas with drawing tools
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSketchStore } from '../../stores/sketchStore';
import type { Point2D } from '../../types';
import { SnapDetector } from '../../lib/sketch/snapSystem';
import { snapToGrid, snapToAngle, degToRad } from '../../lib/sketch/geometry';

interface SketchCanvasProps {
  width: number;
  height: number;
  className?: string;
}

export function SketchCanvas({ width, height, className = '' }: SketchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snapDetector] = useState(() => new SnapDetector(
    useSketchStore.getState().snapSettings,
    useSketchStore.getState().getAllEntities()
  ));
  
  const {
    toolState,
    selection,
    gridSize,
    gridVisible,
    snapSettings,
    getAllEntities,
    setCursorPosition,
    setSnapTarget,
    setIsDrawing,
    addDrawingPoint,
  } = useSketchStore();
  
  // =========================================================================
  // Coordinate Transformation
  // =========================================================================
  
  const screenToSketch = useCallback((screenX: number, screenY: number): Point2D => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = screenX - rect.left - width / 2;
    const y = -(screenY - rect.top - height / 2); // Flip Y axis (canvas Y down, sketch Y up)
    
    return { x, y };
  }, [width, height]);
  
  const sketchToScreen = useCallback((point: Point2D): Point2D => {
    return {
      x: point.x + width / 2,
      y: -point.y + height / 2, // Flip Y axis
    };
  }, [width, height]);
  
  // =========================================================================
  // Mouse Event Handlers
  // =========================================================================
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const sketchPoint = screenToSketch(e.clientX, e.clientY);
    
    // Update snap detector with latest entities
    snapDetector.updateEntities(getAllEntities());
    snapDetector.updateSettings(snapSettings);
    
    // Find snap target
    let finalPoint = sketchPoint;
    const snapTarget = snapDetector.findSnapTarget(sketchPoint, gridSize);
    
    if (snapTarget) {
      finalPoint = snapTarget.position;
      setSnapTarget(snapTarget);
    } else {
      setSnapTarget(null);
      
      // Apply angle snapping if shift is held
      if (e.shiftKey && toolState.currentPoints.length > 0) {
        const startPoint = toolState.currentPoints[0];
        const snapAngles = [0, degToRad(45), degToRad(90), degToRad(135), degToRad(180)];
        finalPoint = snapToAngle(startPoint, sketchPoint, snapAngles);
      }
    }
    
    setCursorPosition(finalPoint);
  }, [screenToSketch, snapDetector, getAllEntities, snapSettings, gridSize, setSnapTarget, setCursorPosition, toolState.currentPoints]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only left click
    
    const point = toolState.snappedPosition || toolState.cursorPosition;
    
    setIsDrawing(true);
    addDrawingPoint(point);
  }, [toolState.snappedPosition, toolState.cursorPosition, setIsDrawing, addDrawingPoint]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    
    // Tool-specific logic will be handled in tool components
    setIsDrawing(false);
  }, [setIsDrawing]);
  
  // =========================================================================
  // Rendering
  // =========================================================================
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Save context
    ctx.save();
    
    // Transform to sketch coordinates (origin at center, Y up)
    ctx.translate(width / 2, height / 2);
    ctx.scale(1, -1);
    
    // Draw grid
    if (gridVisible) {
      drawGrid(ctx, width, height, gridSize);
    }
    
    // Draw axes
    drawAxes(ctx, width, height);
    
    // Draw entities
    const entities = getAllEntities();
    for (const entity of entities) {
      drawEntity(ctx, entity, selection.selectedIds.has(entity.id), entity.isHighlighted);
    }
    
    // Draw preview entity
    if (toolState.previewEntity) {
      drawPreviewEntity(ctx, toolState.previewEntity);
    }
    
    // Draw snap indicator
    if (toolState.snapTarget) {
      drawSnapIndicator(ctx, toolState.snapTarget.position, toolState.snapTarget.type);
    }
    
    // Draw cursor crosshair
    if (toolState.cursorPosition) {
      drawCursor(ctx, toolState.snappedPosition || toolState.cursorPosition);
    }
    
    // Restore context
    ctx.restore();
    
  }, [width, height, gridSize, gridVisible, getAllEntities, selection, toolState]);
  
  // =========================================================================
  // Keyboard Handlers
  // =========================================================================
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC - Cancel current operation
      if (e.key === 'Escape') {
        useSketchStore.getState().setActiveTool('select');
        useSketchStore.getState().clearDrawingPoints();
      }
      
      // Delete - Delete selected entities
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selection.selectedIds.forEach(id => {
          useSketchStore.getState().deleteEntity(id);
        });
      }
      
      // Ctrl/Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useSketchStore.getState().undo();
      }
      
      // Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y - Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        useSketchStore.getState().redo();
      }
      
      // G - Toggle grid
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        useSketchStore.getState().setGridVisible(!gridVisible);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection.selectedIds, gridVisible]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`sketch-canvas ${className}`}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{
        cursor: 'crosshair',
        border: '1px solid #333',
        backgroundColor: '#1a1a1a',
      }}
    />
  );
}

// =============================================================================
// Drawing Functions
// =============================================================================

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, gridSize: number) {
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 0.5;
  
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Vertical lines
  for (let x = 0; x <= halfWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, -halfHeight);
    ctx.lineTo(x, halfHeight);
    ctx.stroke();
    
    if (x !== 0) {
      ctx.beginPath();
      ctx.moveTo(-x, -halfHeight);
      ctx.lineTo(-x, halfHeight);
      ctx.stroke();
    }
  }
  
  // Horizontal lines
  for (let y = 0; y <= halfHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(-halfWidth, y);
    ctx.lineTo(halfWidth, y);
    ctx.stroke();
    
    if (y !== 0) {
      ctx.beginPath();
      ctx.moveTo(-halfWidth, -y);
      ctx.lineTo(halfWidth, -y);
      ctx.stroke();
    }
  }
}

function drawAxes(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  
  // X axis
  ctx.beginPath();
  ctx.moveTo(-halfWidth, 0);
  ctx.lineTo(halfWidth, 0);
  ctx.stroke();
  
  // Y axis
  ctx.beginPath();
  ctx.moveTo(0, -halfHeight);
  ctx.lineTo(0, halfHeight);
  ctx.stroke();
}

function drawEntity(ctx: CanvasRenderingContext2D, entity: any, isSelected: boolean, isHighlighted: boolean) {
  const baseColor = entity.isConstruction ? '#666' : '#fff';
  const color = isSelected ? '#00aaff' : isHighlighted ? '#ffaa00' : baseColor;
  const lineWidth = isSelected ? 2 : isHighlighted ? 1.5 : 1;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  
  switch (entity.type) {
    case 'line': {
      ctx.beginPath();
      ctx.moveTo(entity.start.x, entity.start.y);
      ctx.lineTo(entity.end.x, entity.end.y);
      ctx.stroke();
      break;
    }
    
    case 'circle': {
      ctx.beginPath();
      ctx.arc(entity.center.x, entity.center.y, entity.radius, 0, 2 * Math.PI);
      ctx.stroke();
      break;
    }
    
    case 'arc': {
      ctx.beginPath();
      ctx.arc(entity.center.x, entity.center.y, entity.radius, entity.startAngle, entity.endAngle);
      ctx.stroke();
      break;
    }
    
    case 'point': {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(entity.position.x, entity.position.y, 2, 0, 2 * Math.PI);
      ctx.fill();
      break;
    }
  }
}

function drawPreviewEntity(ctx: CanvasRenderingContext2D, entity: any) {
  ctx.strokeStyle = '#00aaff';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  
  drawEntity(ctx, entity, false, false);
  
  ctx.setLineDash([]);
}

function drawSnapIndicator(ctx: CanvasRenderingContext2D, position: Point2D, type: string) {
  ctx.save();
  ctx.strokeStyle = '#00ff00';
  ctx.fillStyle = '#00ff00';
  ctx.lineWidth = 1.5;
  
  const size = 8;
  
  switch (type) {
    case 'endpoint':
      // Square
      ctx.strokeRect(position.x - size/2, position.y - size/2, size, size);
      break;
    
    case 'midpoint':
      // Triangle
      ctx.beginPath();
      ctx.moveTo(position.x, position.y - size);
      ctx.lineTo(position.x - size, position.y + size/2);
      ctx.lineTo(position.x + size, position.y + size/2);
      ctx.closePath();
      ctx.stroke();
      break;
    
    case 'center':
      // Circle
      ctx.beginPath();
      ctx.arc(position.x, position.y, size/2, 0, 2 * Math.PI);
      ctx.stroke();
      break;
    
    case 'intersection':
      // X
      ctx.beginPath();
      ctx.moveTo(position.x - size/2, position.y - size/2);
      ctx.lineTo(position.x + size/2, position.y + size/2);
      ctx.moveTo(position.x + size/2, position.y - size/2);
      ctx.lineTo(position.x - size/2, position.y + size/2);
      ctx.stroke();
      break;
    
    default:
      // Small circle for grid and others
      ctx.beginPath();
      ctx.arc(position.x, position.y, 3, 0, 2 * Math.PI);
      ctx.fill();
  }
  
  ctx.restore();
}

function drawCursor(ctx: CanvasRenderingContext2D, position: Point2D) {
  ctx.save();
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 0.5;
  
  const size = 10;
  
  // Crosshair
  ctx.beginPath();
  ctx.moveTo(position.x - size, position.y);
  ctx.lineTo(position.x + size, position.y);
  ctx.moveTo(position.x, position.y - size);
  ctx.lineTo(position.x, position.y + size);
  ctx.stroke();
  
  ctx.restore();
}
