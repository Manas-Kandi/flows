/**
 * Ellipse Tool - Center + major/minor axis ellipse creation
 */

import { useEffect, useState } from 'react';
import { useSketchStore } from '../../../stores/sketchStore';
import { distance, angle, normalize } from '../../../lib/sketch/geometry';
import type { SketchEllipse, Point2D } from '../../../types/sketch';

interface EllipsePreview {
  center: Point2D;
  majorAxis: number;
  minorAxis: number;
  rotation: number;
}

export function EllipseTool() {
  const {
    toolState,
    setPreviewEntity,
    addEntity,
    clearDrawingPoints,
    solveConstraints,
  } = useSketchStore();
  const [previewData, setPreviewData] = useState<EllipsePreview | null>(null);
  
  useEffect(() => {
    const points = toolState.currentPoints;
    const cursor = toolState.snappedPosition || toolState.cursorPosition;
    if (!cursor || points.length === 0) {
      setPreviewData(null);
      setPreviewEntity(null);
      return;
    }
    
    const center = points[0];
    
    if (points.length === 1) {
      const majorAxis = Math.max(distance(center, cursor), 1);
      setPreview(center, majorAxis, majorAxis, 0);
      return;
    }
    
    const majorPoint = points[1];
    const axisRotation = angle(center, majorPoint);
    const majorAxis = Math.max(distance(center, majorPoint), 1);
    
    const referencePoint = points.length >= 3 ? points[2] : cursor;
    const minorAxis = computeMinorAxis(center, referencePoint, axisRotation) || majorAxis;
    
    setPreview(center, majorAxis, minorAxis, axisRotation);
  }, [
    toolState.currentPoints,
    toolState.cursorPosition,
    toolState.snappedPosition,
    setPreviewEntity,
  ]);
  
  const setPreview = (center: Point2D, majorAxis: number, minorAxis: number, rotation: number) => {
    const previewEllipse: Partial<SketchEllipse> = {
      type: 'ellipse',
      center,
      majorAxis,
      minorAxis,
      rotation,
      isConstruction: false,
      isSelected: false,
      isHighlighted: false,
    };
    setPreviewData({ center, majorAxis, minorAxis, rotation });
    setPreviewEntity(previewEllipse as SketchEllipse);
  };
  
  useEffect(() => {
    if (toolState.currentPoints.length === 3 && previewData) {
      const [center] = toolState.currentPoints;
      const majorPoint = toolState.currentPoints[1];
      const minorPoint = toolState.currentPoints[2];
      const rotation = angle(center, majorPoint);
      const majorAxis = Math.max(distance(center, majorPoint), 1);
      const minorAxis = computeMinorAxis(center, minorPoint, rotation) || previewData.minorAxis;
      
      addEntity({
        type: 'ellipse',
        center,
        majorAxis,
        minorAxis,
        rotation,
        isConstruction: false,
        isSelected: false,
        isHighlighted: false,
      } as SketchEllipse);
      
      clearDrawingPoints();
      setPreviewEntity(null);
      setPreviewData(null);
      setTimeout(() => solveConstraints(), 100);
    }
  }, [
    toolState.currentPoints,
    addEntity,
    clearDrawingPoints,
    setPreviewEntity,
    solveConstraints,
    previewData,
  ]);
  
  return null;
}

function computeMinorAxis(center: Point2D, target: Point2D, rotation: number): number {
  const dir = normalize(center, {
    x: center.x + Math.cos(rotation),
    y: center.y + Math.sin(rotation),
  });
  
  const normal = { x: -dir.y, y: dir.x };
  const vector = { x: target.x - center.x, y: target.y - center.y };
  const projection = Math.abs(vector.x * normal.x + vector.y * normal.y);
  return Math.max(projection, 1);
}
