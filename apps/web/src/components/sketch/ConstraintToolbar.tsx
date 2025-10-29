/**
 * Constraint Toolbar - Manage advanced geometric constraints
 */

import React, { useMemo } from 'react';
import { useSketchStore } from '../../stores/sketchStore';
import type { Constraint, ConstraintType, SketchEntity } from '../../types/sketch';
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
  Triangle,
  ArrowLeftRight,
  AlertTriangle,
  Trash2,
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
  { type: 'coincident', icon: <Link size={18} />, label: 'Coincident', description: 'Force points to share the same location', minEntities: 2, maxEntities: 2 },
  { type: 'horizontal', icon: <Minus size={18} />, label: 'Horizontal', description: 'Align a line horizontally', minEntities: 1, maxEntities: 1 },
  { type: 'vertical', icon: <RotateCw size={18} />, label: 'Vertical', description: 'Align a line vertically', minEntities: 1, maxEntities: 1 },
  { type: 'parallel', icon: <ArrowRight size={18} />, label: 'Parallel', description: 'Keep two lines parallel', minEntities: 2, maxEntities: 2 },
  { type: 'perpendicular', icon: <Triangle size={18} />, label: 'Perpendicular', description: 'Keep two lines orthogonal', minEntities: 2, maxEntities: 2 },
  { type: 'tangent', icon: <CircleDot size={18} />, label: 'Tangent', description: 'Make curves touch smoothly', minEntities: 2, maxEntities: 2 },
  { type: 'equal', icon: <Square size={18} />, label: 'Equal', description: 'Match lengths or radii', minEntities: 2, maxEntities: 2 },
  { type: 'concentric', icon: <CircleDot size={18} />, label: 'Concentric', description: 'Share the same center point', minEntities: 2, maxEntities: 2 },
  { type: 'symmetric', icon: <ArrowLeftRight size={18} />, label: 'Symmetric', description: 'Mirror entities across a line', minEntities: 3, maxEntities: 3 },
  { type: 'fix', icon: <Lock size={18} />, label: 'Fix', description: 'Lock entity position', minEntities: 1, maxEntities: 1 },
  { type: 'midpoint', icon: <Move size={18} />, label: 'Midpoint', description: 'Force point to lie at midpoint', minEntities: 2, maxEntities: 2 },
  { type: 'distance', icon: <Ruler size={18} />, label: 'Distance', description: 'Maintain distance between entities', minEntities: 2, maxEntities: 2 },
  { type: 'radius', icon: <Compass size={18} />, label: 'Radius', description: 'Lock circle/arc radius', minEntities: 1, maxEntities: 1 },
  { type: 'angle', icon: <RotateCw size={18} />, label: 'Angle', description: 'Set angle between lines', minEntities: 2, maxEntities: 2 },
];

const STATUS_COLOR: Record<string, string> = {
  satisfied: 'text-green-400',
  conflicting: 'text-red-400',
  inactive: 'text-yellow-400',
  redundant: 'text-slate-400',
};

