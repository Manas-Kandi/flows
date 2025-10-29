import { useState } from 'react';
import { UnifiedViewport } from '../viewport/UnifiedViewport';
import { FeatureTree } from '../model/FeatureTree';
import { PlaneSelector } from '../viewport/PlaneSelector';
import { ExtrudeDialog } from '../model/ExtrudeDialog';
import { ModelToolbar } from './ModelToolbar';
import { useViewportStore } from '../../stores/viewportStore';
import { useFeatureStore } from '../../stores/featureStore';
import type { SketchPlane, ExtrudeParameters } from '@flows/cad-kernel';

export function ModelWorkspace() {
  const { mode, enterSketchMode, exitSketchMode } = useViewportStore();
  const { addFeature } = useFeatureStore();
  
  // Dialog states
  const [showPlaneSelector, setShowPlaneSelector] = useState(false);
  const [showExtrudeDialog, setShowExtrudeDialog] = useState(false);
  const [activeSketchId, setActiveSketchId] = useState<string | null>(null);
  
  // Handle sketch creation
  const handleSelectPlane = (plane: SketchPlane) => {
    const sketchId = `sketch-${Date.now()}`;
    setActiveSketchId(sketchId);
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
      <div className="flex-1 flex overflow-hidden">
        {/* Unified Viewport */}
        <div className="flex-1 relative">
          <UnifiedViewport />
        </div>
        
        {/* Feature Tree Sidebar */}
        <div className="w-64 border-l border-gray-200">
          <FeatureTree />
        </div>
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
