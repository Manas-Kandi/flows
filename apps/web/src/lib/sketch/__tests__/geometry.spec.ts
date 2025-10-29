import { describe, it, expect } from 'vitest';
import {
  getPolygonVertices,
  closestPointOnEllipse,
  pointOnEllipse,
  splinePointAt,
} from '../geometry';
import type { SketchEllipse, SketchPolygon, SketchSpline } from '../../../types/sketch';

describe('sketch geometry helpers', () => {
  it('computes regular polygon vertices', () => {
    const polygon: SketchPolygon = {
      id: 'poly-1',
      type: 'polygon',
      sketchId: 'sketch-1',
      isConstruction: false,
      isSelected: false,
      isHighlighted: false,
      createdAt: Date.now(),
      center: { x: 0, y: 0 },
      radius: 10,
      sides: 6,
      rotation: 0,
    };
    const vertices = getPolygonVertices(polygon);
    expect(vertices).toHaveLength(6);
    expect(vertices[0]).toMatchObject({ x: 10, y: 0 });
    const lengths = vertices.map((v) => Math.hypot(v.x, v.y));
    lengths.forEach((length) => expect(Math.abs(length - 10)).toBeLessThan(1e-6));
  });

  it('finds closest point on ellipse', () => {
    const ellipse: SketchEllipse = {
      id: 'ellipse-1',
      type: 'ellipse',
      sketchId: 'sketch-1',
      isConstruction: false,
      isSelected: false,
      isHighlighted: false,
      createdAt: Date.now(),
      center: { x: 0, y: 0 },
      majorAxis: 10,
      minorAxis: 5,
      rotation: Math.PI / 6,
    };
    const externalPoint = { x: 20, y: 5 };
    const closest = closestPointOnEllipse(ellipse, externalPoint);
    const onEllipse = pointOnEllipse(ellipse, Math.atan2(closest.y - ellipse.center.y, closest.x - ellipse.center.x));
    expect(Math.hypot(closest.x - onEllipse.x, closest.y - onEllipse.y)).toBeLessThan(1e-3);
  });

  it('evaluates spline point along curve', () => {
    const spline: SketchSpline = {
      id: 'spline-1',
      type: 'spline',
      sketchId: 'sketch-1',
      isConstruction: false,
      isSelected: false,
      isHighlighted: false,
      createdAt: Date.now(),
      controlPoints: [
        { x: 0, y: 0 },
        { x: 5, y: 10 },
        { x: 10, y: 0 },
      ],
      degree: 2,
      isClosed: false,
    };
    const start = splinePointAt(spline, 0);
    const mid = splinePointAt(spline, 0.5);
    const end = splinePointAt(spline, 1);
    expect(start).toMatchObject({ x: 0, y: 0 });
    expect(end).toMatchObject({ x: 10, y: 0 });
    expect(mid.y).toBeGreaterThan(4);
  });
});
