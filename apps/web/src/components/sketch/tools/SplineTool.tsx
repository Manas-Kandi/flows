/**
 * Spline Tool - Multi-point spline creation with live preview
 */

import { useEffect, useState } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';
import type { SketchSpline, Point2D } from '../../../types/sketch';

export function SplineTool() {
  const {
    toolState,
    setPreviewEntity,
    addEntity,
    clearDrawingPoints,
    solveConstraints,
  } = useSketchStore();
  const [isClosed, setIsClosed] = useState(false);
  const [degree, setDegree] = useState(3);
  
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && toolState.currentPoints.length >= 2) {
        commitSpline(toolState.currentPoints);
      }
      
      if (event.key === 'Escape') {
        clearDrawingPoints();
        setPreviewEntity(null);
      }
      
      if (event.key.toLowerCase() === 'c' && event.shiftKey) {
        setIsClosed((prev) => !prev);
      }
      
      if (event.key === '[') {
        setDegree((prev) => Math.max(2, prev - 1));
      }
      
      if (event.key === ']') {
        setDegree((prev) => Math.min(5, prev + 1));
      }
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toolState.currentPoints, clearDrawingPoints, setPreviewEntity]);
  
  useEffect(() => {
    const points = toolState.currentPoints;
    if (points.length < 2) {
      setPreviewEntity(null);
      return;
    }
    
    const controlPoints: Point2D[] = [...points];
    if (toolState.cursorPosition) {
      controlPoints.push(toolState.snappedPosition || toolState.cursorPosition);
    }
    
    const preview: Partial<SketchSpline> = {
      type: 'spline',
      controlPoints,
      degree,
      isClosed,
      isConstruction: false,
      isSelected: false,
      isHighlighted: false,
    };
    
    setPreviewEntity(preview as SketchSpline);
  }, [
    toolState.currentPoints,
    toolState.cursorPosition,
    toolState.snappedPosition,
    setPreviewEntity,
    isClosed,
    degree,
  ]);
  
  const commitSpline = (points: Point2D[]) => {
    if (points.length < 2) return;
    
    const clonedPoints = points.map((point) => ({ ...point }));
    
    addEntity({
      type: 'spline',
      controlPoints: clonedPoints,
      degree,
      isClosed,
      isConstruction: false,
      isSelected: false,
      isHighlighted: false,
    } as SketchSpline);
    
    clearDrawingPoints();
    setPreviewEntity(null);
    setTimeout(() => solveConstraints(), 100);
  };
  
  return (
    <div className="absolute top-4 right-4 bg-gray-800/90 border border-gray-700 rounded px-3 py-2 text-xs text-gray-200 shadow-lg max-w-xs">
      <div className="font-semibold text-sm mb-1">Spline Tool</div>
      <div>Click to add control points, Enter to finish.</div>
      <div>Degree: {degree} (adjust with [ and ])</div>
      <div>Closed: {isClosed ? 'Yes' : 'No'} (Shift+C to toggle)</div>
    </div>
  );
}