export function ConstraintToolbar() {
  const {
    selection,
    addConstraint,
    deleteConstraint,
    getAllConstraints,
    getEntity,
    solveConstraints,
    constraintDiagnostics,
    degreesOfFreedom,
  } = useSketchStore();
  
  const selectedCount = selection.selectedIds.size;
  const constraints = getAllConstraints();
  
  const handleAddConstraint = (type: ConstraintType) => {
    const selectedIds = Array.from(selection.selectedIds);
    const definition = CONSTRAINTS.find((c) => c.type === type);
    if (!definition) return;
    
    if (selectedIds.length < definition.minEntities || selectedIds.length > definition.maxEntities) {
      alert(`${definition.label} requires selecting ${definition.minEntities} to ${definition.maxEntities} entities.`);
      return;
    }
    
    const constraintData = buildConstraintPayload(type, selectedIds, getEntity);
    if (!constraintData) {
      alert('Unable to create constraint with current selection.');
      return;
    }
    
    addConstraint(constraintData);
    solveConstraints();
  };
  
  const handleDeleteConstraint = (id: string) => {
    deleteConstraint(id);
    solveConstraints();
  };
  
  const handleClearConstraints = () => {
    constraints.forEach((constraint) => deleteConstraint(constraint.id));
    solveConstraints();
  };
  
  const diagnostics = useMemo(() => constraintDiagnostics, [constraintDiagnostics]);
  
  return (
    <div className="constraint-toolbar flex flex-col gap-2 p-3 bg-gray-800 border-r border-gray-700 w-72">
      <div className="flex items-center justify-between text-sm font-medium text-gray-300">
        <span>Constraints</span>
        <span className="text-xs text-gray-500">DOF: {degreesOfFreedom}</span>
      </div>
      <div className="text-xs text-gray-500">Selected entities: {selectedCount}</div>
      
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
        {CONSTRAINTS.map((constraint) => {
          const isEnabled = selectedCount >= constraint.minEntities && selectedCount <= constraint.maxEntities;
          return (
            <button
              key={constraint.type}
              onClick={() => handleAddConstraint(constraint.type)}
              disabled={!isEnabled}
              className={`
                flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors
                ${isEnabled ? 'text-gray-200 hover:bg-blue-600/60' : 'text-gray-600 cursor-not-allowed'}
              `}
              title={constraint.description}
            >
              {constraint.icon}
              <span className="flex-1 text-left">{constraint.label}</span>
              <span className="text-gray-500">{constraint.minEntities}-{constraint.maxEntities}</span>
            </button>
          );
        })}
      </div>
      
      <div className="h-px bg-gray-700 my-2" />
      
      <div className="flex items-center justify-between text-xs text-gray-400">
        <button
          onClick={solveConstraints}
          className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600/70 hover:bg-blue-600 text-white"
        >
          <RotateCw size={14} />
          Solve
        </button>
        <button
          onClick={handleClearConstraints}
          className="flex items-center gap-1 px-2 py-1 rounded bg-red-600/70 hover:bg-red-600 text-white"
        >
          <Trash2 size={14} />
          Clear
        </button>
      </div>
      
      <div className="h-px bg-gray-700 my-2" />
      
      <div className="text-xs text-gray-400">Active Constraints ({constraints.length})</div>
      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
        {constraints.length === 0 && (
          <div className="text-gray-600 text-xs">No constraints applied.</div>
        )}
        {constraints.map((constraint) => {
          const diag = diagnostics.get(constraint.id);
          const statusColor = diag ? STATUS_COLOR[diag.status] ?? 'text-gray-400' : 'text-gray-400';
          return (
            <div
              key={constraint.id}
              className="flex items-start justify-between gap-2 rounded border border-gray-700 px-2 py-1 text-xs text-gray-300 bg-gray-900/60"
            >
              <div className="flex flex-col">
                <span className="font-medium capitalize">{constraint.type}</span>
                <span className={`${statusColor} flex items-center gap-1`}>
                  <AlertTriangle size={12} />
                  {diag?.status ?? 'unknown'}
                </span>
                {diag?.message && (
                  <span className="text-[10px] text-gray-500">{diag.message}</span>
                )}
              </div>
              <button
                className="text-gray-500 hover:text-red-400 transition"
                onClick={() => handleDeleteConstraint(constraint.id)}
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildConstraintPayload(
  type: ConstraintType,
  entityIds: string[],
  getEntity: (id: string) => SketchEntity | undefined
): Omit<Constraint, 'id' | 'createdAt' | 'sketchId'> | null {
  const base = {
    entityIds,
    isActive: true,
    isDriving: true,
  } as Omit<Constraint, 'id' | 'createdAt' | 'sketchId'>;
  
  switch (type) {
    case 'coincident':
      return {
        ...base,
        type: 'coincident',
        point1: { entityId: entityIds[0] },
        point2: { entityId: entityIds[1] },
      };
    case 'horizontal':
    case 'vertical':
    case 'fix':
      return {
        ...base,
        type,
        ...(type === 'fix' ? { entityId: entityIds[0] } : {}),
        ...(type === 'horizontal' || type === 'vertical' ? { lineId: entityIds[0] } : {}),
      };
    case 'parallel':
    case 'perpendicular':
    case 'concentric':
    case 'tangent':
      return {
        ...base,
        type,
        ...(type === 'parallel' || type === 'perpendicular'
          ? { line1Id: entityIds[0], line2Id: entityIds[1] }
          : {}),
        ...(type === 'concentric' || type === 'tangent'
          ? { entity1Id: entityIds[0], entity2Id: entityIds[1] }
          : {}),
      };
    case 'midpoint': {
      const [first, second] = entityIds;
      const entityA = getEntity(first);
      const entityB = getEntity(second);
      const pointEntity = entityA?.type === 'point' ? entityA : entityB;
      const lineEntity = entityA?.type === 'line' ? entityA : entityB?.type === 'line' ? entityB : undefined;
      if (!pointEntity || !lineEntity) return null;
      return {
        ...base,
        type: 'midpoint',
        pointId: pointEntity.id,
        lineId: lineEntity.id,
      };
    }
    case 'distance': {
      const input = prompt('Distance value', '100');
      if (!input) return null;
      const value = Number.parseFloat(input);
      if (Number.isNaN(value)) return null;
      return {
        ...base,
        type: 'distance',
        value,
        parameters: { value },
        entity1Id: entityIds[0],
        entity2Id: entityIds[1],
      };
    }
    case 'radius': {
      const input = prompt('Radius value', '50');
      if (!input) return null;
      const value = Number.parseFloat(input);
      if (Number.isNaN(value)) return null;
      return {
        ...base,
        type: 'radius',
        value,
        parameters: { value },
        circleId: entityIds[0],
      };
    }
    case 'angle': {
      const input = prompt('Angle in degrees', '90');
      if (!input) return null;
      const degrees = Number.parseFloat(input);
      if (Number.isNaN(degrees)) return null;
      const radians = (degrees * Math.PI) / 180;
      return {
        ...base,
        type: 'angle',
        value: radians,
        parameters: { value: radians },
        line1Id: entityIds[0],
        line2Id: entityIds[1],
      };
    }
    case 'equal': {
      const entityA = getEntity(entityIds[0]);
      const entityB = getEntity(entityIds[1]);
      if (!entityA || !entityB) return null;
      const property: 'length' | 'radius' =
        entityA.type === 'line' && entityB.type === 'line' ? 'length' : 'radius';
      return {
        ...base,
        type: 'equal',
        property,
        entity1Id: entityIds[0],
        entity2Id: entityIds[1],
      };
    }
    case 'symmetric': {
      return {
        ...base,
        type: 'symmetric',
        entity1Id: entityIds[0],
        entity2Id: entityIds[1],
        aboutEntityId: entityIds[2],
      };
    }
    default:
      return null;
  }
}
