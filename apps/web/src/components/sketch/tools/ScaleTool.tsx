/**
 * Scale Tool - Scale selected geometry from a base point
 */

import { useEffect, useState } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';
import type { Point2D } from '../../../types/sketch';

export function ScaleTool() {
  const {
    toolState,
    selection,
    scaleEntities,
    clearDrawingPoints,
  } = useSketchStore();
  const [origin, setOrigin] = useState<Point2D | null>(null);
  const [factor, setFactor] = useState(1.0);
  
  useEffect(() => {
    if (toolState.currentPoints.length === 0) return;
    const clicked = toolState.currentPoints[toolState.currentPoints.length - 1];
    setOrigin(clicked);
    clearDrawingPoints();
  }, [toolState.currentPoints, clearDrawingPoints]);
  
  const applyScale = () => {
    const ids = Array.from(selection.selectedIds);
    if (!origin || ids.length === 0) return;
    scaleEntities(ids, factor, origin);
  };
  
  return (
    <div className="absolute top-28 right-4 bg-gray-800/90 border border-gray-700 rounded px-4 py-3 text-xs text-gray-200 shadow-lg w-64">
      <div className="font-semibold text-sm mb-2">Scale Tool</div>
      <div className="mb-2 text-gray-400">
        {origin ? `Origin: (${origin.x.toFixed(1)}, ${origin.y.toFixed(1)})` : 'Click to set scale origin'}
      </div>
      <label className="flex items-center gap-2 mb-2">
        <span className="w-16">Factor</span>
        <input
          type="number"
          value={factor}
          step={0.1}
          className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100"
          onChange={(event) => setFactor(Number(event.target.value))}
        />
      </label>
      <button
        disabled={!origin || selection.selectedIds.size === 0}
        onClick={applyScale}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:text-gray-400 rounded py-1 text-sm transition"
      >
        Scale {selection.selectedIds.size || 0} entities
      </button>
    </div>
  );
}
