import { useState } from 'react';
import { ChevronRight, ChevronDown, FileCode, Folder, GitBranch } from 'lucide-react';
import { Button } from '@components/ui/Button';

export function LeftSidebar() {
  const [expanded, setExpanded] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

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
        <span className="text-sm font-medium">Project Explorer</span>
        <Button variant="ghost" size="icon" onClick={() => setExpanded(false)}>
          <ChevronRight size={18} />
        </Button>
      </div>

      {/* Branch Selector */}
      <div className="p-3 border-b border-border">
        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
          <GitBranch size={14} />
          <span className="flex-1 text-left">main</span>
          <ChevronDown size={14} />
        </Button>
      </div>

      {/* Project Tree */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        <TreeNode
          id="root"
          label="Sample Project"
          icon={Folder}
          expanded={expandedNodes.has('root')}
          onToggle={() => toggleNode('root')}
        >
          <TreeNode
            id="part1"
            label="Base Plate.part"
            icon={FileCode}
            expanded={false}
            onToggle={() => {}}
          />
          <TreeNode
            id="part2"
            label="Housing.part"
            icon={FileCode}
            expanded={false}
            onToggle={() => {}}
          />
          <TreeNode
            id="assembly1"
            label="Main Assembly"
            icon={Folder}
            expanded={expandedNodes.has('assembly1')}
            onToggle={() => toggleNode('assembly1')}
          >
            <TreeNode
              id="comp1"
              label="Component 1"
              icon={FileCode}
              expanded={false}
              onToggle={() => {}}
            />
            <TreeNode
              id="comp2"
              label="Component 2"
              icon={FileCode}
              expanded={false}
              onToggle={() => {}}
            />
          </TreeNode>
        </TreeNode>
      </div>
    </div>
  );
}

interface TreeNodeProps {
  id: string;
  label: string;
  icon: any;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

function TreeNode({ id, label, icon: Icon, expanded, onToggle, children }: TreeNodeProps) {
  const hasChildren = !!children;

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent cursor-pointer"
        onClick={onToggle}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown size={14} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={14} className="text-muted-foreground" />
          )
        ) : (
          <div className="w-[14px]" />
        )}
        <Icon size={14} className="text-muted-foreground" />
        <span className="text-sm flex-1">{label}</span>
      </div>
      {hasChildren && expanded && <div className="ml-4">{children}</div>}
    </div>
  );
}
