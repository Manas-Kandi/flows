/**
 * Constraint Palette - Toolbar for adding constraints
 */

import React, { useState } from 'react';
import { useSketchStore } from '../../stores/sketchStore';
import { useModelStore } from '../../stores/modelStore';
import type { ConstraintType } from '../../types/sketch';
import { 
  Link, 
  ArrowUpDown, 
  ArrowLeftRight, 
  RotateCw, 
  Ruler, 
  Circle, 
  Triangle as Angle,
  Pin 
} from 'lucide-react';

interface ConstraintButton {
  type: ConstraintType;
  icon: React.ReactNode;
  label: string;
  description: string;
  minEntities: number;
  maxEntities: number;
}

const CONSTRAINTS: ConstraintButton[] = [
  { 
    type: 'coincident', 
    icon: <Link size={18} />, 
    label: 'Coincident', 
    description: 'Make points coincident',
    minEntities: 2, 
    maxEntities: 2 
  },
  { 
    type: 'horizontal', 
    icon: <ArrowLeftRight size={18} />, 
    label: 'Horizontal', 
    description: 'Make line horizontal',
    minEntities: 1, 
    maxEntities: 1 
  },
  { 
    type: 'vertical', 
    icon: <ArrowUpDown size={18} />, 
    label: 'Vertical', 
    description: 'Make line vertical',
    minEntities: 1, 
    maxEntities: 1 
  },
  { 
    type: 'parallel', 
    icon: <ArrowLeftRight size={18} />, 
    label: 'Parallel', 
    description: 'Make lines parallel',
    minEntities: 2, 
    maxEntities: 2 
  },
  { 
    type: 'perpendicular', 
    icon: <RotateCw size={18} />, 
    label: 'Perpendicular', 
    description: 'Make lines perpendicular',
    minEntities: 2, 
    maxEntities: 2 
  },
  { 
    type: 'distance', 
    icon: <Ruler size={18} />, 
    label: 'Distance', 
    description: 'Set distance between entities',
    minEntities: 2, 
    maxEntities: 2 
  },
  { 
    type: 'radius', 
    icon: <Circle size={18} />, 
    label: 'Radius', 
    description: 'Set circle/arc radius',
    minEntities: 1, 
    maxEntities: 1 
  },
  { 
    type: 'angle', 
    icon: <Angle size={18} />, 
    label: 'Angle', 
    description: 'Set angle between lines',
    minEntities: 2, 
    maxEntities: 2 
  },
  { 
    type: 'fix', 
    icon: <Pin size={18} />, 
    label: 'Fix', 
    description: 'Lock entity position',
    minEntities: 1, 
    maxEntities: 1 
  },
];

export function ConstraintPalette() {
  const { selection } = useSketchStore();
  const { addConstraint, solveConstraints } = useModelStore();
  const [showValueDialog, setShowValueDialog] = useState(false);
  const [pendingConstraint, setPendingConstraint] = useState<ConstraintType | null>(null);
  const [constraintValue, setConstraintValue] = useState('');

  const selectedCount = selection.selectedIds.size;

  const handleConstraintClick = (constraintType: ConstraintType) => {
    const constraint = CONSTRAINTS.find(c => c.type === constraintType);
    if (!constraint) return;

    if (selectedCount < constraint.minEntities) {
      console.warn(`Need at least ${constraint.minEntities} entities selected`);
      return;
    }

    if (selectedCount > constraint.maxEntities) {
      console.warn(`Can only apply to ${constraint.maxEntities} entities at a time`);
      return;
    }

    // Check if constraint needs a value
    if (constraintType === 'distance' || constraintType === 'radius' || constraintType === 'angle') {
      setPendingConstraint(constraintType);
      setShowValueDialog(true);
    } else {
      applyConstraint(constraintType);
    }
  };

  const applyConstraint = (constraintType: ConstraintType, value?: number) => {
    const selectedIds = Array.from(selection.selectedIds);
    
    const constraint = {
      id: `constraint-${Date.now()}`,
      type: constraintType,
      entityIds: selectedIds,
      parameters: value !== undefined ? { value } : {},
      strength: 'required' as const,
    };

    addConstraint(constraint as any);
    
    // Auto-solve after adding constraint
    setTimeout(() => {
      solveConstraints();
    }, 100);
  };

  const handleValueSubmit = () => {
    if (pendingConstraint && constraintValue) {
      const value = parseFloat(constraintValue);
      if (!isNaN(value)) {
        applyConstraint(pendingConstraint, value);
      }
    }
    
    setShowValueDialog(false);
    setPendingConstraint(null);
    setConstraintValue('');
  };

  const handleValueCancel = () => {
    setShowValueDialog(false);
    setPendingConstraint(null);
    setConstraintValue('');
  };

  return (
    <div className="constraint-palette flex flex-col gap-2 p-2 bg-gray-800 border-r border-gray-700">
      <h3 className="text-sm font-medium text-gray-300 mb-2">Constraints</h3>
      
      {/* Constraint Buttons */}
      <div className="flex flex-col gap-1">
        {CONSTRAINTS.map((constraint) => {
          const isDisabled = selectedCount < constraint.minEntities || 
                           selectedCount > constraint.maxEntities;
          
          return (
            <button
              key={constraint.type}
              onClick={() => handleConstraintClick(constraint.type)}
              disabled={isDisabled}
              className={`
                flex items-center gap-2 px-3 py-2 rounded text-left
                transition-colors
                ${isDisabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-300 hover:bg-gray-700'
                }
              `}
              title={constraint.description}
            >
              {constraint.icon}
              <div className="flex-1">
                <div className="text-sm">{constraint.label}</div>
                <div className="text-xs text-gray-500">
                  {constraint.minEntities}-{constraint.maxEntities} entities
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Solve Button */}
      <div className="h-px bg-gray-700 my-2" />
      
      <button
        onClick={solveConstraints}
        className="flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        <RotateCw size={18} />
        <span className="text-sm">Solve All</span>
      </button>

      {/* Selection Info */}
      <div className="mt-auto p-2 text-xs text-gray-500">
        <div>Selected: {selectedCount} entities</div>
        {selectedCount > 0 && (
          <div className="text-blue-500 mt-1">
            Select constraint to apply
          </div>
        )}
      </div>

      {/* Value Input Dialog */}
      {showValueDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 w-80">
            <h3 className="text-lg font-medium text-white mb-4">
              Enter {pendingConstraint} Value
            </h3>
            
            <input
              type="number"
              step="0.1"
              value={constraintValue}
              onChange={(e) => setConstraintValue(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter value..."
              autoFocus
            />
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleValueSubmit}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
              <button
                onClick={handleValueCancel}
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
