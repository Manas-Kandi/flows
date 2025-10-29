# Feature User Behavior Specifications

Detailed UX specifications for each parametric CAD feature.

---

## 1. Sketch Tools - User Behaviors

### 1.1 Line Tool

**Activation**: Click Line button in sketch toolbar or press 'L'

**Workflow**:
1. User clicks first point (start) - shows snap indicators if near snap targets
2. Mouse moves - displays temporary line from start to cursor with length/angle annotation
3. User clicks second point (end) - line is created, remains in line tool
4. Line tool continues - previous end becomes new start (polyline mode)
5. Press ESC or Enter to exit line tool

**Visual Feedback**:
- Active line: Bright color (e.g., blue)
- Completed lines: Normal color (e.g., white)
- Snap indicators: Green circles at snap points
- Dimensions: Length in current units, angle from horizontal

**Constraints**:
- Auto-horizontal if within 5° of horizontal
- Auto-vertical if within 5° of vertical
- Auto-perpendicular to previous line if within 5° of 90°

**Keyboard Shortcuts**:
- `L`: Activate line tool
- `ESC`: Exit tool
- `Enter`: Complete polyline and exit
- `Tab`: Flip dimension input focus (length vs angle)
- Hold `Shift`: Constrain to horizontal/vertical/45°

---

### 1.2 Circle Tool

**Activation**: Click Circle button or press 'C'

**Mode 1: Center-Radius**
1. User clicks center point
2. Mouse moves - displays circle from center with radius annotation
3. User clicks to set radius - circle created
4. Tool remains active for next circle

**Mode 2: 3-Point Circle** (Shift+C)
1. User clicks first point on circumference
2. User clicks second point on circumference
3. Mouse moves - displays circle through 2 points, adjusting for cursor position
4. User clicks third point - circle created

**Visual Feedback**:
- Center point: Small cross marker
- Radius dimension: Displays as "R 50.0" or "Ø 100.0" (toggle with 'D' key)
- Active circle: Bright color with dashed preview

**Input Options**:
- Type radius value while moving mouse
- Press 'D' to toggle radius/diameter input
- Press 'Tab' to enter precise value in dialog

---

### 1.3 Rectangle Tool

**Activation**: Click Rectangle or press 'R'

**Mode 1: Corner Rectangle** (default)
1. Click first corner
2. Drag to opposite corner - displays width × height
3. Click to complete rectangle

**Mode 2: Center Rectangle** (Ctrl+R)
1. Click center point
2. Drag to corner - displays half-width × half-height
3. Click to complete

**Options**:
- Press 'F' while dragging to enable fillet corners
- Type fillet radius value
- Hold Shift to constrain to square

**Result**: Creates 4 lines + 4 perpendicular constraints + 2 equal constraints (opposite sides)

---

### 1.4 Arc Tool

**Mode 1: 3-Point Arc** (default)
1. Click start point
2. Click point on arc (defines curvature)
3. Click end point - arc created
- Shows radius value during creation

**Mode 2: Centerpoint Arc** (toggle with 'M')
1. Click center
2. Click start point (defines radius)
3. Move to set end angle - shows arc length and angle
4. Click to complete

**Mode 3: Tangent Arc** (auto-activates after line/arc)
1. Tool automatically starts tangent to previous curve
2. Move mouse to set radius and arc length
3. Click to complete - tangent constraint auto-applied

**Visual Feedback**:
- Center: Cross marker (if centerpoint mode)
- Arc: Bright color
- Dimensions: Radius, arc length, angle (configurable)

---

### 1.5 Trim Tool

**Activation**: Click Trim button or press 'T'

**Workflow**:
1. Tool activates - cursor changes to scissors icon
2. Hover over curve segment - segment highlights
3. Click to trim segment
4. If multiple intersections exist, trims to nearest
5. Repeat to trim additional segments
6. Press ESC to exit

**Smart Behavior**:
- Auto-detects all intersection points
- Splits curves at intersections
- Removes selected segment
- Updates constraint graph automatically
- Undo trims one segment at a time

**Visual Feedback**:
- Hover: Highlighted segment in yellow
- Intersection points: Small red circles
- After trim: Segment disappears with fade animation

---

### 1.6 Offset Tool

**Activation**: Click Offset or press 'O'

**Workflow**:
1. Select curves to offset (can chain-select connected curves)
2. Click to start offset
3. Move mouse to side to offset - displays preview with distance
4. Click or enter value to complete
5. Tool remains active for next offset

