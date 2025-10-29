import React, { useState } from 'react';
import { Viewport } from '@components/viewport/Viewport';
import { ModelToolbar } from './ModelToolbar';
import { SketchWorkspace } from './SketchWorkspace';
import { useWorkspaceStore } from '../../stores/workspaceStore';

export function ModelWorkspace() {
  const [isSketchMode, setIsSketchMode] = useState(false);
  const { currentMode } = useWorkspaceStore();
  
  // Auto-switch to sketch mode when in model workspace
  // In a real app, this would be controlled by UI state
  return (
    <div className="w-full h-full flex flex-col">
      <ModelToolbar 
        isSketchMode={isSketchMode}
        onToggleSketch={() => setIsSketchMode(!isSketchMode)}
      />
      <div className="flex-1">
        {isSketchMode ? (
          <SketchWorkspace />
        ) : (
          <Viewport />
        )}
      </div>
    </div>
  );
}
