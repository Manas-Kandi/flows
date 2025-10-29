import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ModelToolbar } from './ModelToolbar';
import { SketchWorkspace } from './SketchWorkspace';
// import { SketchPlane } from '../sketch/SketchPlane';
// import { SketchOverlay } from '../sketch/SketchOverlay';
// import { ExtrudeTool } from '../3d/ExtrudeTool';
import { useWorkspaceStore } from '../../stores/workspaceStore';

function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  
  return (
    <div className="w-full h-full bg-gray-900 relative">
      <Canvas 
        ref={canvasRef}
        camera={{ position: [10, 10, 10], fov: 50 }}
        onCreated={({ gl, scene: threeScene, camera: threeCamera }) => {
          setCamera(threeCamera);
          setRenderer(gl);
          setScene(threeScene);
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <OrbitControls enablePan enableZoom enableRotate />
        
        {/* Default coordinate system */}
        <gridHelper args={[20, 20]} />
        <axesHelper args={[5]} />
        
        {/* Sketch Planes - Temporarily disabled */}
        {/* <SketchPlane plane="XY" position={[0, 0, 0]} />
        <SketchPlane plane="YZ" position={[0, 0, 0]} />
        <SketchPlane plane="XZ" position={[0, 0, 0]} /> */}
        
        {/* Sample geometry */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      </Canvas>
      
      {/* 3D Sketch Overlay - Temporarily disabled */}
      {/* {camera && renderer && scene && (
        <>
          <SketchOverlay 
            camera={camera}
            gl={renderer}
            scene={scene}
            width={1200}
            height={800}
          />
          
          <ExtrudeTool 
            camera={camera}
            scene={scene}
          />
        </>
      )} */}
    </div>
  );
}

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
