/**
 * Line Tool - Draw lines and polylines in sketch
 */

import { useEffect } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';
import type { SketchLine } from '../../../types/sketch';

export function LineTool() {
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
    if (toolState.currentPoints.length > 0 && toolState.cursorPosition) {
      const start = toolState.currentPoints[toolState.currentPoints.length - 1];
      const end = toolState.snappedPosition || toolState.cursorPosition;
      
      const previewLine: Partial<SketchLine> = {
        type: 'line',
        start,
        end,
        isConstruction: false,
        isSelected: false,
        isHighlighted: false,
      };
      
      setPreviewEntity(previewLine as any);
    } else {
      setPreviewEntity(null);
    }
  }, [toolState.currentPoints, toolState.cursorPosition, toolState.snappedPosition, setPreviewEntity]);
  
  useEffect(() => {
    // Handle point placement
    if (toolState.currentPoints.length >= 2) {
      // Create line from last two points
      const points = toolState.currentPoints;
      const start = points[points.length - 2];
      const end = points[points.length - 1];
      
      // Add line entity
      addEntity({
        type: 'line',
        start,
        end,
        isConstruction: false,
        isSelected: false,
        isHighlighted: false,
      } as any);
      
      // Continue in polyline mode - keep last point as start of next line
      clearDrawingPoints();
      useSketchStore.getState().addDrawingPoint(end);
      
      // Auto-solve constraints after entity creation
      setTimeout(() => {
        solveConstraints();
      }, 100);
    }
  }, [toolState.currentPoints.length, toolState.currentPoints, addEntity, clearDrawingPoints, solveConstraints]);
  
  // Keyboard handlers
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        // Finish polyline
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
