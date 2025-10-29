/**
 * Mirror Tool - Reflect selected geometry across a line
 */

import { useEffect } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';

export function MirrorTool() {
  const {
    toolState,
    selection,
    mirrorEntities,
    clearDrawingPoints,
  } = useSketchStore();
  
  useEffect(() => {
    if (toolState.currentPoints.length < 2) return;
    
    const [start, end] = toolState.currentPoints.slice(-2);
    const ids = Array.from(selection.selectedIds);
    if (ids.length > 0) {
      mirrorEntities(ids, start, end);
    }
    
    clearDrawingPoints();
  }, [
    toolState.currentPoints,
    selection.selectedIds,
    mirrorEntities,
    clearDrawingPoints,
  ]);
  
  return (
    <div className="absolute bottom-4 right-4 bg-gray-800/90 border border-gray-700 rounded px-3 py-2 text-xs text-gray-200 shadow-lg">
      <div className="font-semibold text-sm mb-1">Mirror Tool</div>
      <div>Select entities, then click two points to define the mirror line.</div>
    </div>
  );
}
