/**
 * Point Tool - Draw points in sketch
 */

import { useEffect } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';
import type { SketchPoint } from '../../../types/sketch';

export function PointTool() {
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
    if (toolState.cursorPosition) {
      const position = toolState.snappedPosition || toolState.cursorPosition;
      
      const previewPoint: Partial<SketchPoint> = {
        type: 'point',
        position,
        isConstruction: false,
        isSelected: false,
        isHighlighted: false,
      };
      
      setPreviewEntity(previewPoint as any);
    } else {
      setPreviewEntity(null);
    }
  }, [toolState.cursorPosition, toolState.snappedPosition, setPreviewEntity]);
  
  useEffect(() => {
    // Handle point placement on click
    if (toolState.isDrawing && toolState.cursorPosition) {
      const position = toolState.snappedPosition || toolState.cursorPosition;
      
      // Add point entity
      addEntity({
        type: 'point',
        position,
        isConstruction: false,
        isSelected: false,
        isHighlighted: false,
      } as any);
      
      // Auto-solve constraints after entity creation
      setTimeout(() => {
        solveConstraints();
      }, 100);
      
      // Reset drawing state
      useSketchStore.getState().setIsDrawing(false);
    }
  }, [toolState.isDrawing, toolState.cursorPosition, toolState.snappedPosition, addEntity, solveConstraints]);
  
  // Keyboard handlers
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearDrawingPoints();
        setPreviewEntity(null);
        setActiveTool('select');
      }
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [clearDrawingPoints, setPreviewEntity, setActiveTool]);
  
  return null; // Tool logic only, no UI
}
