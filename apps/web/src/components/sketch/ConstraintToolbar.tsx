/**
 * Constraint Toolbar - Add geometric constraints to sketch
 */

import React from 'react';
import { useModelStore } from '../../stores/modelStore';
import { useSketchStore } from '../../stores/sketchStore';
import type { Constraint } from '../../types';
import { 
  Link, 
  Minus, 
  RotateCw, 
  ArrowRight, 
  CircleDot,
  Square,
  Move,
  Ruler,
  Compass,
  Lock,
  Triangle
} from 'lucide-react';

interface ConstraintButton {
  type: Constraint['type'];
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
    description: 'Make two points share the same location',
    minEntities: 2,
    maxEntities: 2
  },
  { 
    type: 'horizontal', 
    icon: <Minus size={18} />, 
    label: 'Horizontal', 
    description: 'Make a line horizontal',
    minEntities: 1,
    maxEntities: 1
  },
  { 
    type: 'vertical', 
    icon: <RotateCw size={18} />, 
    label: 'Vertical', 
    description: 'Make a line vertical',
    minEntities: 1,
    maxEntities: 1
  },
  { 
    type: 'parallel', 
    icon: <ArrowRight size={18} />, 
    label: 'Parallel', 
    description: 'Make two lines parallel',
    minEntities: 2,
    maxEntities: 2
  },
  { 
    type: 'perpendicular', 
    icon: <Triangle size={18} />, 
    label: 'Perpendicular', 
    description: 'Make two lines perpendicular',
    minEntities: 2,
    maxEntities: 2
  },
  { 
    type: 'tangent', 
    icon: <CircleDot size={18} />, 
    label: 'Tangent', 
    description: 'Make curves tangent',
    minEntities: 2,
    maxEntities: 2
  },
  { 
    type: 'equal', 
    icon: <Square size={18} />, 
    label: 'Equal', 
    description: 'Make dimensions equal',
    minEntities: 2,
    maxEntities: 2
  },
  { 
    type: 'concentric', 
    icon: <CircleDot size={18} />, 
    label: 'Concentric', 
    description: 'Share center point',
    minEntities: 2,
    maxEntities: 2
  },
  { 
    type: 'fix', 
    icon: <Lock size={18} />, 
    label: 'Fix', 
    description: 'Lock entity position',
    minEntities: 1,
    maxEntities: 1
  },
  { 
    type: 'midpoint', 
    icon: <Move size={18} />, 
    label: 'Midpoint', 
    description: 'Point at line midpoint',
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
    icon: <Compass size={18} />, 
    label: 'Radius', 
    description: 'Set circle/arc radius',
    minEntities: 1,
    maxEntities: 1
  },
  { 
    type: 'angle', 
    icon: <RotateCw size={18} />, 
    label: 'Angle', 
    description: 'Set angle between lines',
    minEntities: 2,
    maxEntities: 2
  },
];

export function ConstraintToolbar() {
  const { selection } = useSketchStore();
  const { addConstraint, solveConstraints } = useModelStore();
  
  const handleAddConstraint = (type: Constraint['type']) => {
    const selectedIds = Array.from(selection.selectedIds);
    
    if (selectedIds.length === 0) {
      alert('Please select entities first');
      return;
    }
    
    const constraint = CONSTRAINTS.find(c => c.type === type);
    if (!constraint) return;
    
    if (selectedIds.length < constraint.minEntities || selectedIds.length > constraint.maxEntities) {
      alert(`${constraint.label} requires ${constraint.minEntities}-${constraint.maxEntities} entities`);
      return;
    }
    
    // Create constraint
    const newConstraint: Constraint = {
      id: `constraint-${Date.now()}`,
      type,
      entities: selectedIds,
      value: type === 'distance' ? 100 : type === 'radius' ? 50 : type === 'angle' ? 90 : undefined,
      satisfied: false,
    };
    
    addConstraint(newConstraint);
    
    // Solve constraints after adding
    setTimeout(() => {
      solveConstraints();
    }, 100);
  };
  
  const handleSolveConstraints = () => {
    solveConstraints();
  };
  
  const selectedCount = selection.selectedIds.size;
  
  return (
    <div className="constraint-toolbar flex flex-col gap-2 p-2 bg-gray-800 border-r border-gray-700 w-64">
      <div className="text-sm font-medium text-gray-300 mb-2">
        Constraints ({selectedCount} selected)
      </div>
      
      {/* Constraint Buttons */}
      <div className="flex flex-col gap-1 max-h-96 overflow-y-auto">
        {CONSTRAINTS.map((constraint) => {
          const isEnabled = selectedCount >= constraint.minEntities && 
                           selectedCount <= constraint.maxEntities;
          
          return (
            <button
              key={constraint.type}
              onClick={() => handleAddConstraint(constraint.type)}
              disabled={!isEnabled}
              className={`
                flex items-center gap-2 px-2 py-1 rounded text-xs
                transition-colors
                ${isEnabled
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 cursor-not-allowed'
                }
              `}
              title={constraint.description}
            >
              {constraint.icon}
              <span className="flex-1 text-left">{constraint.label}</span>
              <span className="text-gray-500">
                {constraint.minEntities}-{constraint.maxEntities}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Divider */}
      <div className="h-px bg-gray-700 my-2" />
      
      {/* Actions */}
      <div className="flex flex-col gap-1">
        <button
          onClick={handleSolveConstraints}
          className="flex items-center gap-2 px-2 py-1 rounded text-xs text-gray-300 hover:bg-blue-600"
        >
          <RotateCw size={14} />
          Solve Constraints
        </button>
        
        <button
          onClick={() => useModelStore.getState().clearAllConstraints()}
          className="flex items-center gap-2 px-2 py-1 rounded text-xs text-gray-300 hover:bg-red-600"
        >
          <Minus size={14} />
          Clear Constraints
        </button>
      </div>
      
      {/* Info */}
      <div className="mt-auto p-2 text-xs text-gray-500">
        <div>Selected: {selectedCount} entities</div>
        <div>Constraints: {useModelStore.getState().sketchState.constraints.size}</div>
      </div>
    </div>
  );
}
