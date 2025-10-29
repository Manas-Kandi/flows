/**
 * Polygon Tool - Create regular N-sided polygons
 */

import { useEffect, useState } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';
import { distance, angle } from '../../../lib/sketch/geometry';
import type { SketchPolygon } from '../../../types/sketch';

export function PolygonTool() {
  const {
    toolState,
    setPreviewEntity,
    addEntity,
    clearDrawingPoints,
    solveConstraints,
  } = useSketchStore();
  const [sides, setSides] = useState(6);
  
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === '[') {
        setSides((prev) => Math.max(3, prev - 1));
      }
      if (event.key === ']') {
        setSides((prev) => Math.min(24, prev + 1));
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
    
    const center = points[0];
    const radius = Math.max(distance(center, cursor), 1);
    const rotation = angle(center, cursor);
    
    const preview: Partial<SketchPolygon> = {
      type: 'polygon',
      center,
      radius,
      sides,
      rotation,
      isConstruction: false,
      isSelected: false,
      isHighlighted: false,
    };
    
    setPreviewEntity(preview as SketchPolygon);
  }, [
    toolState.currentPoints,
    toolState.cursorPosition,
    toolState.snappedPosition,
    sides,
    setPreviewEntity,
  ]);
  
  useEffect(() => {
    if (toolState.currentPoints.length === 2) {
      const [center, edge] = toolState.currentPoints;
      const radius = Math.max(distance(center, edge), 1);
      const rotation = angle(center, edge);
      
      addEntity({
        type: 'polygon',
        center,
        radius,
        sides,
        rotation,
        isConstruction: false,
        isSelected: false,
        isHighlighted: false,
      } as SketchPolygon);
      
      clearDrawingPoints();
      setPreviewEntity(null);
      setTimeout(() => solveConstraints(), 100);
    }
  }, [
    toolState.currentPoints,
    addEntity,
    clearDrawingPoints,
    solveConstraints,
    setPreviewEntity,
    sides,
  ]);
  
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-800/90 border border-gray-700 rounded px-3 py-2 text-xs text-gray-200 shadow-lg">
      <div className="font-semibold text-sm mb-1">Polygon Tool</div>
      <div>Sides: {sides} (use [ or ] to adjust)</div>
      <div>Step 1: Pick center</div>
      <div>Step 2: Pick vertex</div>
    </div>
  );
}
