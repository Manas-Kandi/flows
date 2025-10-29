/**
 * Plane Selector
 * UI for selecting a sketch plane
 */

import { StandardPlanes } from '@flows/cad-kernel';
import type { SketchPlane } from '@flows/cad-kernel';
import { X } from 'lucide-react';

interface PlaneSelectorProps {
  isOpen: boolean;
  onSelectPlane: (plane: SketchPlane) => void;
  onCancel: () => void;
}

export function PlaneSelector({ isOpen, onSelectPlane, onCancel }: PlaneSelectorProps) {
  if (!isOpen) return null;
  
  const planes = [
    { name: 'Top (XY)', plane: StandardPlanes.Top, color: 'bg-blue-100' },
    { name: 'Front (XZ)', plane: StandardPlanes.Front, color: 'bg-red-100' },
    { name: 'Right (YZ)', plane: StandardPlanes.Right, color: 'bg-green-100' },
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Select Sketch Plane</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Choose a plane to start sketching on:
          </p>
          
          <div className="space-y-3">
            {planes.map(({ name, plane, color }) => (
              <button
                key={plane.id}
                onClick={() => onSelectPlane(plane)}
                className={`w-full p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors ${color} bg-opacity-10 hover:bg-opacity-20 text-left`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Normal: [{plane.normal.x}, {plane.normal.y}, {plane.normal.z}]
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded ${color} flex items-center justify-center text-2xl`}>
                    {name.includes('Top') && '⬆️'}
                    {name.includes('Front') && '➡️'}
                    {name.includes('Right') && '↗️'}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Face Selection Option */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📋</div>
              <div>
                <div className="font-medium text-gray-900 text-sm">Select Face</div>
                <p className="text-xs text-gray-600 mt-1">
                  Click on a model face to sketch on it (Coming soon)
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
