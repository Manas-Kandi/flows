import { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { Button } from '@components/ui/Button';
import { 
  Folder,
  ChevronDown,
  Undo2,
  Redo2,
  Save,
  Share2,
  MoreHorizontal,
  Search,
  Settings,
  Palette,
  Box,
  Boxes,
  FileText,
  MessageSquare
} from 'lucide-react';
import type { WorkspaceMode } from '../../types';

export function CommandBar() {
  const { currentMode, setMode } = useWorkspace();
  const { collaborators, isConnected } = useCollaboration();
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const workspaceModes = [
    { mode: 'model' as WorkspaceMode, icon: Box, label: 'Model' },
    { mode: 'assembly' as WorkspaceMode, icon: Boxes, label: 'Assembly' },
    { mode: 'document' as WorkspaceMode, icon: FileText, label: 'Document' },
    { mode: 'review' as WorkspaceMode, icon: MessageSquare, label: 'Review' },
  ];

  const getCurrentModeLabel = () => {
    const mode = workspaceModes.find(m => m.mode === currentMode);
    return mode ? mode.label : 'Model';
  };

  return (
    <div className="h-12 border-b border-border bg-card flex items-center px-4 gap-4">
      {/* Left: Logo & Project Navigation */}
      <div className="flex items-center gap-3">
        <div className="text-lg font-bold text-primary">Flows</div>
        
        <div className="w-px h-6 bg-border" />
        
        {/* Project Dropdown */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-2 text-sm"
            onClick={() => setShowProjectMenu(!showProjectMenu)}
          >
            <Folder size={16} />
            <span>Sample Project</span>
            <ChevronDown size={14} />
          </Button>
          
          {showProjectMenu && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Recent Projects</div>
                <button className="w-full px-3 py-2 text-sm text-left hover:bg-muted rounded flex items-center gap-2">
                  <Folder size={14} />
                  Sample Project
                </button>
                <button className="w-full px-3 py-2 text-sm text-left hover:bg-muted rounded flex items-center gap-2">
                  <Folder size={14} />
                  New Project
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">• {getCurrentModeLabel()}</div>
      </div>

      {/* Spacer to push right content */}
      <div className="flex-1" />

      {/* Right: Core Actions, Collaborators & More Menu */}
      <div className="flex items-center gap-2">
        {/* Core Actions */}
        <Button variant="ghost" size="icon" title="Undo (Ctrl+Z)">
          <Undo2 size={18} />
        </Button>
        <Button variant="ghost" size="icon" title="Redo (Ctrl+Y)">
          <Redo2 size={18} />
        </Button>
        
        <div className="w-px h-6 bg-border mx-2" />
        
        <Button variant="ghost" size="icon" title="Save (Ctrl+S)">
          <Save size={18} />
        </Button>
        <Button variant="ghost" size="icon" title="Share">
          <Share2 size={18} />
        </Button>
        
        <div className="w-px h-6 bg-border mx-2" />
        {/* Collaborators (if any) */}
        {collaborators.length > 0 && (
          <>
            <div className="flex -space-x-2">
              {collaborators.slice(0, 2).map((user) => (
                <div
                  key={user.id}
                  className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium border-2 border-background"
                  title={user.name}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {collaborators.length > 2 && (
                <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium border-2 border-background">
                  +{collaborators.length - 2}
                </div>
              )}
            </div>
            <div className="w-px h-6 bg-border" />
          </>
        )}
        
        {/* Connection Status */}
        <div
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
        
        {/* More Menu */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon"
            title="More Actions"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
          >
            <MoreHorizontal size={18} />
          </Button>
          
          {showMoreMenu && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-1">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Workspace</div>
                {workspaceModes.map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setMode(mode);
                      setShowMoreMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-muted rounded flex items-center gap-2 ${
                      currentMode === mode ? 'bg-muted font-medium' : ''
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
                
                <div className="my-1 border-t border-border" />
                
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Tools</div>
                <button className="w-full px-3 py-2 text-sm text-left hover:bg-muted rounded flex items-center gap-2">
                  <Search size={14} />
                  Command Palette
                </button>
                <button className="w-full px-3 py-2 text-sm text-left hover:bg-muted rounded flex items-center gap-2">
                  <Palette size={14} />
                  Render
                </button>
                <button className="w-full px-3 py-2 text-sm text-left hover:bg-muted rounded flex items-center gap-2">
                  <Settings size={14} />
                  Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
