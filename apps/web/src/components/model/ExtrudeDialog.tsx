/**
 * Extrude Dialog
 * UI for creating extrude features
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import type { ExtrudeParameters } from '@flows/cad-kernel';
import { createDefaultExtrudeParameters, validateExtrudeParameters } from '@flows/cad-kernel';

interface ExtrudeDialogProps {
  isOpen: boolean;
  sketchId: string;
  onConfirm: (parameters: ExtrudeParameters) => void;
  onCancel: () => void;
}

export function ExtrudeDialog({
  isOpen,
  sketchId,
  onConfirm,
  onCancel,
}: ExtrudeDialogProps) {
  const [parameters, setParameters] = useState<ExtrudeParameters>(
    createDefaultExtrudeParameters()
  );
  
  const [errors, setErrors] = useState<string[]>([]);
  
  if (!isOpen) return null;
  
  const handleConfirm = () => {
    const validation = validateExtrudeParameters(parameters);
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    
    onConfirm(parameters);
  };
  
  const updateParameter = <K extends keyof ExtrudeParameters>(
    key: K,
    value: ExtrudeParameters[K]
  ) => {
    setParameters((prev: ExtrudeParameters) => ({
      ...prev,
      [key]: value,
    }));
    setErrors([]);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Extrude Feature</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Distance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distance (mm)
            </label>
            <input
              type="number"
              value={parameters.distance}
              onChange={(e) => updateParameter('distance', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
              min="0"
            />
          </div>
          
          {/* Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direction
            </label>
            <select
              value={parameters.direction}
              onChange={(e) => updateParameter('direction', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal (One Direction)</option>
              <option value="reverse">Reverse</option>
              <option value="symmetric">Symmetric (Both Directions)</option>
            </select>
          </div>
          
          {/* Operation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operation
            </label>
            <select
              value={parameters.operation}
              onChange={(e) => updateParameter('operation', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="new">New Body</option>
              <option value="join">Join</option>
              <option value="cut">Cut</option>
              <option value="intersect">Intersect</option>
            </select>
          </div>
          
          {/* End Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Type
            </label>
            <select
              value={parameters.endType}
              onChange={(e) => updateParameter('endType', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="blind">Blind</option>
              <option value="through-all">Through All</option>
              <option value="up-to-surface">Up To Surface</option>
            </select>
          </div>
          
          {/* Draft Angle (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Draft Angle (degrees) - Optional
            </label>
            <input
              type="number"
              value={parameters.draft || 0}
              onChange={(e) => updateParameter('draft', parseFloat(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.1"
              min="-89"
              max="89"
            />
          </div>
          
          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-medium text-red-800 mb-1">Validation Errors:</p>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Preview Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Sketch:</span> {sketchId}
            </p>
            <p className="text-sm text-blue-900 mt-1">
              Preview will appear in viewport
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Create Extrude
          </button>
        </div>
      </div>
    </div>
  );
}
