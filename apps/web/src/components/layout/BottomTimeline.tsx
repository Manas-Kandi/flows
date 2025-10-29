import { useState } from 'react';
import { ChevronUp, ChevronDown, Play, Pause, Eye, EyeOff } from 'lucide-react';
import { Button } from '@components/ui/Button';

export function BottomTimeline() {
  const [expanded, setExpanded] = useState(true);
  const [features] = useState([
    { id: '1', name: 'Sketch 1', type: 'sketch', suppressed: false },
    { id: '2', name: 'Extrude 1', type: 'extrude', suppressed: false },
    { id: '3', name: 'Fillet 1', type: 'fillet', suppressed: false },
  ]);

  if (!expanded) {
    return (
      <div className="h-10 border-t border-border bg-card flex items-center justify-between px-4">
        <span className="text-sm text-muted-foreground">Timeline</span>
        <Button variant="ghost" size="icon" onClick={() => setExpanded(true)}>
          <ChevronUp size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[180px] border-t border-border bg-card flex flex-col">
      {/* Header */}
      <div className="h-10 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Feature Timeline</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" title="Play">
              <Play size={14} />
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setExpanded(false)}>
          <ChevronDown size={18} />
        </Button>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-x-auto scrollbar-thin p-3">
        <div className="flex items-center gap-2 min-w-max">
          {features.map((feature, index) => (
            <TimelineCard
              key={feature.id}
              feature={feature}
              index={index}
              isLast={index === features.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TimelineCardProps {
  feature: any;
  index: number;
  isLast: boolean;
}

function TimelineCard({ feature, index, isLast }: TimelineCardProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-[160px] h-[100px] border rounded-lg bg-background p-2 flex flex-col justify-between hover:border-primary cursor-pointer transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{feature.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{feature.type}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title={feature.suppressed ? 'Show' : 'Hide'}
          >
            {feature.suppressed ? <EyeOff size={12} /> : <Eye size={12} />}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">#{index + 1}</div>
      </div>
      {!isLast && (
        <div className="w-6 h-px bg-border" />
      )}
    </div>
  );
}
