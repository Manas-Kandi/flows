import { Activity, Wifi, WifiOff } from 'lucide-react';
import { useCollaboration } from '@/contexts/CollaborationContext';

export function StatusBar() {
  const { isConnected } = useCollaboration();

  return (
    <div className="h-[28px] border-t border-border bg-card flex items-center justify-between px-4 text-xs">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi size={12} className="text-green-500" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-red-500" />
              <span>Disconnected</span>
            </>
          )}
        </div>
        <div className="w-px h-4 bg-border" />
        <span className="text-muted-foreground">Units: mm</span>
        <div className="w-px h-4 bg-border" />
        <span className="text-muted-foreground">Grid: 10mm</span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity size={12} />
          <span>Ready</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <span className="text-muted-foreground font-mono">X: 0.00 Y: 0.00 Z: 0.00</span>
      </div>
    </div>
  );
}
