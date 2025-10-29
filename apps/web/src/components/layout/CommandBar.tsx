import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { Button } from '@components/ui/Button';
import { 
  Box, 
  Boxes, 
  FileText, 
  MessageSquare, 
  Palette, 
  Settings,
  Undo2,
  Redo2,
  Search,
  Save,
  Users
} from 'lucide-react';
import type { WorkspaceMode } from '@types/index';

const workspaceModes: { mode: WorkspaceMode; icon: any; label: string }[] = [
  { mode: 'model', icon: Box, label: 'Model' },
  { mode: 'assembly', icon: Boxes, label: 'Assembly' },
  { mode: 'document', icon: FileText, label: 'Document' },
  { mode: 'review', icon: MessageSquare, label: 'Review' },
  { mode: 'render', icon: Palette, label: 'Render' },
  { mode: 'manage', icon: Settings, label: 'Manage' },
];

export function CommandBar() {
  const { currentMode, setMode } = useWorkspace();
  const { collaborators, isConnected } = useCollaboration();

  return (
    <div className="h-[60px] border-b border-border bg-card flex items-center justify-between px-4 gap-4">
      {/* Logo & Project Name */}
      <div className="flex items-center gap-4">
        <div className="text-xl font-bold">Flows</div>
        <div className="text-sm text-muted-foreground">/ Sample Project</div>
      </div>

      {/* Workspace Mode Switcher */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        {workspaceModes.map(({ mode, icon: Icon, label }) => (
          <Button
            key={mode}
            variant={currentMode === mode ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode(mode)}
            className="gap-2"
          >
            <Icon size={16} />
            <span className="hidden md:inline">{label}</span>
          </Button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" title="Undo">
          <Undo2 size={18} />
        </Button>
        <Button variant="ghost" size="icon" title="Redo">
          <Redo2 size={18} />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />

        <Button variant="ghost" size="icon" title="Command Palette">
          <Search size={18} />
        </Button>
        <Button variant="ghost" size="icon" title="Save">
          <Save size={18} />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Collaborators */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {collaborators.slice(0, 3).map((user) => (
              <div
                key={user.id}
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium border-2 border-background"
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {collaborators.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium border-2 border-background">
                +{collaborators.length - 3}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Users size={16} />
            Share
          </Button>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
        </div>
      </div>
    </div>
  );
}
