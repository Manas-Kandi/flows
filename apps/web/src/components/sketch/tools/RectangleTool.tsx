/**
 * Rectangle Tool - Draw rectangles in sketch (2-point mode)
 */

import { useEffect } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';
import type { SketchRectangle } from '../../../types/sketch';

export function RectangleTool() {
  const {
    toolState,
    setPreviewEntity,
    addEntity,
    clearDrawingPoints,
    setActiveTool,
    solveConstraints,
  } = useSketchStore();
  
  useEffect(() => {
    // Update preview as cursor moves
    if (toolState.currentPoints.length === 1 && toolState.cursorPosition) {
      const corner1 = toolState.currentPoints[0];
      const corner2 = toolState.snappedPosition || toolState.cursorPosition;
      
      const previewRect: Partial<SketchRectangle> = {
        type: 'rectangle',
        topLeft: {
          x: Math.min(corner1.x, corner2.x),
          y: Math.max(corner1.y, corner2.y),
        },
        bottomRight: {
          x: Math.max(corner1.x, corner2.x),
          y: Math.min(corner1.y, corner2.y),
        },
        isConstruction: false,
        isSelected: false,
        isHighlighted: false,
      };
      
      setPreviewEntity(previewRect as any);
    } else {
      setPreviewEntity(null);
    }
  }, [toolState.currentPoints, toolState.cursorPosition, toolState.snappedPosition, setPreviewEntity]);
  
  useEffect(() => {
    // Handle point placement
    if (toolState.currentPoints.length === 2) {
      // Create rectangle from two corners
      const corner1 = toolState.currentPoints[0];
      const corner2 = toolState.currentPoints[1];
      
      // Add rectangle entity
      addEntity({
        type: 'rectangle',
        topLeft: {
          x: Math.min(corner1.x, corner2.x),
          y: Math.min(corner1.y, corner2.y),
        },
        bottomRight: {
          x: Math.max(corner1.x, corner2.x),
          y: Math.max(corner1.y, corner2.y),
        },
        isConstruction: false,
        isSelected: false,
        isHighlighted: false,
      } as any);
      
      // Reset for next rectangle
      clearDrawingPoints();
      setPreviewEntity(null);
      
      // Auto-solve constraints after entity creation
      setTimeout(() => {
        solveConstraints();
      }, 100);
    }
  }, [toolState.currentPoints.length, toolState.currentPoints, addEntity, clearDrawingPoints, setPreviewEntity, solveConstraints]);
  
  // Keyboard handlers
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        // Cancel current rectangle
        clearDrawingPoints();
        setPreviewEntity(null);
        if (e.key === 'Escape') {
          setActiveTool('select');
        }
      }
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [clearDrawingPoints, setPreviewEntity, setActiveTool]);
  
  return null; // Tool logic only, no UI
}
