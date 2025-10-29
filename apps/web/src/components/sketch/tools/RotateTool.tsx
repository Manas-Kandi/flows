/**
 * Rotate Tool - Rotate selected entities around a picked point
 */

import { useEffect, useState } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';
import { degToRad } from '../../../lib/sketch/geometry';
import type { Point2D } from '../../../types/sketch';

export function RotateTool() {
  const {
    toolState,
    selection,
    rotateEntities,
    clearDrawingPoints,
  } = useSketchStore();
  const [origin, setOrigin] = useState<Point2D | null>(null);
  const [angleDeg, setAngleDeg] = useState(90);
  
  useEffect(() => {
    if (toolState.currentPoints.length === 0) return;
    const picked = toolState.currentPoints[toolState.currentPoints.length - 1];
    setOrigin(picked);
    clearDrawingPoints();
  }, [toolState.currentPoints, clearDrawingPoints]);
  
  const applyRotation = () => {
    const ids = Array.from(selection.selectedIds);
    if (!origin || ids.length === 0) return;
    rotateEntities(ids, degToRad(angleDeg), origin);
  };
  
  return (
    <div className="absolute top-4 right-4 bg-gray-800/90 border border-gray-700 rounded px-4 py-3 text-xs text-gray-200 shadow-lg w-64">
      <div className="font-semibold text-sm mb-2">Rotate Tool</div>
      <div className="mb-2 text-gray-400">
        {origin ? `Origin: (${origin.x.toFixed(1)}, ${origin.y.toFixed(1)})` : 'Click to set rotation origin'}
      </div>
      <label className="flex items-center gap-2 mb-2">
        <span className="w-16">Angle</span>
        <input
          type="number"
          value={angleDeg}
          step={5}
          className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100"
          onChange={(event) => setAngleDeg(Number(event.target.value))}
        />
        <span>deg</span>
      </label>
      <button
        disabled={!origin || selection.selectedIds.size === 0}
        onClick={applyRotation}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:text-gray-400 rounded py-1 text-sm transition"
      >
        Rotate {selection.selectedIds.size || 0} entities
      </button>
    </div>
  );
}
