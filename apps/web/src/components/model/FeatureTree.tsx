/**
 * Feature Tree
 * Displays hierarchical feature history
 */

import { useState } from 'react';
import { useFeatureStore } from '../../stores/featureStore';
import { Eye, EyeOff, Edit2, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

export function FeatureTree() {
  const {
    featureTree,
    selectedFeature,
    selectFeature,
    setEditingFeature,
    removeFeature,
    suppressFeature,
    unsuppressFeature,
  } = useFeatureStore();
  
  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Feature Tree</h3>
      </div>
      
      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {featureTree.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-500">
            No features yet
          </div>
        ) : (
          <div className="space-y-1">
            {featureTree.map((feature, index) => (
              <FeatureTreeItem
                key={feature.id}
                feature={feature}
                index={index}
                isSelected={selectedFeature === feature.id}
                onSelect={() => selectFeature(feature.id)}
                onEdit={() => setEditingFeature(feature.id)}
                onDelete={() => removeFeature(feature.id)}
                onToggleSuppress={() => {
                  if (feature.suppressed) {
                    unsuppressFeature(feature.id);
                  } else {
                    suppressFeature(feature.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FeatureTreeItemProps {
  feature: any;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSuppress: () => void;
}

function FeatureTreeItem({
  feature,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleSuppress,
}: FeatureTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = feature.children && feature.children.length > 0;
  
  const getFeatureIcon = (type: string) => {
    switch (type) {
      case 'extrude':
        return '📦';
      case 'revolve':
        return '🔄';
      case 'fillet':
        return '⭕';
      case 'chamfer':
        return '📐';
      case 'hole':
        return '⚫';
      case 'pattern-linear':
      case 'pattern-circular':
        return '🔢';
      case 'mirror':
        return '🪞';
      default:
        return '📄';
    }
  };
  
  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group ${
          isSelected
            ? 'bg-blue-50 text-blue-900'
            : feature.suppressed
            ? 'text-gray-400'
            : feature.failed
            ? 'text-red-600'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
        onClick={onSelect}
      >
        {/* Expand/Collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-0.5 hover:bg-gray-200 rounded"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <div className="w-3.5" />
          )}
        </button>
        
        {/* Icon */}
        <span className="text-sm">{getFeatureIcon(feature.type)}</span>
        
        {/* Name */}
        <span className="flex-1 text-sm truncate">
          {index + 1}. {feature.name}
        </span>
        
        {/* Status badges */}
        {feature.failed && (
          <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
            Failed
          </span>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSuppress();
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title={feature.suppressed ? 'Unsuppress' : 'Suppress'}
          >
            {feature.suppressed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-100 text-red-600 rounded"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {/* Render children here if needed */}
        </div>
      )}
    </div>
  );
}
