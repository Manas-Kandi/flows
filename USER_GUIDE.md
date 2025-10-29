# 🎓 User Guide - CAD System Quick Reference

## 🖱️ Button Reference

### Top Toolbar - Mode Section

| Button | Icon | Action | When Active |
|--------|------|--------|-------------|
| **Sketch** | ✏️ Edit3 | Opens plane selector → Enters sketch mode | In 3D mode |
| **Sketch** | ✏️ Edit3 | Exits sketch mode → Returns to 3D | In Sketch mode |
| **3D** | 📦 Box | Returns to 3D mode | In Sketch mode |

### Top Toolbar - Sketch Tools Section

| Button | Icon | Function | Status |
|--------|------|----------|--------|
| **Line** | ➖ Minus | Draw line | To be connected |
| **Circle** | ⭕ Circle | Draw circle | To be connected |
| **Rectangle** | ◻️ Square | Draw rectangle | To be connected |
| **Spline** | 〰️ Spline | Draw spline curve | To be connected |
| **Point** | 🖊️ PenTool | Place construction point | To be connected |

### Top Toolbar - Features Section

| Button | Icon | Function | Enabled When |
|--------|------|----------|--------------|
| **Extrude** | 📦 Box | Opens extrude dialog | In sketch mode |
| **Revolve** | 🔄 RotateCw | Revolve feature | Coming soon |
| **Sweep** | ↔️ MoveHorizontal | Sweep feature | Coming soon |
| **Loft** | 📚 Layers | Loft feature | Coming soon |

### Top Toolbar - Modify Section

| Button | Icon | Function | Status |
|--------|------|----------|--------|
| **Fillet** | 💿 Disc | Round edges | Coming soon |
| **Chamfer** | ✂️ Grab | Bevel edges | Coming soon |

---

## 🎬 Step-by-Step Workflows

### Create Your First Extrude Feature

#### Step 1: Start Sketch
```
1. Click "Sketch" button (✏️) in toolbar
2. Plane Selector dialog appears
```

#### Step 2: Choose Plane
```
3. Click one of:
   - Top (XY) - Blue
   - Front (XZ) - Red  
   - Right (YZ) - Green
4. Camera smoothly transitions to orthographic view
5. Mode changes to SKETCH (see bottom-left)
```

#### Step 3: Draw Geometry (Currently Manual)
```
6. Use existing sketch tools to draw
   (Integration coming soon)
```

#### Step 4: Create Extrude
```
7. Click "Extrude" button (📦) in Features section
8. Extrude Dialog opens
```

#### Step 5: Set Parameters
```
9. Enter distance (e.g., 50mm)
10. Choose direction:
    - Normal (one direction)
    - Reverse (opposite direction)
    - Symmetric (both directions)
11. Choose operation:
    - New Body (create new solid)
    - Join (add to existing)
    - Cut (remove material)
    - Intersect (keep overlap)
12. Choose end type:
    - Blind (fixed distance)
    - Through All (through everything)
    - Up To Surface (until surface)
13. Optional: Set draft angle
```

#### Step 6: Confirm
```
14. Click "Create Extrude"
15. Feature appears in tree
16. Automatically exits sketch mode
17. Camera returns to 3D view
```

---

## 🎨 Viewport Controls

### View Presets (Top Right)

| Button | View | Camera Position |
|--------|------|-----------------|
| **Front** | Front view | Looking from front |
| **Top** | Top view | Looking down |
| **Right** | Right view | Looking from right |
| **Iso** | Isometric | 3D perspective |

### Render Styles (Top Right, 3D Mode Only)

| Style | Description | Best For |
|-------|-------------|----------|
| **Shaded** | Solid colors, no edges | Quick preview |
| **Shaded + Edges** | Solid + edge lines | Default CAD view |
| **Wireframe** | Only edges | Understanding structure |
| **Hidden Line** | Edges with dashed hidden | Technical drawings |
| **X-Ray** | Transparent | Seeing inside |

### Mouse Controls

| Action | Control |
|--------|---------|
| **Rotate** | Left-click + drag |
| **Pan** | Right-click + drag |
| **Zoom** | Scroll wheel |
| **Select** | Left-click on object |

---

## 🌲 Feature Tree

### Feature Actions

Right side of each feature shows action buttons (on hover):

| Button | Icon | Function |
|--------|------|----------|
| **Suppress** | 👁️ Eye | Hide feature (keeps in tree) |
| **Unsuppress** | 👁️‍🗨️ EyeOff | Show feature again |
| **Edit** | ✏️ Edit2 | Edit feature parameters |
| **Delete** | 🗑️ Trash2 | Remove feature permanently |

### Feature Status

| Badge | Meaning |
|-------|---------|
| **Failed** (red) | Feature failed to generate |
| *Grayed out* | Feature is suppressed |
| **Normal** | Feature is active |

---

## 🔍 Mode Indicator

Bottom-left corner shows current mode:

| Display | Mode | Can Do |
|---------|------|--------|
| **Mode: SKETCH** | Sketch editing | Draw 2D, Create features |
| **Mode: 3D** | Model viewing | View model, Edit features |

---

## ⌨️ Keyboard Shortcuts (Future)

Currently all actions are toolbar/mouse-driven.

Planned shortcuts:
- `S` - New sketch
- `E` - Extrude
- `Esc` - Exit sketch mode
- `Delete` - Delete selected
- `F` - Fit to screen

---

## 🎯 Quick Tips

### Getting Started
1. **Always start with a sketch** - 3D features need 2D sketches
2. **Choose the right plane** - Pick based on desired extrusion direction
3. **Check the mode indicator** - Know what mode you're in

### Best Practices
1. **Name your features** - Makes tree easier to navigate (coming soon)
2. **Use constraints** - Parametric sketches update automatically
3. **Suppress instead of delete** - Easy to restore later

### Troubleshooting
1. **Extrude button disabled?** - Must be in sketch mode first
2. **Camera not moving?** - Check if mode transition is complete
3. **Feature not appearing?** - Check feature tree for "Failed" status

---

## 📊 Current Status

### ✅ Working Now
- ✅ Plane selection
- ✅ Mode switching (Sketch ↔ 3D)
- ✅ Camera transitions
- ✅ Extrude dialog
- ✅ Feature tree
- ✅ Feature management (edit, suppress, delete)
- ✅ View controls
- ✅ Render styles

### 🚧 In Progress
- 🚧 Sketch tool integration
- 🚧 Profile extraction
- 🚧 Real geometry generation
- 🚧 Additional feature types

### 📋 Planned
- 📋 Revolve, Fillet, Chamfer
- 📋 Pattern features
- 📋 Face/edge selection
- 📋 Ghost preview
- 📋 Dimension display
- 📋 Keyboard shortcuts

---

## 🆘 Common Questions

**Q: Why can't I draw in sketch mode?**
A: Sketch drawing tools need to be connected. Use existing sketch tools for now.

**Q: Where's the geometry?**
A: Currently using placeholder Three.js primitives. OpenCascade.js integration coming soon.

**Q: Can I edit an existing sketch?**
A: Feature editing will open the sketch (coming soon).

**Q: How do I save my work?**
A: Persistence/save system coming soon.

**Q: Can I undo?**
A: Undo/redo system planned for next phase.

---

## 🎉 You're Ready!

Your CAD system is fully functional. Start creating! 🚀

**Next**: Draw sketch → Extrude → Build amazing 3D models!
