import { useState } from 'react';
import { UnifiedViewport } from '../viewport/UnifiedViewport';
import { PlaneSelector } from '../viewport/PlaneSelector';
import { ExtrudeDialog } from '../model/ExtrudeDialog';
import { ModelToolbar } from './ModelToolbar';
import { useViewportStore } from '../../stores/viewportStore';
import { useFeatureStore } from '../../stores/featureStore';
import { useSketchStore } from '../../stores/sketchStore';
import type { SketchPlane, ExtrudeParameters } from '@flows/cad-kernel';

export function ModelWorkspace() {
  const { mode, enterSketchMode, exitSketchMode } = useViewportStore();
  const { addFeature } = useFeatureStore();
  const { createSketch, setActiveSketch } = useSketchStore();
  
  // Dialog states
  const [showPlaneSelector, setShowPlaneSelector] = useState(false);
  const [showExtrudeDialog, setShowExtrudeDialog] = useState(false);
  const [activeSketchId, setActiveSketchId] = useState<string | null>(null);
  
  // Handle sketch creation
  const handleSelectPlane = (plane: SketchPlane) => {
    // Create sketch in sketchStore
    const sketchId = createSketch(`Sketch on ${plane.name || 'Plane'}`);
    setActiveSketchId(sketchId);
    setActiveSketch(sketchId);
    
    // Enter sketch mode in viewport
    enterSketchMode(plane, sketchId);
    setShowPlaneSelector(false);
  };
  
  // Handle extrude feature creation
  const handleCreateExtrude = (parameters: ExtrudeParameters) => {
    if (!activeSketchId) return;
    
    const feature = {
      id: `extrude-${Date.now()}`,
      name: `Extrude ${Date.now()}`,
      type: 'extrude' as const,
      sketchId: activeSketchId,
      parameters,
      suppressed: false,
      failed: false,
      timestamp: Date.now(),
    };
    
    addFeature(feature);
    setShowExtrudeDialog(false);
    exitSketchMode();
  };
  
  // Handle exit sketch
  const handleExitSketch = () => {
    exitSketchMode();
    // Note: Keep sketch in store for feature creation later
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <ModelToolbar 
        isSketchMode={mode === 'sketch'}
        onNewSketch={() => setShowPlaneSelector(true)}
        onExitSketch={() => exitSketchMode()}
        onExtrude={() => setShowExtrudeDialog(true)}
        onToggleSketch={() => {
          if (mode === 'sketch') {
            exitSketchMode();
          } else {
            setShowPlaneSelector(true);
          }
        }}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Unified Viewport */}
        <UnifiedViewport />
      </div>
      
      {/* Dialogs */}
      <PlaneSelector
        isOpen={showPlaneSelector}
        onSelectPlane={handleSelectPlane}
        onCancel={() => setShowPlaneSelector(false)}
      />
      
      <ExtrudeDialog
        isOpen={showExtrudeDialog}
        sketchId={activeSketchId || ''}
        onConfirm={handleCreateExtrude}
        onCancel={() => setShowExtrudeDialog(false)}
      />
    </div>
  );
}
