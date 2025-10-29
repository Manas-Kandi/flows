/**
 * Extend Tool - Extend linear geometry to meet a target location
 */

import { useEffect } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';
import { hitTestEntity } from '../../../lib/sketch/geometry';

export function ExtendTool() {
  const {
    toolState,
    selection,
    extendEntity,
    clearDrawingPoints,
    getAllEntities,
  } = useSketchStore();
  
  useEffect(() => {
    if (toolState.currentPoints.length === 0) return;
    
    const targetPoint = toolState.currentPoints[toolState.currentPoints.length - 1];
    const selectedIds = Array.from(selection.selectedIds);
    const targets = selectedIds.length > 0 ? selectedIds : findEntityIdsAtPoint(targetPoint);
    
    targets.forEach((id) => extendEntity(id, targetPoint));
    clearDrawingPoints();
  }, [
    toolState.currentPoints,
    selection.selectedIds,
    extendEntity,
    clearDrawingPoints,
  ]);
  
  const findEntityIdsAtPoint = (point: { x: number; y: number }): string[] => {
    const entities = getAllEntities().filter((entity) => entity.type === 'line');
    const matches = entities.filter((entity) => hitTestEntity(entity, point, 6));
    return matches.map((entity) => entity.id);
  };
  
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-800/90 border border-gray-700 rounded px-3 py-2 text-xs text-gray-200 shadow-lg">
      <div className="font-semibold text-sm mb-1">Extend Tool</div>
      <div>Click near a line end to extend it towards the cursor.</div>
    </div>
  );
}
