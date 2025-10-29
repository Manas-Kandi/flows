/**
 * Trim Tool - Split or shorten sketch entities at a picked point
 */

import { useEffect } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';
import { hitTestEntity } from '../../../lib/sketch/geometry';

export function TrimTool() {
  const {
    toolState,
    selection,
    trimEntity,
    clearDrawingPoints,
    getAllEntities,
  } = useSketchStore();
  
  useEffect(() => {
    if (toolState.currentPoints.length === 0) return;
    
    const clickPoint = toolState.currentPoints[toolState.currentPoints.length - 1];
    const selectedIds = Array.from(selection.selectedIds);
    const targets = selectedIds.length > 0 ? selectedIds : findEntityIdsAtPoint(clickPoint);
    
    targets.forEach((id) => trimEntity(id, clickPoint));
    clearDrawingPoints();
  }, [
    toolState.currentPoints,
    selection.selectedIds,
    trimEntity,
    clearDrawingPoints,
  ]);
  
  const findEntityIdsAtPoint = (point: { x: number; y: number }): string[] => {
    const entities = getAllEntities();
    const matches = entities.filter((entity) => hitTestEntity(entity, point, 6));
    return matches.map((entity) => entity.id);
  };
  
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800/90 border border-gray-700 rounded px-3 py-2 text-xs text-gray-200 shadow-lg">
      <div className="font-semibold text-sm mb-1">Trim Tool</div>
      <div>Select an entity or click directly on geometry to trim.</div>
    </div>
  );
}
