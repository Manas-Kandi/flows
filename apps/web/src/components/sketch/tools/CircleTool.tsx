/**
 * Circle Tool - Draw circles in sketch
 */

import { useEffect } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';
import { distance } from '../../../lib/sketch/geometry';
import type { SketchCircle } from '../../../types/sketch';

export function CircleTool() {
  const {
    toolState,
    setPreviewEntity,
    addEntity,
    clearDrawingPoints,
    solveConstraints,
  } = useSketchStore();
  
  useEffect(() => {
    // Update preview as cursor moves
    if (toolState.currentPoints.length === 1 && toolState.cursorPosition) {
      const center = toolState.currentPoints[0];
      const cursorPos = toolState.snappedPosition || toolState.cursorPosition;
      const radius = distance(center, cursorPos);
      
      const previewCircle: Partial<SketchCircle> = {
        type: 'circle',
        center,
        radius,
        isConstruction: false,
        isSelected: false,
        isHighlighted: false,
      };
      
      setPreviewEntity(previewCircle as any);
    } else {
      setPreviewEntity(null);
    }
  }, [toolState.currentPoints, toolState.cursorPosition, toolState.snappedPosition, setPreviewEntity]);
  
  useEffect(() => {
    // Handle point placement
    if (toolState.currentPoints.length === 2) {
      // Create circle
      const center = toolState.currentPoints[0];
      const edgePoint = toolState.currentPoints[1];
      const radius = distance(center, edgePoint);
      
      // Add circle entity
      addEntity({
        type: 'circle',
        center,
        radius,
        isConstruction: false,
        isSelected: false,
        isHighlighted: false,
      } as any);
      
      // Reset for next circle
      clearDrawingPoints();
      setPreviewEntity(null);
      
      // Auto-solve constraints after entity creation
      setTimeout(() => {
        solveConstraints();
      }, 100);
    }
  }, [toolState.currentPoints.length, toolState.currentPoints, addEntity, clearDrawingPoints, setPreviewEntity, solveConstraints]);
  
  return null;
}
