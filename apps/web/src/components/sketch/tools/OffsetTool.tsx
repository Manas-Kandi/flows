/**
 * Offset Tool - Create parallel copies of selected curves
 */

import { useEffect, useState } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';

export function OffsetTool() {
  const {
    selection,
    toolState,
    offsetEntities,
    clearDrawingPoints,
  } = useSketchStore();
  const [distance, setDistance] = useState(5);
  const [direction, setDirection] = useState<1 | -1>(1);
  
  useEffect(() => {
    if (toolState.currentPoints.length > 0) {
      clearDrawingPoints();
    }
  }, [toolState.currentPoints, clearDrawingPoints]);
  
  const applyOffset = () => {
    const ids = Array.from(selection.selectedIds);
    if (ids.length === 0) return;
    offsetEntities(ids, distance * direction);
  };
  
  return (
    <div className="absolute top-4 left-4 bg-gray-800/90 border border-gray-700 rounded px-4 py-3 text-xs text-gray-200 shadow-lg w-64">
      <div className="font-semibold text-sm mb-2">Offset Tool</div>
      <label className="flex items-center gap-2 mb-2">
        <span className="w-20">Distance</span>
        <input
          type="number"
          value={distance}
          step={0.5}
          className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100"
          onChange={(event) => setDistance(Number(event.target.value))}
        />
      </label>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-20">Direction</span>
        <div className="flex gap-1">
          <button
            className={`px-2 py-1 rounded border ${direction === 1 ? 'border-blue-500 text-blue-400' : 'border-gray-700 text-gray-400'}`}
            onClick={() => setDirection(1)}
          >
            Outward
          </button>
          <button
            className={`px-2 py-1 rounded border ${direction === -1 ? 'border-blue-500 text-blue-400' : 'border-gray-700 text-gray-400'}`}
            onClick={() => setDirection(-1)}
          >
            Inward
          </button>
        </div>
      </div>
      <button
        disabled={selection.selectedIds.size === 0}
        onClick={applyOffset}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:text-gray-400 rounded py-1 text-sm transition"
      >
        Apply Offset ({selection.selectedIds.size || 0} entities)
      </button>
    </div>
  );
}
