import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Constraint } from '@/types/sketch';

export interface DimensionEditDialogProps {
  constraint: Constraint;
  currentValue: number;
  unit: 'mm' | 'cm' | 'in' | 'ft';
  onValueChange: (newValue: number) => void;
  onExpressionChange?: (expression: string) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

const UNIT_CONVERSIONS = {
  mm: 1,
  cm: 10,
  in: 25.4,
  ft: 304.8,
};

export function DimensionEditDialog({
  constraint,
  currentValue,
  unit,
  onValueChange,
  onExpressionChange,
  onClose,
  position,
}: DimensionEditDialogProps) {
  const [value, setValue] = useState(currentValue.toString());
  const [expression, setExpression] = useState('');
  const [mode, setMode] = useState<'value' | 'expression'>('value');
  const [selectedUnit, setSelectedUnit] = useState(unit);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    setError('');
  };

  const handleExpressionChange = (newExpression: string) => {
    setExpression(newExpression);
    setError('');
  };

  const handleApply = () => {
    if (mode === 'value') {
      const numValue = parseFloat(value);
      
      // Validation
      if (isNaN(numValue)) {
        setError('Please enter a valid number');
        return;
      }
      
      if (numValue <= 0 && (constraint.type === 'distance' || constraint.type === 'radius' || constraint.type === 'diameter')) {
        setError('Value must be positive');
        return;
      }
      
      if (numValue < 0 && constraint.type === 'angle') {
        setError('Angle cannot be negative');
        return;
      }
      
      // Convert to mm (base unit)
      const valueInMM = numValue * UNIT_CONVERSIONS[selectedUnit];
      onValueChange(valueInMM);
      onClose();
    } else {
      // Expression mode
      if (!expression.trim()) {
        setError('Please enter an expression');
        return;
      }
      
      if (onExpressionChange) {
        onExpressionChange(expression);
        onClose();
      } else {
        setError('Expressions not supported for this constraint');
      }
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setMode(mode === 'value' ? 'expression' : 'value');
    }
  };

  const getConstraintLabel = () => {
    const labels: Record<string, string> = {
      distance: 'Distance',
      radius: 'Radius',
      diameter: 'Diameter',
      angle: 'Angle',
    };
    return labels[constraint.type] || 'Dimension';
  };

  const getConstraintUnit = () => {
    if (constraint.type === 'angle') {
      return '°';
    }
    return selectedUnit;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={handleCancel}
      />
      
      {/* Dialog */}
      <div
        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-80"
        style={{
          left: position ? `${position.x}px` : '50%',
          top: position ? `${position.y}px` : '50%',
          transform: position ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Edit {getConstraintLabel()}</h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Constraint Info */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">Type:</span> {getConstraintLabel()}
            {constraint.entityIds && constraint.entityIds.length > 0 && (
              <div className="mt-1">
                <span className="font-medium">Entities:</span>{' '}
                {constraint.entityIds.join(', ')}
              </div>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('value')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                mode === 'value'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Value
            </button>
            {onExpressionChange && (
              <button
                onClick={() => setMode('expression')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                  mode === 'expression'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Expression
              </button>
            )}
          </div>

          {/* Value Mode */}
          {mode === 'value' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value
                </label>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="number"
                    value={value}
                    onChange={(e) => handleValueChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    step="0.1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter value"
                  />
                  {constraint.type !== 'angle' && (
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="in">in</option>
                      <option value="ft">ft</option>
                    </select>
                  )}
                  {constraint.type === 'angle' && (
                    <span className="px-3 py-2 bg-gray-100 rounded text-gray-700">
                      °
                    </span>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded p-3 text-sm">
                <span className="text-gray-600">Preview:</span>{' '}
                <span className="font-medium text-gray-900">
                  {value || '0'} {getConstraintUnit()}
                </span>
              </div>
            </div>
          )}

          {/* Expression Mode */}
          {mode === 'expression' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expression
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={expression}
                  onChange={(e) => handleExpressionChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="=width * 2 + 10mm"
                />
              </div>

              {/* Help Text */}
              <div className="bg-blue-50 rounded p-3 text-xs text-blue-800">
                <div className="font-medium mb-1">Examples:</div>
                <div>• =width * 2</div>
                <div>• =height + 10mm</div>
                <div>• =radius * 3.14</div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="text-xs text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Tab</kbd> to switch modes
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
