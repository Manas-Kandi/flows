import { Button } from '@components/ui/Button';
import {
  PenTool,
  Circle,
  Square,
  Minus,
  Spline,
  Box,
  RotateCw,
  MoveHorizontal,
  Grab,
  Disc,
  Layers,
  Edit3,
} from 'lucide-react';

interface ModelToolbarProps {
  isSketchMode?: boolean;
  onToggleSketch?: () => void;
}

export function ModelToolbar({ isSketchMode = false, onToggleSketch }: ModelToolbarProps) {
  return (
    <div className="h-12 border-b border-border bg-card flex items-center px-3 gap-2">
      {/* Mode Toggle */}
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <Button 
          variant={isSketchMode ? "default" : "ghost"} 
          size="icon" 
          title="Sketch Mode"
          onClick={onToggleSketch}
        >
          <Edit3 size={16} />
        </Button>
        <Button 
          variant={!isSketchMode ? "default" : "ghost"} 
          size="icon" 
          title="3D Mode"
          onClick={onToggleSketch}
        >
          <Box size={16} />
        </Button>
      </div>
      
      {/* Sketch Tools */}
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <span className="text-xs text-muted-foreground mr-2">Sketch</span>
        <Button variant="ghost" size="icon" title="Line">
          <Minus size={16} />
        </Button>
        <Button variant="ghost" size="icon" title="Circle">
          <Circle size={16} />
        </Button>
        <Button variant="ghost" size="icon" title="Rectangle">
          <Square size={16} />
        </Button>
        <Button variant="ghost" size="icon" title="Spline">
          <Spline size={16} />
        </Button>
        <Button variant="ghost" size="icon" title="Point">
          <PenTool size={16} />
        </Button>
      </div>

      {/* Feature Tools */}
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <span className="text-xs text-muted-foreground mr-2">Features</span>
        <Button variant="ghost" size="icon" title="Extrude">
          <Box size={16} />
        </Button>
        <Button variant="ghost" size="icon" title="Revolve">
          <RotateCw size={16} />
        </Button>
        <Button variant="ghost" size="icon" title="Sweep">
          <MoveHorizontal size={16} />
        </Button>
        <Button variant="ghost" size="icon" title="Loft">
          <Layers size={16} />
        </Button>
      </div>

      {/* Modify Tools */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-2">Modify</span>
        <Button variant="ghost" size="icon" title="Fillet">
          <Disc size={16} />
        </Button>
        <Button variant="ghost" size="icon" title="Chamfer">
          <Grab size={16} />
        </Button>
      </div>
    </div>
  );
}
