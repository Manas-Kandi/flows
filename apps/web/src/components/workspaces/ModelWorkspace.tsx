import { Viewport } from '@components/viewport/Viewport';
import { ModelToolbar } from './ModelToolbar';

export function ModelWorkspace() {
  return (
    <div className="w-full h-full flex flex-col">
      <ModelToolbar />
      <div className="flex-1">
        <Viewport />
      </div>
    </div>
  );
}