**Options** (right-click or toolbar):
- Chain: Automatically select connected curves
- Corner: Miter, Arc, or Extend
- Delete original: Option to remove original curves

**Input**:
- Type distance value while previewing
- Negative values offset to opposite side
- Tab for precise input dialog

**Challenge**: Complex offset with multiple curves - requires geometry kernel

---

### 1.7 Constraint Application

**Coincident Constraint**:
1. Select two points (click first, click second)
2. OR: Select point, then line/curve (point goes to nearest location on curve)
3. Constraint applied immediately
4. Visual indicator: Small triangle symbol at coincident points

**Horizontal/Vertical Constraint**:
1. Select line
2. Click Horizontal or Vertical button (or press 'H'/'V')
3. Line adjusts to exactly horizontal/vertical
4. Dimension updates
5. Symbol appears on line (=== for horizontal, ||| for vertical)

**Tangent Constraint**:
1. Select two curves (line-arc, arc-arc, line-spline, etc.)
2. Click Tangent button (or press 'T' when not in trim mode)
3. Curves adjust to be tangent at intersection
4. Tangent symbol appears at contact point

**Parallel/Perpendicular**:
1. Select two lines
2. Click Parallel (||) or Perpendicular (⊥)
3. Lines adjust angles
4. Symbol appears between lines

---

### 1.8 Dimension Tool

**Linear Dimension**:
1. Click Dimension tool or press 'D'
2. Click first point/line
3. Click second point/line
4. Move mouse to position dimension line
5. Click to place, enter value in popup
6. Press Enter - sketch updates to satisfy dimension

**Visual Elements**:
- Dimension line with arrows/ticks
- Numerical value with units
- Extension lines to entities
- Hover: Highlight dimension, show edit icon
- Double-click: Edit value

**Smart Dimensioning**:
- Point-to-point: Linear distance
- Line: Length
- Circle/Arc: Auto-detects radius vs diameter based on click location
- Two parallel lines: Distance between
- Two circles: Center-to-center distance

**Angular Dimension**:
1. Select two lines
2. Dimension tool shows angle
3. Position angular dimension arc
4. Enter value - lines rotate to satisfy

---

## 2. 3D Features - User Behaviors

### 2.1 Extrude Feature

**Activation**: 
- Select closed sketch profile(s)
- Click Extrude button or press 'E'
- Extrude dialog opens

**Dialog Layout**:
```
┌─────────────────────────────┐
│ Extrude                     │
├─────────────────────────────┤
│ Profile: [Sketch-1, Profile-1] │
│ Distance: [100___] mm       │
│ Direction: ( ) One          │
│            (●) Symmetric    │
│            ( ) Two-sided    │
│ Distance 2: [50___] mm      │ (only if two-sided)
│                             │
│ Operation:                  │
│ (●) New Body                │
│ ( ) Join                    │
│ ( ) Cut                     │
│ ( ) Intersect               │
│                             │
│ Advanced:                   │
│ └─ Draft Angle: [0___]°     │
│ └─ Flip Direction           │
│                             │
│ [Preview] [OK] [Cancel]     │
└─────────────────────────────┘
```

**Workflow**:
1. Profile auto-selected if clicked from sketch
2. User adjusts distance - live preview updates
3. Ghost geometry shows result in viewport
4. Choose operation type
5. Click OK - feature created, added to tree
6. Dialog closes

**Preview Behavior**:
- Translucent geometry (50% opacity)
- Different colors for operation:
  - New Body: Blue
  - Join: Green
  - Cut: Red
  - Intersect: Yellow
- Rotate view while preview active
- Preview updates on parameter change

**Direction Options**:
- One: Extrude in positive normal direction
- Symmetric: Equal distance both directions from sketch plane
- Two-sided: Different distances in positive/negative directions

**Advanced - To Next/To Surface**:
```
Distance Type: [Blind ▾]
Options:
- Blind (fixed distance)
- Through All
- To Next (surface)
- To Surface (select face)
- Offset from Surface
```

**Keyboard in Dialog**:
- Arrow keys: Adjust distance by 1mm
- Shift+Arrow: Adjust by 10mm
- Tab: Cycle through inputs
- Enter: Accept and close
- ESC: Cancel

---

### 2.2 Revolve Feature

**Activation**: Select profile, click Revolve or press 'V'

