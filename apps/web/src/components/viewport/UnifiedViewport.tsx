/**
 * Unified Viewport
 * Single viewport for both 2D sketches and 3D models
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useViewportStore } from '../../stores/viewportStore';
import { useSketchStore } from '../../stores/sketchStore';
import { CADLighting, SketchLighting } from '../../rendering/LightingSetup';
import { AdaptiveCamera } from './AdaptiveCamera';
import { SketchRenderer } from './SketchRenderer';
import { ModelRenderer } from './ModelRenderer';
import { PlaneRenderer } from './PlaneRenderer';
import { Sketch3DInteraction } from './Sketch3DInteraction';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Minus, Circle, Square, Spline, Circle as CircleDot } from 'lucide-react';

export enum RenderLayer {
  GRID = 0,
  SKETCH = 1,
  PLANES = 2,
  MODEL = 3,
  EDGES = 4,
  HIDDEN_EDGES = 5,
  DIMENSIONS = 6,
  SELECTION = 7,
  HANDLES = 8,
  UI = 9,
}

export function UnifiedViewport() {
  const {
    mode,
    activeSketch,
    activePlane,
    showGrid,
    showAxes,
    showPlanes,
    renderStyle,
  } = useViewportStore();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    // Set up renderer properties
    if (canvasRef.current) {
      const gl = canvasRef.current.getContext('webgl2');
      if (gl) {
        // Enable better edge rendering
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      }
    }
  }, []);
  
  return (
    <div className="relative w-full h-full">
      <Canvas
        ref={canvasRef}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
        }}
        scene={{
          background: new THREE.Color(0xf5f5f5),
        }}
      >
        {/* Adaptive Camera based on mode */}
        <AdaptiveCamera />
        
        {/* Lighting */}
        {mode === 'sketch' ? <SketchLighting /> : <CADLighting />}
        
        {/* Grid */}
        {showGrid && (
          <Grid
            args={[200, 200]}
            cellSize={10}
            cellThickness={0.5}
            cellColor="#bbbbbb"
            sectionSize={100}
            sectionThickness={1}
            sectionColor="#999999"
            fadeDistance={2000}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={false}
            position={[0, 0, 0]}
          />
        )}
        
        {/* Axes Helper */}
        {showAxes && <axesHelper args={[100]} />}
        
        {/* Sketch Planes (when in sketch mode or showing planes) */}
        {(showPlanes || mode === 'sketch') && <PlaneRenderer />}
        
        {/* Active Sketch Renderer */}
        {mode === 'sketch' && activeSketch && activePlane && (
          <>
            {/* Render sketch entities in 3D */}
            <SketchRenderer
              sketchId={activeSketch}
              plane={activePlane}
              layer={RenderLayer.SKETCH}
            />
            
            {/* Handle drawing interactions */}
            <Sketch3DInteraction
              plane={activePlane}
              enabled={true}
            />
          </>
        )}
        
        {/* 3D Model Renderer */}
        {mode !== 'sketch' && (
          <ModelRenderer
            layer={RenderLayer.MODEL}
            renderStyle={renderStyle}
          />
        )}
        
        {/* Orbit Controls */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={5000}
          enabled={true}
          enablePan={true}
          enableZoom={true}
          enableRotate={mode !== 'sketch'} // Disable rotation in sketch mode
        />
      </Canvas>
      
      {/* Viewport Overlay UI */}
      <ViewportOverlay />
    </div>
  );
}

/**
 * Compact sketch tools - icon-only buttons
 */
function CompactSketchTools() {
  const { toolState, setActiveTool } = useSketchStore();
  const activeTool = toolState.activeTool;
  
  const tools = [
    { name: 'select', icon: CircleDot, label: 'S' },
    { name: 'line', icon: Minus, label: 'L' },
    { name: 'circle', icon: Circle, label: 'C' },
    { name: 'rectangle', icon: Square, label: 'R' },
    { name: 'arc', icon: Spline, label: 'A' },
  ];
  
  return (
    <>
      {tools.map((tool) => (
        <button
          key={tool.name}
          onClick={() => setActiveTool(tool.name as any)}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            activeTool === tool.name
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={tool.name}
        >
          <tool.icon size={16} />
        </button>
      ))}
    </>
  );
}

/**
 * Viewport overlay for controls and info
 */
function ViewportOverlay() {
  const { mode, viewPreset, renderStyle, setViewPreset, setRenderStyle, exitSketchMode } = useViewportStore();
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Compact Sketch Toolbar - Only in sketch mode */}
      {mode === 'sketch' && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg p-1 flex flex-col gap-0.5">
            <CompactSketchTools />
          </div>
        </div>
      )}
      
      {/* Finish Sketch Button - Only in sketch mode */}
      {mode === 'sketch' && (
        <div className="absolute top-4 left-4 pointer-events-auto">
          <button
            onClick={exitSketchMode}
            className="px-3 py-1.5 bg-blue-600 text-white rounded shadow-lg hover:bg-blue-700 transition-colors font-medium text-xs"
          >
            Finish
          </button>
        </div>
      )}
      
      {/* Top Right - View Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-white/90 backdrop-blur rounded-lg shadow-lg p-2">
          <div className="text-xs font-medium text-gray-700 mb-2">View</div>
          <div className="grid grid-cols-3 gap-1">
            {['front', 'top', 'right', 'iso'].map((view) => (
              <button
                key={view}
                onClick={() => setViewPreset(view as any)}
                className={`px-2 py-1 text-xs rounded ${
                  viewPreset === view
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Render Style */}
        {mode !== 'sketch' && (
          <div className="bg-white/90 backdrop-blur rounded-lg shadow-lg p-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Style</div>
            <select
              value={renderStyle}
              onChange={(e) => setRenderStyle(e.target.value as any)}
              className="text-xs px-2 py-1 rounded border border-gray-300 bg-white"
            >
              <option value="shaded">Shaded</option>
              <option value="shaded-edges">Shaded + Edges</option>
              <option value="wireframe">Wireframe</option>
              <option value="hidden-line">Hidden Line</option>
              <option value="x-ray">X-Ray</option>
            </select>
          </div>
        )}
      </div>
      
      {/* Bottom Left - Mode Indicator */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg shadow-lg px-3 py-2 pointer-events-auto">
        <div className="text-xs font-medium text-gray-700">
          Mode: <span className="font-semibold">{mode.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
