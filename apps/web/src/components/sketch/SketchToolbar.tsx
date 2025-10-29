/**
 * Sketch Toolbar - Tool palette for sketch mode
 */

import React from 'react';
import { useSketchStore } from '../../stores/sketchStore';
import type { SketchToolType } from '../../types/sketch';
import {
  MousePointer,
  Minus,
  Circle,
  Circle as Arc,
  CircleDot,
  Square,
  Grid3x3,
  Triangle,
  Scissors,
  Move,
  RotateCw,
  ArrowUpRight,
  ArrowLeftRight,
  MinusCircle,
  Expand,
} from 'lucide-react';

interface ToolButton {
  id: SketchToolType;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const letterIcon = (label: string) => (
  <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-700 text-[10px] font-semibold uppercase">
    {label}
  </span>
);

const DRAWING_TOOLS: ToolButton[] = [
  { id: 'select', icon: <MousePointer size={18} />, label: 'Select', shortcut: 'V' },
  { id: 'line', icon: <Minus size={18} />, label: 'Line', shortcut: 'L' },
  { id: 'circle', icon: <Circle size={18} />, label: 'Circle', shortcut: 'C' },
  { id: 'arc', icon: <Arc size={18} />, label: 'Arc', shortcut: 'A' },
  { id: 'rectangle', icon: <Square size={18} />, label: 'Rectangle', shortcut: 'R' },
  { id: 'point', icon: <Grid3x3 size={18} />, label: 'Point', shortcut: 'P' },
  { id: 'ellipse', icon: <CircleDot size={18} />, label: 'Ellipse', shortcut: 'E' },
  { id: 'polygon', icon: <Triangle size={18} />, label: 'Polygon', shortcut: 'Y' },
  { id: 'spline', icon: letterIcon('Spl'), label: 'Spline', shortcut: 'S' },
  { id: 'slot', icon: <MinusCircle size={18} />, label: 'Slot', shortcut: 'U' },
];

const EDITING_TOOLS: ToolButton[] = [
  { id: 'trim', icon: <Scissors size={18} />, label: 'Trim', shortcut: 'T' },
  { id: 'extend', icon: <ArrowUpRight size={18} />, label: 'Extend', shortcut: 'X' },
  { id: 'offset', icon: <Move size={18} />, label: 'Offset', shortcut: 'O' },
  { id: 'mirror', icon: <ArrowLeftRight size={18} />, label: 'Mirror', shortcut: 'M' },
  { id: 'rotate', icon: <RotateCw size={18} />, label: 'Rotate', shortcut: 'Q' },
  { id: 'scale', icon: <Expand size={18} />, label: 'Scale', shortcut: 'B' },
];

function renderToolButton(
  activeTool: SketchToolType,
  tool: ToolButton,
  setActiveTool: (tool: SketchToolType) => void
) {
  return (
    <button
      key={tool.id}
      onClick={() => setActiveTool(tool.id)}
      className={`
        flex items-center gap-2 px-3 py-2 rounded
        transition-colors
        ${activeTool === tool.id
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-700'
        }
      `}
      title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
    >
      {tool.icon}
      <span className="text-sm">{tool.label}</span>
      {tool.shortcut && (
        <span className="ml-auto text-xs text-gray-500">{tool.shortcut}</span>
      )}
    </button>
  );
}

export function SketchToolbar() {
  const { toolState, setActiveTool, gridVisible, setGridVisible, snapSettings, updateSnapSettings } = useSketchStore();
  
  return (
    <div className="sketch-toolbar flex flex-col gap-2 p-2 bg-gray-800 border-r border-gray-700">
      {/* Drawing Tools */}
      <div>
        <div className="px-2 py-1 text-xs uppercase tracking-wide text-gray-500">Draw</div>
        <div className="flex flex-col gap-1">
          {DRAWING_TOOLS.map((tool) => renderToolButton(toolState.activeTool, tool, setActiveTool))}
        </div>
      </div>
      
      {/* Divider */}
      <div className="h-px bg-gray-700 my-2" />
      
      {/* Editing Tools */}
      <div>
        <div className="px-2 py-1 text-xs uppercase tracking-wide text-gray-500">Edit</div>
        <div className="flex flex-col gap-1">
          {EDITING_TOOLS.map((tool) => renderToolButton(toolState.activeTool, tool, setActiveTool))}
        </div>
      </div>
      
      {/* Divider */}
      <div className="h-px bg-gray-700 my-2" />

      {/* Grid & Snap Settings */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 px-3 py-1 text-sm text-gray-300 cursor-pointer hover:bg-gray-700 rounded">
          <input
            type="checkbox"
            checked={gridVisible}
            onChange={(e) => setGridVisible(e.target.checked)}
            className="rounded"
          />
          Show Grid (G)
        </label>
        
        <label className="flex items-center gap-2 px-3 py-1 text-sm text-gray-300 cursor-pointer hover:bg-gray-700 rounded">
          <input
            type="checkbox"
            checked={snapSettings.enabled}
            onChange={(e) => updateSnapSettings({ enabled: e.target.checked })}
            className="rounded"
          />
          Snap Enabled
        </label>
        
        <label className="flex items-center gap-2 px-3 py-1 text-sm text-gray-300 cursor-pointer hover:bg-gray-700 rounded">
          <input
            type="checkbox"
            checked={snapSettings.gridSnap}
            onChange={(e) => updateSnapSettings({ gridSnap: e.target.checked })}
            className="rounded"
            disabled={!snapSettings.enabled}
          />
          Grid Snap
        </label>
        
        <label className="flex items-center gap-2 px-3 py-1 text-sm text-gray-300 cursor-pointer hover:bg-gray-700 rounded">
          <input
            type="checkbox"
            checked={snapSettings.endpointSnap}
            onChange={(e) => updateSnapSettings({ endpointSnap: e.target.checked })}
            className="rounded"
            disabled={!snapSettings.enabled}
          />
          Endpoint Snap
        </label>
      </div>
      {/* Info */}
      <div className="mt-auto p-2 text-xs text-gray-500">
        <div>Tool: {toolState.activeTool}</div>
        <div>Points: {toolState.currentPoints.length}</div>
        {toolState.snapTarget && (
          <div className="text-green-500">Snap: {toolState.snapTarget.type}</div>
        )}
      </div>
    </div>
  );
}
