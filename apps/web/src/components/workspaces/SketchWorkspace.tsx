/**
 * Sketch Workspace - Complete 2D parametric sketching environment
 */

import React, { useEffect } from 'react';
import { useSketchStore } from '../../stores/sketchStore';
import { useModelStore } from '../../stores/modelStore';
import { SketchCanvas } from '../sketch/SketchCanvas';
import { SketchToolbar } from '../sketch/SketchToolbar';
import { ConstraintToolbar } from '../sketch/ConstraintToolbar';
import { LineTool } from '../sketch/tools/LineTool';
import { CircleTool } from '../sketch/tools/CircleTool';
import { ArcTool } from '../sketch/tools/ArcTool';
import { RectangleTool } from '../sketch/tools/RectangleTool';
import { PointTool } from '../sketch/tools/PointTool';

export function SketchWorkspace() {
  const { createSketch, setActiveTool, toolState } = useSketchStore();
  const { addEntity, solveConstraints } = useModelStore();
  
  // Initialize sketch on mount
  useEffect(() => {
    const sketchId = createSketch('Sketch-1');
    setActiveTool('select');
  }, [createSketch, setActiveTool]);
  
  // Auto-solve constraints when entities change
  useEffect(() => {
    if (toolState.activeTool === 'select') {
      // Only auto-solve when not actively drawing
      const timeout = setTimeout(() => {
        solveConstraints();
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [toolState.activeTool, solveConstraints]);
  
  return (
    <div className="sketch-workspace flex h-full bg-gray-900">
      {/* Left Toolbar - Drawing Tools */}
      <SketchToolbar />
      
      {/* Left Toolbar - Constraints */}
      <ConstraintToolbar />
      
      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        <SketchCanvas 
          width={1200} 
          height={800} 
          className="absolute inset-0"
        />
        
        {/* Active Tool Components */}
        {toolState.activeTool === 'line' && <LineTool />}
        {toolState.activeTool === 'circle' && <CircleTool />}
        {toolState.activeTool === 'arc' && <ArcTool />}
        {toolState.activeTool === 'rectangle' && <RectangleTool />}
        {toolState.activeTool === 'point' && <PointTool />}
        
        {/* Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>Tool: {toolState.activeTool}</span>
            <span>Points: {toolState.currentPoints.length}</span>
            {toolState.snapTarget && (
              <span className="text-green-500">Snap: {toolState.snapTarget.type}</span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span>Entities: {useModelStore.getState().sketchState.entities.size}</span>
            <span>Constraints: {useModelStore.getState().sketchState.constraints.size}</span>
            <span>DOF: {calculateDOF()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateDOF(): number {
  const { sketchState } = useModelStore.getState();
  const entityCount = sketchState.entities.size;
  const constraintCount = sketchState.constraints.size;
  
  // Simplified DOF calculation: 2 DOF per point - constraints
  // This is a rough estimate, real calculation would be more complex
  return Math.max(0, entityCount * 2 - constraintCount);
}
