/**
 * Sketch Mode Overlay
 * Overlays 2D sketch canvas on top of 3D viewport when in sketch mode
 */

import { useEffect } from 'react';
import { SketchCanvas } from '../sketch/SketchCanvas';
import { SketchToolbar } from '../sketch/SketchToolbar';
import { useViewportStore } from '../../stores/viewportStore';
import { useSketchStore } from '../../stores/sketchStore';

export function SketchModeOverlay() {
  const { mode, activePlane, exitSketchMode } = useViewportStore();
  const { setActiveTool } = useSketchStore();
  
  // Reset tool when exiting sketch mode
  useEffect(() => {
    if (mode !== 'sketch') {
      setActiveTool('select');
    }
  }, [mode, setActiveTool]);
  
  if (mode !== 'sketch' || !activePlane) {
    return null;
  }
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Sketch Canvas - 2D drawing surface */}
      <div className="absolute inset-0 pointer-events-auto">
        <SketchCanvas 
          width={window.innerWidth} 
          height={window.innerHeight}
          className="w-full h-full"
        />
      </div>
      
      {/* Sketch Toolbar - Drawing tools */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg p-2">
          <SketchToolbar />
        </div>
      </div>
      
      {/* Exit Sketch Button */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <button
          onClick={exitSketchMode}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Finish Sketch
        </button>
      </div>
      
      {/* Sketch Mode Indicator */}
      <div className="absolute bottom-20 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-sm font-medium">Sketch Mode Active</span>
        </div>
        <div className="text-xs mt-1 opacity-90">
          Plane: {activePlane.name || 'Custom'}
        </div>
      </div>
    </div>
  );
}
