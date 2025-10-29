import { useState } from 'react';
import { ChevronRight, Layers } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { FeatureTree } from '@components/model/FeatureTree';

export function LeftSidebar() {
  const [expanded, setExpanded] = useState(true);

  if (!expanded) {
    return (
      <div className="w-12 border-r border-border bg-card flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(true)}
          className="mb-2"
        >
          <ChevronRight size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-[280px] border-r border-border bg-card flex flex-col">
      {/* Header */}
      <div className="h-10 border-b border-border flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium">Features & Sketches</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setExpanded(false)}>
          <ChevronRight size={18} />
        </Button>
      </div>

      {/* Feature Tree */}
      <div className="flex-1 overflow-hidden">
        <FeatureTree />
      </div>
    </div>
  );
}
