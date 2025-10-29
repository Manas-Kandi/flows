import { useState } from 'react';
import { ChevronLeft, Ruler, Palette, Settings, FileText } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/Tabs';

export function RightInspector() {
  const [expanded, setExpanded] = useState(true);

  if (!expanded) {
    return (
      <div className="w-12 border-l border-border bg-card flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(true)}
          className="mb-2"
        >
          <ChevronLeft size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-[320px] border-l border-border bg-card flex flex-col">
      {/* Header */}
      <div className="h-10 border-b border-border flex items-center justify-between px-3">
        <span className="text-sm font-medium">Inspector</span>
        <Button variant="ghost" size="icon" onClick={() => setExpanded(false)}>
          <ChevronLeft size={18} />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dimensions" className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-4 rounded-none border-b">
          <TabsTrigger value="dimensions" className="gap-1">
            <Ruler size={14} />
            <span className="hidden lg:inline text-xs">Dims</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1">
            <Palette size={14} />
            <span className="hidden lg:inline text-xs">Style</span>
          </TabsTrigger>
          <TabsTrigger value="properties" className="gap-1">
            <Settings size={14} />
            <span className="hidden lg:inline text-xs">Props</span>
          </TabsTrigger>
          <TabsTrigger value="metadata" className="gap-1">
            <FileText size={14} />
            <span className="hidden lg:inline text-xs">Meta</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <TabsContent value="dimensions" className="p-3 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Selection</label>
              <p className="text-sm mt-1">No entities selected</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Dimensions</label>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs w-6">X:</span>
                  <input
                    type="text"
                    className="flex-1 px-2 py-1 text-xs border rounded"
                    placeholder="0.00"
                  />
                  <span className="text-xs text-muted-foreground">mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-6">Y:</span>
                  <input
                    type="text"
                    className="flex-1 px-2 py-1 text-xs border rounded"
                    placeholder="0.00"
                  />
                  <span className="text-xs text-muted-foreground">mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-6">Z:</span>
                  <input
                    type="text"
                    className="flex-1 px-2 py-1 text-xs border rounded"
                    placeholder="0.00"
                  />
                  <span className="text-xs text-muted-foreground">mm</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Constraints</label>
              <p className="text-xs text-muted-foreground">
                Select sketch entities to view constraints
              </p>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="p-3 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Material</label>
              <select className="w-full px-2 py-1 text-xs border rounded">
                <option>Default</option>
                <option>Aluminum</option>
                <option>Steel</option>
                <option>Plastic</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" className="w-10 h-10 border rounded" />
                <input
                  type="text"
                  className="flex-1 px-2 py-1 text-xs border rounded"
                  placeholder="#CCCCCC"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Opacity</label>
              <input type="range" min="0" max="100" defaultValue="100" className="w-full" />
            </div>
          </TabsContent>

          <TabsContent value="properties" className="p-3 space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Mass:</span>
                <span className="font-mono">—</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Volume:</span>
                <span className="font-mono">—</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Surface Area:</span>
                <span className="font-mono">—</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="p-3 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Part Number</label>
              <input type="text" className="w-full px-2 py-1 text-xs border rounded" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea className="w-full px-2 py-1 text-xs border rounded" rows={3} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tags</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs border rounded"
                placeholder="Add tags..."
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
