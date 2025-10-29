import { Viewport } from '@components/viewport/Viewport';

export function AssemblyWorkspace() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="h-12 border-b border-border bg-card flex items-center px-4">
        <span className="text-sm font-medium">Assembly Workspace</span>
      </div>
      <div className="flex-1">
        <Viewport />
      </div>
    </div>
  );
}
