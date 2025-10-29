import { useWorkspace } from '@/contexts/WorkspaceContext';
import { CommandBar } from './CommandBar';
import { LeftSidebar } from './LeftSidebar';
import { RightInspector } from './RightInspector';
import { BottomTimeline } from './BottomTimeline';
import { StatusBar } from './StatusBar';
import { Viewport } from '@components/viewport/Viewport';
import { ModelWorkspace } from '@components/workspaces/ModelWorkspace';
import { AssemblyWorkspace } from '@components/workspaces/AssemblyWorkspace';
import { DocumentWorkspace } from '@components/workspaces/DocumentWorkspace';
import { ReviewWorkspace } from '@components/workspaces/ReviewWorkspace';

export function MainLayout() {
  const { currentMode } = useWorkspace();

  const renderWorkspace = () => {
    switch (currentMode) {
      case 'model':
        return <ModelWorkspace />;
      case 'assembly':
        return <AssemblyWorkspace />;
      case 'document':
        return <DocumentWorkspace />;
      case 'review':
        return <ReviewWorkspace />;
      default:
        return <ModelWorkspace />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Top Command Bar */}
      <CommandBar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Central Viewport */}
        <div className="flex-1 flex flex-col relative">
          {renderWorkspace()}
        </div>

        {/* Right Inspector */}
        <RightInspector />
      </div>

      {/* Bottom Timeline */}
      <BottomTimeline />

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}
