import { AlertTriangle, X, Undo, Trash2, EyeOff } from 'lucide-react';
import type { SolverFailure } from '@flows/constraint-solver';
import type { Constraint } from '@/types/sketch';

export interface SolverErrorDialogProps {
  failure: SolverFailure;
  constraints: Constraint[];
  onRevert: () => void;
  onSuppressConstraints: (constraintIds: string[]) => void;
  onDeleteConstraints: (constraintIds: string[]) => void;
  onKeepAnyway: () => void;
  onClose: () => void;
}

const REASON_TITLES: Record<SolverFailure['reason'], string> = {
  over_constrained: 'Over-Constrained System',
  conflicting: 'Conflicting Constraints',
  degenerate: 'Invalid Geometry',
  numerical_instability: 'Numerical Instability',
  unknown: 'Solver Failed',
};

const REASON_DESCRIPTIONS: Record<SolverFailure['reason'], string> = {
  over_constrained: 'The sketch has too many constraints. Some constraints are redundant or conflicting.',
  conflicting: 'Multiple constraints cannot be satisfied simultaneously.',
  degenerate: 'Some geometry is invalid (zero length, negative radius, etc.).',
  numerical_instability: 'The solver encountered numerical issues. Try simplifying the constraints.',
  unknown: 'The constraint solver failed for an unknown reason.',
};

export function SolverErrorDialog({
  failure,
  constraints,
  onRevert,
  onSuppressConstraints,
  onDeleteConstraints,
  onKeepAnyway,
  onClose,
}: SolverErrorDialogProps) {
  const problematicConstraints = constraints.filter(c =>
    failure.problematicConstraints.includes(c.id)
  );

  const getConstraintLabel = (constraint: Constraint): string => {
    const type = constraint.type.charAt(0).toUpperCase() + constraint.type.slice(1);
    const value = constraint.parameters?.value || constraint.value;
    const valueStr = value ? ` (${value})` : '';
    return `${type}${valueStr}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-red-50">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {REASON_TITLES[failure.reason]}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {REASON_DESCRIPTIONS[failure.reason]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Problem Description */}
          {failure.details && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">{failure.details}</p>
            </div>
          )}

          {/* Suggestion */}
          {failure.suggestion && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-1">Suggestion</p>
              <p className="text-sm text-blue-800">{failure.suggestion}</p>
            </div>
          )}

          {/* Problematic Constraints */}
          {problematicConstraints.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">
                Problematic Constraints ({problematicConstraints.length})
              </p>
              <div className="space-y-2">
                {problematicConstraints.map((constraint) => (
                  <div
                    key={constraint.id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {getConstraintLabel(constraint)}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {constraint.entityIds.join(' • ')}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {constraint.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          {failure.reason === 'over_constrained' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                <strong>Tip:</strong> An over-constrained system has more constraints
                than necessary. Try removing one or more of the highlighted constraints.
              </p>
            </div>
          )}

          {failure.reason === 'conflicting' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                <strong>Tip:</strong> Conflicting constraints cannot be satisfied
                together (e.g., distance=10 and distance=20 on the same entities).
              </p>
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="space-y-3">
            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-2">
              {failure.canRevert && (
                <button
                  onClick={onRevert}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Undo size={16} />
                  Undo Last Change
                </button>
              )}

              {problematicConstraints.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm(`Delete ${problematicConstraints.length} constraint(s)?`)) {
                      onDeleteConstraints(failure.problematicConstraints);
                      onClose();
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} />
                  Delete Constraints
                </button>
              )}
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2">
              {problematicConstraints.length > 0 && (
                <button
                  onClick={() => {
                    onSuppressConstraints(failure.problematicConstraints);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <EyeOff size={16} />
                  Suppress
                </button>
              )}

              <button
                onClick={() => {
                  onKeepAnyway();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep Anyway
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
              Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
