/**
 * Arc Tool - Draw arcs in sketch (3-point mode)
 */

import { useEffect } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';
import { useModelStore } from '../../../stores/modelStore';
import { distance, angle, normalizeAngle } from '../../../lib/sketch/geometry';
import type { SketchArc } from '../../../types/sketch';

export function ArcTool() {
  const {
    toolState,
    setPreviewEntity,
    addEntity,
    clearDrawingPoints,
    setActiveTool,
  } = useSketchStore();
  
  const { solveConstraints } = useModelStore();
  
  useEffect(() => {
    // Update preview as cursor moves
    if (toolState.currentPoints.length > 0 && toolState.cursorPosition) {
      const cursorPos = toolState.snappedPosition || toolState.cursorPosition;
      
      if (toolState.currentPoints.length === 1) {
        // Show line from start point to cursor (first radius hint)
        const start = toolState.currentPoints[0];
        const previewArc: Partial<SketchArc> = {
          type: 'arc',
          center: start,
          radius: distance(start, cursorPos),
          startAngle: 0,
          endAngle: Math.PI / 4, // Small arc to show it's an arc tool
          isConstruction: false,
          isSelected: false,
          isHighlighted: false,
        };
        
        setPreviewEntity(previewArc as any);
      } else if (toolState.currentPoints.length === 2) {
        // Calculate arc from 3 points (2 placed + cursor)
        const start = toolState.currentPoints[0];
        const end = toolState.currentPoints[1];
        const through = cursorPos;
        
        const arcData = calculateArcFromThreePoints(start, end, through);
        if (arcData) {
          const previewArc: Partial<SketchArc> = {
            type: 'arc',
            center: arcData.center,
            radius: arcData.radius,
            startAngle: arcData.startAngle,
            endAngle: arcData.endAngle,
            isConstruction: false,
            isSelected: false,
            isHighlighted: false,
          };
          
          setPreviewEntity(previewArc as any);
        }
      }
    } else {
      setPreviewEntity(null);
    }
  }, [toolState.currentPoints, toolState.cursorPosition, toolState.snappedPosition, setPreviewEntity]);
  
  useEffect(() => {
    // Handle point placement
    if (toolState.currentPoints.length === 3) {
      // Create arc from three points
      const start = toolState.currentPoints[0];
      const end = toolState.currentPoints[1];
      const through = toolState.currentPoints[2];
      
      const arcData = calculateArcFromThreePoints(start, end, through);
      if (arcData) {
        // Add arc entity
        addEntity({
          type: 'arc',
          center: arcData.center,
          radius: arcData.radius,
          startAngle: arcData.startAngle,
          endAngle: arcData.endAngle,
          isConstruction: false,
          isSelected: false,
          isHighlighted: false,
        } as any);
      }
      
      // Reset for next arc
      clearDrawingPoints();
      setPreviewEntity(null);
      
      // Auto-solve constraints after entity creation
      setTimeout(() => {
        solveConstraints();
      }, 100);
    }
  }, [toolState.currentPoints.length, toolState.currentPoints, addEntity, clearDrawingPoints, setPreviewEntity, solveConstraints]);
  
  // Keyboard handlers
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        // Cancel current arc
        clearDrawingPoints();
        setPreviewEntity(null);
        if (e.key === 'Escape') {
          setActiveTool('select');
        }
      }
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [clearDrawingPoints, setPreviewEntity, setActiveTool]);
  
  return null; // Tool logic only, no UI
}

/**
 * Calculate arc center, radius, and angles from three points
 */
function calculateArcFromThreePoints(
  start: { x: number; y: number },
  end: { x: number; y: number },
  through: { x: number; y: number }
): { center: { x: number; y: number }; radius: number; startAngle: number; endAngle: number } | null {
  // Calculate perpendicular bisectors of the chords
  const midStartThrough = {
    x: (start.x + through.x) / 2,
    y: (start.y + through.y) / 2,
  };
  
  const midThroughEnd = {
    x: (through.x + end.x) / 2,
    y: (through.y + end.y) / 2,
  };
  
  // Handle vertical lines (infinite slope)
  let centerX: number, centerY: number;
  
  const dx1 = through.x - start.x;
  const dy1 = through.y - start.y;
  const dx2 = end.x - through.x;
  const dy2 = end.y - through.y;
  
  // Check for collinear points
  const crossProduct = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(crossProduct) < 1e-10) {
    return null; // Points are collinear
  }
  
  // Calculate the perpendicular bisector intersection
  const mid1x = (start.x + through.x) / 2;
  const mid1y = (start.y + through.y) / 2;
  const mid2x = (through.x + end.x) / 2;
  const mid2y = (through.y + end.y) / 2;
  
  // Perpendicular slopes
  const perpSlope1 = -dx1 / dy1;
  const perpSlope2 = -dx2 / dy2;
  
  // Handle special cases for vertical/horizontal lines
  if (Math.abs(dy1) < 1e-10) {
    // First line is horizontal, perpendicular is vertical
    centerX = mid1x;
    centerY = perpSlope2 * (centerX - mid2x) + mid2y;
  } else if (Math.abs(dy2) < 1e-10) {
    // Second line is horizontal, perpendicular is vertical
    centerX = mid2x;
    centerY = perpSlope1 * (centerX - mid1x) + mid1y;
  } else if (Math.abs(dx1) < 1e-10) {
    // First line is vertical, perpendicular is horizontal
    centerY = mid1y;
    centerX = (centerY - mid2y) / perpSlope2 + mid2x;
  } else if (Math.abs(dx2) < 1e-10) {
    // Second line is vertical, perpendicular is horizontal
    centerY = mid2y;
    centerX = (centerY - mid1y) / perpSlope1 + mid1x;
  } else {
    // General case
    centerX = (perpSlope2 * mid2x - perpSlope1 * mid1x + mid1y - mid2y) / (perpSlope2 - perpSlope1);
    centerY = perpSlope1 * (centerX - mid1x) + mid1y;
  }
  
  const center = { x: centerX, y: centerY };
  const radius = distance(start, center);
  
  // Calculate angles
  const startAngle = normalizeAngle(angle(center, start));
  const throughAngle = normalizeAngle(angle(center, through));
  const endAngle = normalizeAngle(angle(center, end));
  
  // Determine arc direction (shorter path that includes through point)
  let finalStartAngle = startAngle;
  let finalEndAngle = endAngle;
  
  // Check if through point is on the counter-clockwise arc
  const ccwContains = isAngleBetweenCCW(throughAngle, startAngle, endAngle);
  const cwContains = isAngleBetweenCCW(throughAngle, endAngle, startAngle);
  
  if (!ccwContains && cwContains) {
    // Use clockwise direction
    finalStartAngle = endAngle;
    finalEndAngle = startAngle;
  }
  
  return {
    center,
    radius,
    startAngle: finalStartAngle,
    endAngle: finalEndAngle,
  };
}

/**
 * Check if angle is between start and end angles in counter-clockwise direction
 */
function isAngleBetweenCCW(angle: number, startAngle: number, endAngle: number): boolean {
  let normalizedAngle = angle;
  let normalizedStart = startAngle;
  let normalizedEnd = endAngle;
  
  // Normalize to [0, 2π]
  if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
  if (normalizedStart < 0) normalizedStart += 2 * Math.PI;
  if (normalizedEnd < 0) normalizedEnd += 2 * Math.PI;
  
  if (normalizedStart <= normalizedEnd) {
    return normalizedAngle >= normalizedStart && normalizedAngle <= normalizedEnd;
  } else {
    return normalizedAngle >= normalizedStart || normalizedAngle <= normalizedEnd;
  }
}
