import { Edit3, Box, RotateCw, Disc } from 'lucide-react';
import { useFeatureStore } from '../../stores/featureStore';

export function BottomTimeline() {
  const { featureTree } = useFeatureStore();

  const getFeatureIcon = (type: string) => {
    switch (type) {
      case 'sketch':
        return Edit3;
      case 'extrude':
        return Box;
      case 'revolve':
        return RotateCw;
      case 'fillet':
      case 'chamfer':
        return Disc;
      default:
        return Box;
    }
  };

  return (
    <div className="h-8 border-t border-border bg-card flex items-center px-3 gap-1 overflow-x-auto scrollbar-thin">
      {/* Timeline label */}
      <span className="text-xs text-muted-foreground mr-2 flex-shrink-0">History:</span>
      
      {/* Feature sequence */}
      <div className="flex items-center gap-1">
        {featureTree.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">No features yet</span>
        ) : (
          featureTree.map((feature, index) => {
            const Icon = getFeatureIcon(feature.type);
            return (
              <div
                key={feature.id}
                className="flex items-center gap-1"
              >
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                    feature.suppressed
                      ? 'bg-gray-100 text-gray-400'
                      : feature.failed
                      ? 'bg-red-100 text-red-600'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  } cursor-pointer`}
                  title={`${feature.name} (${feature.type})`}
                >
                  <Icon size={14} />
                </div>
                {index < featureTree.length - 1 && (
                  <div className="w-2 h-px bg-gray-300" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
