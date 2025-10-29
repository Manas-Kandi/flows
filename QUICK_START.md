# Quick Start Guide - 2D-3D CAD Integration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm 8+

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Build the CAD kernel package
pnpm --filter @flows/cad-kernel build

# 3. Start development server
pnpm --filter @flows/web dev
```

The dev server will start at `http://localhost:5173`

---

## 🎯 First Steps

### 1. Import the UnifiedViewport

Replace the existing Viewport component with the new UnifiedViewport:

```typescript
// apps/web/src/App.tsx
import { UnifiedViewport } from './components/viewport/UnifiedViewport';

function App() {
  return (
    <div className="h-screen w-screen">
      <UnifiedViewport />
    </div>
  );
}
```

### 2. Add Feature Tree Sidebar

```typescript
import { UnifiedViewport } from './components/viewport/UnifiedViewport';
import { FeatureTree } from './components/model/FeatureTree';

function App() {
  return (
    <div className="h-screen w-screen flex">
      {/* Main viewport */}
      <div className="flex-1">
        <UnifiedViewport />
      </div>
      
      {/* Feature tree sidebar */}
      <div className="w-64">
        <FeatureTree />
      </div>
    </div>
  );
}
```

---

## 🔧 Basic Usage

### Creating a Sketch

```typescript
import { useViewportStore } from './stores/viewportStore';
import { StandardPlanes } from '@flows/cad-kernel';

function SketchButton() {
  const { enterSketchMode } = useViewportStore();
  
  const handleNewSketch = () => {
    // Enter sketch mode on the top plane
    enterSketchMode(StandardPlanes.Top);
  };
  
  return <button onClick={handleNewSketch}>New Sketch</button>;
}
```

### Creating an Extrude Feature

```typescript
import { useState } from 'react';
import { useFeatureStore } from './stores/featureStore';
import { ExtrudeDialog } from './components/model/ExtrudeDialog';

function ExtrudeButton({ sketchId }: { sketchId: string }) {
  const [showDialog, setShowDialog] = useState(false);
  const { addFeature } = useFeatureStore();
  
  const handleConfirm = (parameters) => {
    const feature = {
      id: `extrude-${Date.now()}`,
      name: 'Extrude 1',
      type: 'extrude',
      sketchId,
      parameters,
      suppressed: false,
      failed: false,
      timestamp: Date.now(),
    };
    
    addFeature(feature);
    setShowDialog(false);
  };
  
  return (
    <>
      <button onClick={() => setShowDialog(true)}>Extrude</button>
      
      <ExtrudeDialog
        isOpen={showDialog}
        sketchId={sketchId}
        onConfirm={handleConfirm}
        onCancel={() => setShowDialog(false)}
      />
    </>
  );
}
```

---

## 🎨 Customizing the Viewport

### Change Render Style

```typescript
import { useViewportStore } from './stores/viewportStore';

function RenderStyleSelector() {
  const { renderStyle, setRenderStyle } = useViewportStore();
  
  return (
    <select value={renderStyle} onChange={(e) => setRenderStyle(e.target.value)}>
      <option value="shaded">Shaded</option>
      <option value="shaded-edges">Shaded with Edges</option>
      <option value="wireframe">Wireframe</option>
      <option value="hidden-line">Hidden Line</option>
      <option value="x-ray">X-Ray</option>
    </select>
  );
}
```

### Switch Camera Views

```typescript
import { useViewportStore } from './stores/viewportStore';

function ViewControls() {
  const { setViewPreset } = useViewportStore();
  
  return (
    <div>
      <button onClick={() => setViewPreset('front')}>Front</button>
      <button onClick={() => setViewPreset('top')}>Top</button>
      <button onClick={() => setViewPreset('right')}>Right</button>
      <button onClick={() => setViewPreset('iso')}>Isometric</button>
    </div>
  );
}
```

---

## 📁 Project Structure

```
apps/web/src/
├── components/
│   ├── viewport/
│   │   ├── UnifiedViewport.tsx      # Main viewport component
│   │   ├── AdaptiveCamera.tsx       # Camera controller
│   │   ├── PlaneRenderer.tsx        # Sketch plane visualization
│   │   ├── SketchRenderer.tsx       # 2D sketch rendering
│   │   ├── ModelRenderer.tsx        # 3D model rendering
│   │   └── PlaneSelector.tsx        # Plane selection dialog
│   └── model/
│       ├── FeatureTree.tsx          # Feature hierarchy display
│       └── ExtrudeDialog.tsx        # Extrude feature dialog
├── stores/
│   ├── viewportStore.ts             # Viewport state management
│   └── featureStore.ts              # Feature state management
└── rendering/
    ├── MaterialSystem.ts            # CAD materials
    └── LightingSetup.tsx            # Lighting configuration
```

---

## 🔍 Debugging

### View Current State

```typescript
import { useViewportStore } from './stores/viewportStore';
import { useFeatureStore } from './stores/featureStore';

function DebugPanel() {
  const viewport = useViewportStore();
  const features = useFeatureStore();
  
  return (
    <div className="p-4 bg-gray-100">
      <h3>Viewport Mode: {viewport.mode}</h3>
      <h3>Active Sketch: {viewport.activeSketch}</h3>
      <h3>Features: {features.featureTree.length}</h3>
    </div>
  );
}
```

### Enable Three.js DevTools

```typescript
// Add to UnifiedViewport.tsx
import { StatsGl } from '@react-three/drei';

<Canvas>
  <StatsGl />
  {/* ... rest of the scene */}
</Canvas>
```

---

## ⚠️ Current Limitations

1. **Module Resolution Errors**: The `@flows/cad-kernel` import errors will resolve after running `pnpm install`

2. **Geometry Placeholder**: Currently uses Three.js primitives instead of real BREP geometry
   - Next step: Integrate OpenCascade.js

3. **Sketch Entities**: Need to integrate with existing sketch tools
   - Connect SketchCanvas to SketchRenderer

---

## 🛠️ Next Development Steps

### Week 1-2: Integration
1. Connect existing sketch tools to new viewport
2. Integrate OpenCascade.js for real geometry
3. Implement profile extraction from actual sketches
4. Add ghost preview for features

### Week 3-4: Features
5. Implement Revolve feature
6. Add Fillet and Chamfer
7. Create Pattern features
8. Build face/edge selection system

---

## 📚 Additional Resources

- **Full Architecture**: `docs/2D_3D_INTEGRATION_ARCHITECTURE.md`
- **Complete Spec**: `CAD_SYSTEM_COMPLETE_SPEC.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`

---

## 🤝 Contributing

When adding new features:

1. **Add types** to `packages/cad-kernel/src/types.ts`
2. **Implement kernel logic** in `packages/cad-kernel/src/features/`
3. **Create UI components** in `apps/web/src/components/model/`
4. **Update stores** if needed
5. **Test** in the viewport

---

## 💡 Tips

- Use `mode` state to conditionally render UI
- All coordinates in sketch are 2D, converted to 3D via `sketchToWorld`
- Features automatically track dependencies via the dependency graph
- Use layers for z-ordering (defined in `RenderLayer` enum)

---

## ✨ You're Ready!

Run `pnpm install && pnpm dev` and start building your CAD system! 🚀
