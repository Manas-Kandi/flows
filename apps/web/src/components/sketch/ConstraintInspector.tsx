import { useState } from 'react';
import { Search, X, Eye, EyeOff, Trash2, AlertTriangle, Edit3, ChevronRight } from 'lucide-react';
import type { Constraint } from '@/types/sketch';

export interface ConstraintInspectorProps {
  constraints: Constraint[];
  selectedEntityIds: string[];
  onDeleteConstraint: (constraintId: string) => void;
  onToggleConstraint: (constraintId: string, enabled: boolean) => void;
  onEditConstraint: (constraint: Constraint) => void;
  onHighlightConstraint: (constraintId: string | null) => void;
  onNavigateToConstraint: (constraintId: string) => void;
  conflicts?: Array<{ constraintIds: string[]; reason: string }>;
  degreesOfFreedom?: number;
}

const CONSTRAINT_ICONS: Record<string, string> = {
  coincident: '⚬',
  horizontal: '═══',
  vertical: '║',
  parallel: '‖',
  perpendicular: '⊥',
  tangent: '⊤',
  equal: '=',
  concentric: '◎',
  fix: '⚓',
  midpoint: '⊡',
  distance: '📏',
  radius: 'R',
  diameter: 'Ø',
  angle: '∠',
};

export function ConstraintInspector({
  constraints,
  selectedEntityIds,
  onDeleteConstraint,
  onToggleConstraint,
  onEditConstraint,
  onHighlightConstraint,
  onNavigateToConstraint,
  conflicts = [],
  degreesOfFreedom,
}: ConstraintInspectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);

  // Filter constraints
  const filteredConstraints = constraints.filter((constraint) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesId = constraint.id.toLowerCase().includes(searchLower);
      const matchesType = constraint.type.toLowerCase().includes(searchLower);
      const matchesEntities = constraint.entityIds.some(id => 
        id.toLowerCase().includes(searchLower)
      );
      if (!matchesId && !matchesType && !matchesEntities) {
        return false;
      }
    }

    // Type filter
    if (filterType !== 'all' && constraint.type !== filterType) {
      return false;
    }

    // Selected entities filter
    if (selectedEntityIds.length > 0) {
      const isRelatedToSelection = constraint.entityIds.some(id =>
        selectedEntityIds.includes(id)
      );
      if (!isRelatedToSelection) {
        return false;
      }
    }

    // Conflicts filter
    if (showConflictsOnly) {
      const isConflicting = conflicts.some(conflict =>
        conflict.constraintIds.includes(constraint.id)
      );
      if (!isConflicting) {
        return false;
      }
    }

    return true;
  });

  const getConstraintValue = (constraint: Constraint): string => {
    if (constraint.type === 'distance' || constraint.type === 'radius' || constraint.type === 'diameter') {
      const value = constraint.parameters?.value || constraint.value;
      return value ? `${value.toFixed(2)} mm` : '';
    }
    if (constraint.type === 'angle') {
      const value = constraint.parameters?.value || constraint.value;
      return value ? `${value.toFixed(1)}°` : '';
    }
    return '';
  };

  const isConstraintConflicting = (constraintId: string): boolean => {
    return conflicts.some(conflict => conflict.constraintIds.includes(constraintId));
  };

  const getConflictReason = (constraintId: string): string | null => {
    const conflict = conflicts.find(c => c.constraintIds.includes(constraintId));
    return conflict?.reason || null;
  };

  const uniqueTypes = Array.from(new Set(constraints.map(c => c.type))).sort();

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">
            Constraints ({filteredConstraints.length})
          </h3>
          {degreesOfFreedom !== undefined && (
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                degreesOfFreedom === 0
                  ? 'bg-green-100 text-green-800'
                  : degreesOfFreedom < 0
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              DOF: {degreesOfFreedom}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search constraints..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          {conflicts.length > 0 && (
            <button
              onClick={() => setShowConflictsOnly(!showConflictsOnly)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                showConflictsOnly
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <AlertTriangle size={14} className="inline mr-1" />
              Conflicts
            </button>
          )}
        </div>
      </div>

      {/* Constraints List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConstraints.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-sm">No constraints found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConstraints.map((constraint) => {
              const isConflicting = isConstraintConflicting(constraint.id);
              const conflictReason = getConflictReason(constraint.id);
              const value = getConstraintValue(constraint);
              const isEnabled = !constraint.suppressed;

              return (
                <div
                  key={constraint.id}
                  className={`group px-4 py-3 hover:bg-gray-50 transition-colors ${
                    isConflicting ? 'bg-red-50' : ''
                  }`}
                  onMouseEnter={() => onHighlightConstraint(constraint.id)}
                  onMouseLeave={() => onHighlightConstraint(null)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded ${
                      isConflicting ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className="text-sm">
                        {CONSTRAINT_ICONS[constraint.type] || '•'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${
                          isEnabled ? 'text-gray-900' : 'text-gray-400 line-through'
                        }`}>
                          {constraint.type.charAt(0).toUpperCase() + constraint.type.slice(1)}
                        </span>
                        {value && (
                          <span className="text-xs font-medium text-blue-600">
                            {value}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mt-0.5">
                        {constraint.entityIds.join(', ')}
                      </div>

                      {isConflicting && conflictReason && (
                        <div className="mt-1 text-xs text-red-600 flex items-start gap-1">
                          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                          <span>{conflictReason}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {value && (
                        <button
                          onClick={() => onEditConstraint(constraint)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit value"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}

                      <button
                        onClick={() => onToggleConstraint(constraint.id, !isEnabled)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title={isEnabled ? 'Suppress' : 'Enable'}
                      >
                        {isEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('Delete this constraint?')) {
                            onDeleteConstraint(constraint.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>

                      <button
                        onClick={() => onNavigateToConstraint(constraint.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Navigate to constraint"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Conflicts Summary */}
      {conflicts.length > 0 && !showConflictsOnly && (
        <div className="border-t border-gray-200 p-4 bg-red-50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="flex-shrink-0 text-red-600 mt-0.5" size={16} />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected
              </p>
              <p className="text-xs text-red-700 mt-1">
                Click "Conflicts" filter to view only conflicting constraints
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DOF Warning */}
      {degreesOfFreedom !== undefined && degreesOfFreedom < 0 && (
        <div className="border-t border-gray-200 p-4 bg-yellow-50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="flex-shrink-0 text-yellow-600 mt-0.5" size={16} />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">
                Over-Constrained System
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                System has {Math.abs(degreesOfFreedom)} too many constraints. Remove redundant constraints.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