**Dialog**:
```
┌─────────────────────────────┐
│ Revolve                     │
├─────────────────────────────┤
│ Profile: [Sketch-1]         │
│ Axis: [Select line/edge]    │
│                             │
│ Angle: ( ) Full (360°)      │
│        (●) Partial          │
│        └─ [270___]°         │
│                             │
│ Operation: [New Body ▾]     │
│                             │
│ [Preview] [OK] [Cancel]     │
└─────────────────────────────┘
```

**Axis Selection**:
- Click line in sketch (highlights in yellow)
- Or click edge in 3D model
- Shows rotation preview with circular arrow

**Preview**:
- Shows swept surface
- Ghost geometry
- Circular arrow indicates rotation direction
- Can orbit view while previewing

**Constraints**:
- Profile cannot intersect axis (validation error)
- Profile must be on plane containing axis (or parallel)

---

### 2.3 Fillet Feature

**Activation**: 
- Click Fillet button or press 'F' (in 3D mode)
- Cursor changes to fillet icon

**Workflow**:
1. Click edges to fillet (multi-select with Ctrl/Cmd)
2. Selected edges highlight in blue
3. Dialog opens after first edge selected
4. Adjust radius - preview updates
5. Click OK to apply

**Dialog**:
```
┌─────────────────────────────┐
│ Fillet                      │
├─────────────────────────────┤
│ Edges: 3 selected           │
│ [Edit Selection]            │
│                             │
│ Type: (●) Constant Radius   │
│       ( ) Variable Radius   │
│       ( ) Face Blend        │
│       ( ) Full Round        │
│                             │
│ Radius: [5.0__] mm          │
│                             │
│ Preview Quality: ─────●───  │
│                             │
│ [Apply] [OK] [Cancel]       │
└─────────────────────────────┘
```

**Variable Radius Mode**:
- Shows list of selected edges
- Each edge has radius input:
```
Edge 1: [5.0__] mm
Edge 2: [3.0__] mm
Edge 3: [5.0__] mm
```
- Can also set as range: Start radius → End radius

**Preview**:
- Rounded edges shown in translucent blue
- Updates in real-time (may lag on complex geometry)
- Warning icon if fillet may fail
- Red X if fillet definitely fails

**Common Failures**:
- Radius too large (exceeds face size)
- Self-intersecting fillet
- Multiple edge conflicts

**Behavior on Failure**:
- Show error message with reason
- Highlight problematic edge(s)
- Suggest reduced radius
- Option: Apply partial fillet (exclude failed edges)

---

### 2.4 Hole Feature

**Activation**: 
- Click Hole Wizard or press 'H'
- Click on face to place hole

**Workflow**:
1. Click target face (highlights)
2. Click point on face for hole center
3. Hole wizard dialog opens
4. Configure hole parameters
5. Preview shows hole geometry
6. Click OK to create

**Hole Wizard Dialog**:
```
┌─────────────────────────────┐
│ Hole Wizard                 │
├─────────────────────────────┤
│ Type: [Simple ▾]            │
│   - Simple                  │
│   - Counterbore            │
│   - Countersink            │
│   - Tapped                 │
│                             │
│ Diameter: [10.0__] mm       │
│ Depth: (●) Blind [20__] mm  │
│        ( ) Through All      │
│        ( ) To Next          │
│                             │
│ Position:                   │
│ X: [25.0__] mm from edge    │
│ Y: [30.0__] mm from edge    │
│                             │
│ [OK] [Cancel]               │
└─────────────────────────────┘
```

**Counterbore Options** (add to above):
```
│ Counterbore:                │
│ Diameter: [18.0__] mm       │
│ Depth: [8.0__] mm           │
```

**Countersink Options**:
```
│ Countersink:                │
│ Diameter: [16.0__] mm       │
│ Angle: [90__]° (82/90/100/120) │
```

**Tapped Hole Options**:
```
│ Thread:                     │
│ Standard: [ISO Metric ▾]    │
│ Size: [M10 x 1.5 ▾]        │
│ Class: [6H ▾]              │
│ Display: [●] Cosmetic       │
│          [ ] Simplified     │
```

**Preview**:
- Shows hole geometry cut into face
- Thread representation (helical groove for simplified)
- Cosmetic thread just shows note

---

### 2.5 Pattern Features

