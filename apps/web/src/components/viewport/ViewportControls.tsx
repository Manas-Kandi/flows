import { Button } from '@components/ui/Button';
import {
  Maximize2,
  Grid3x3,
  Eye,
  Move3d,
  MousePointer2,
  Box,
  Circle,
  Minus,
} from 'lucide-react';

interface ViewportControlsProps {
  onViewChange: (view: string) => void;
}

export function ViewportControls({ onViewChange }: ViewportControlsProps) {
  return (
    <>
      {/* Top-right view controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-card/80 backdrop-blur-sm border rounded-lg p-2">
        <Button variant="ghost" size="icon" onClick={() => onViewChange('front')} title="Front View">
          <Eye size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onViewChange('top')} title="Top View">
          <Grid3x3 size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onViewChange('right')} title="Right View">
          <Move3d size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onViewChange('iso')} title="Isometric View">
          <Box size={16} />
        </Button>
        <div className="w-full h-px bg-border my-1" />
        <Button variant="ghost" size="icon" title="Zoom to Fit">
          <Maximize2 size={16} />
        </Button>
      </div>

      {/* Bottom-left tool palette */}
      <div className="absolute bottom-4 left-4 flex gap-2 bg-card/80 backdrop-blur-sm border rounded-lg p-2">
        <Button variant="ghost" size="icon" title="Select">
          <MousePointer2 size={16} />
        </Button>
        <Button variant="ghost" size="icon" title="Sketch">
          <Minus size={16} />
        </Button>
        <Button variant="ghost" size="icon" title="Circle">
          <Circle size={16} />
        </Button>
        <Button variant="ghost" size="icon" title="Rectangle">
          <Box size={16} />
        </Button>
      </div>
    </>
  );
}
