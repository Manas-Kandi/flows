/**
 * Slot Tool - Create straight slots defined by two points and width
 */

import { useEffect, useState } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';
import { distance } from '../../../lib/sketch/geometry';
import type { SketchSlot } from '../../../types/sketch';

export function SlotTool() {
  const {
    toolState,
    setPreviewEntity,
    addEntity,
    clearDrawingPoints,
    solveConstraints,
  } = useSketchStore();
  const [width, setWidth] = useState(10);
  
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === '=' || event.key === '+') {
        setWidth((prev) => Math.min(prev + 1, 250));
      }
      if (event.key === '-' || event.key === '_') {
        setWidth((prev) => Math.max(prev - 1, 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  
  useEffect(() => {
    const points = toolState.currentPoints;
    const cursor = toolState.snappedPosition || toolState.cursorPosition;
    
    if (points.length === 0 || !cursor) {
      setPreviewEntity(null);
      return;
    }
    
    const start = points[0];
    const end = points.length >= 2 ? points[1] : cursor;
    
    const preview: Partial<SketchSlot> = {
      type: 'slot',
      start,
      end,
      width,
      isConstruction: false,
      isSelected: false,
      isHighlighted: false,
    };
    
    setPreviewEntity(preview as SketchSlot);
  }, [
    toolState.currentPoints,
    toolState.cursorPosition,
    toolState.snappedPosition,
    width,
    setPreviewEntity,
  ]);
  
  useEffect(() => {
    if (toolState.currentPoints.length === 2) {
      const [start, end] = toolState.currentPoints;
      if (distance(start, end) < 1e-3) {
        clearDrawingPoints();
        setPreviewEntity(null);
        return;
      }
      
      addEntity({
        type: 'slot',
        start,
        end,
        width,
        isConstruction: false,
        isSelected: false,
        isHighlighted: false,
      } as SketchSlot);
      
      clearDrawingPoints();
      setPreviewEntity(null);
      setTimeout(() => solveConstraints(), 100);
    }
  }, [
    toolState.currentPoints,
    addEntity,
    clearDrawingPoints,
    width,
    solveConstraints,
    setPreviewEntity,
  ]);
  
  return (
    <div className="absolute top-20 right-4 bg-gray-800/90 border border-gray-700 rounded px-3 py-2 text-xs text-gray-200 shadow-lg max-w-xs">
      <div className="font-semibold text-sm mb-1">Slot Tool</div>
      <div>Width: {width.toFixed(1)} (use +/- to adjust)</div>
      <div>Step 1: Pick slot start</div>
      <div>Step 2: Pick slot end</div>
    </div>
  );
}