**Linear Pattern Dialog**:
```
┌─────────────────────────────┐
│ Linear Pattern              │
├─────────────────────────────┤
│ Features: Extrude-1         │
│ [Edit Selection]            │
│                             │
│ Direction 1:                │
│ [Select edge/axis]          │
│ Count: [5___]               │
│ Spacing: [20.0__] mm        │
│ OR Total: [80.0__] mm       │
│                             │
│ Direction 2: [ ] Enable     │
│ ...                         │
│                             │
│ Options:                    │
│ [✓] Instances to Skip       │
│     (click pattern preview) │
│ [ ] Vary Parameters         │
│                             │
│ [Preview] [OK] [Cancel]     │
└─────────────────────────────┘
```

**Pattern Preview**:
- Shows grid of instance positions
- Can click individual instances to suppress them
- Shows count: "17 of 25 instances"
- Ghost geometry for all instances

**Circular Pattern**:
- Similar dialog
- Select rotation axis instead of direction
- Angle total or angle between
- Option: Full 360° / Partial angle

---

## 3. Assembly - User Behaviors

### 3.1 Mate Creation

**Coincident Mate**:
1. Click Mate button in assembly toolbar
2. Click first face/plane on Component A
3. Click second face/plane on Component B
4. Mate dialog shows:
```
┌─────────────────────────────┐
│ Mate                        │
├─────────────────────────────┤
│ Type: Auto-detected         │
│ (●) Coincident              │
│ ( ) Distance                │
│ ...                         │
│                             │
│ Entities:                   │
│ Face<1> @ Component-1       │
│ Face<2> @ Component-2       │
│                             │
│ Alignment:                  │
│ (●) Aligned                 │
│ ( ) Anti-Aligned            │
│                             │
│ [OK] [Cancel]               │
└─────────────────────────────┘
```
5. Components move to satisfy mate (preview)
6. Click OK - mate applied

**Smart Mates**:
- If user drags cylindrical face onto another cylindrical face:
  - Auto-creates concentric + coincident mates
  - Shows "Smart Mate" indicator
- Common patterns recognized automatically

**Mate Conflicts**:
- If new mate conflicts with existing:
```
┌──────────────────────────────┐
│ ⚠ Mate Conflict Detected     │
├──────────────────────────────┤
│ The new mate conflicts with: │
│ • Mate-3 (Distance)          │
│ • Mate-5 (Angle)             │
│                              │
│ Options:                     │
│ ( ) Suppress conflicting     │
│ ( ) Delete conflicting       │
│ (●) Cancel this mate         │
│                              │
│ [OK] [Cancel]                │
└──────────────────────────────┘
```

---

## 4. Parameter System

**Parameter Table UI**:
```
┌────────────────────────────────────────────┐
│ Parameters                                 │
├─────────┬────────┬──────────────┬──────────┤
│ Name    │ Value  │ Expression   │ Unit     │
├─────────┼────────┼──────────────┼──────────┤
│ width   │ 100.0  │              │ mm       │
│ height  │ 50.0   │ width / 2    │ mm       │
│ depth   │ 75.0   │ width * 0.75 │ mm       │
│ holes   │ 5      │              │          │
│ spacing │ 20.0   │ width / holes│ mm       │
└─────────┴────────┴──────────────┴──────────┘
[+Add] [Edit] [Delete]
```

**Adding Parameter**:
1. Click [+Add]
2. Dialog:
```
┌─────────────────────────────┐
│ Add Parameter               │
├─────────────────────────────┤
│ Name: [width_____]          │
│ Value: [100.0__]            │
│ Unit: [mm ▾]                │
│ Expression: [_________]     │
│ Comment: [_________]        │
│                             │
│ [OK] [Cancel]               │
└─────────────────────────────┘
```
3. Name must be valid identifier (alphanumeric + underscore)
4. Value or Expression (not both)
5. Click OK - parameter added

**Using Parameters**:
- In dimension input, type: `=parameterName`
- Or type expression: `=width * 2 + 10mm`
- Autocomplete suggests available parameters
- Shows evaluated value in tooltip

**Parameter Update**:
- Change parameter value
- All dependent dimensions highlight briefly
- Model regenerates
- Progress indicator if regeneration takes >500ms

---

## Summary

These behavior specifications ensure:
- **Consistency**: Similar patterns across all tools
- **Predictability**: Users learn one tool, can use others
- **Feedback**: Visual confirmation at every step
- **Error Prevention**: Validation before committing
- **Efficiency**: Keyboard shortcuts, smart defaults
- **Forgiveness**: Easy undo, clear error messages

**Next Steps**: Implement Phase 1 (Sketch Tools) using these specifications as requirements.
