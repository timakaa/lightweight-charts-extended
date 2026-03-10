# Drawing Tools Architecture - Implementation Plan

## Overview

Complete rewrite of the drawing tools system with a clean, maintainable architecture using composition, mixins, and centralized management.

## Core Requirements

### 1. Tool Primitives

- Base drawing primitive class
- Concrete implementations (Line, Rectangle, Fib Retracement, Positions)
- Mixin-based behavior composition

### 2. Drag Logic

- Draggable mixin for all tools
- Smooth dragging with coordinate conversion
- Hybrid coordinate system support (outside candle range)

### 3. Resize Logic

- Resizable mixin with handle detection
- Different handle types (corners, midpoints, endpoints)
- Handle flipping on drag-past

### 4. Preview Logic

- Live preview while drawing
- Ghost rendering before completion
- Snap-to-candle preview

### 5. Axis Labels Logic

- Price labels on Y-axis
- Time labels on X-axis
- Preview labels during drawing
- Precision-based formatting

### 6. Constraint + Shift Mixin Logic

- Shift: Horizontal/vertical constraints
- Ctrl/Meta: Snap to candle high/low/open/close
- Composable constraint system

### 7. Cursor Logic

- Dynamic cursor based on hover state
- Resize cursors for handles
- Drag cursor for body
- Crosshair for default

### 8. Draw Tools Programmatically

- API to create drawings without UI interaction
- Batch creation support
- Import/export functionality

### 9. Persistent Store (Per-Symbol)

- LocalStorage-based persistence
- Per-symbol drawing storage
- Auto-save on changes
- Load on symbol change

### 10. Precision Logic for Axis Labels

- Configurable decimal places
- Per-tool precision settings
- Dynamic precision based on price range

### 11. Undo/Redo System (NEW)

- Ctrl+Z / Cmd+Z for undo
- Ctrl+Shift+Z / Cmd+Shift+Z for redo
- Action history (last 50-100 actions)
- Action types: create, delete, move, resize, modify
- Efficient storage (only store deltas)

### 12. Tool Settings & Templates (NEW)

- Per-tool customizable settings (colors, line width, etc.)
- Template system (save/load presets)
- Backend API for template storage
- Frontend localStorage for quick access
- Settings UI panel
- Live preview of changes

---

## Architecture Design

### Directory Structure

```
drawing-tools/
├── base/
│   ├── DrawingPrimitive.js          # Base class for all drawings
│   └── DrawingManager.js            # Central manager for all drawings
├── mixins/
│   ├── DraggableMixin.js            # Drag behavior
│   ├── ResizableMixin.js            # Resize behavior
│   ├── ConstraintMixin.js           # Shift/Ctrl constraints
│   ├── AxisLabelMixin.js            # Axis label rendering
│   ├── PreviewMixin.js              # Preview rendering
│   └── SettingsMixin.js             # Tool settings support
├── primitives/
│   ├── LinePrimitive.js             # Line tool
│   ├── RectanglePrimitive.js        # Rectangle tool
│   ├── FibRetracementPrimitive.js   # Fib retracement tool
│   ├── LongPositionPrimitive.js     # Long position tool
│   └── ShortPositionPrimitive.js    # Short position tool
├── registry/
│   └── ToolRegistry.js              # Factory for creating tools
├── history/
│   ├── ActionHistory.js             # Undo/redo manager
│   └── actions/
│       ├── CreateAction.js
│       ├── DeleteAction.js
│       ├── MoveAction.js
│       ├── ResizeAction.js
│       └── ModifyAction.js
├── settings/
│   ├── ToolSettings.js              # Settings manager
│   ├── TemplateManager.js           # Template CRUD
│   └── defaultSettings.js           # Default settings per tool
└── storage/
    ├── DrawingsStore.js             # Per-symbol storage
    ├── HistoryStore.js              # Action history storage
    └── SettingsStore.js             # Settings/templates storage
```

---

## 1. Base Drawing Primitive

### DrawingPrimitive.js

```javascript
class DrawingPrimitive {
  constructor(chart, series, config = {}) {
    this.id = generateId();
    this.type = config.type; // 'line', 'rectangle', etc.
    this.chart = chart;
    this.series = series;
    this.points = []; // Array of {time, price, logicalIndex}

    // State
    this.isSelected = false;
    this.isHovered = false;
    this.isDragging = false;
    this.isResizing = false;
    this.activeHandle = null;

    // Settings (from template or defaults)
    this.settings = { ...config.settings };

    // Metadata
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }

  // Abstract methods - must be implemented by subclasses
  getHandles() {
    throw new Error("Must implement getHandles");
  }
  hitTest(point) {
    throw new Error("Must implement hitTest");
  }
  render(target) {
    throw new Error("Must implement render");
  }
  clone() {
    throw new Error("Must implement clone");
  }

  // Shared behavior
  setSelected(selected) {
    this.isSelected = selected;
    this.requestUpdate();
  }

  setHovered(hovered) {
    this.isHovered = hovered;
    this.requestUpdate();
  }

  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    this.updatedAt = Date.now();
    this.requestUpdate();
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      points: this.points,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromJSON(data, chart, series) {
    // Implemented by subclasses
  }

  // Mixin support
  applyMixins(...mixins) {
    mixins.forEach((mixin) => mixin(this));
  }

  requestUpdate() {
    this.chart?.requestUpdate?.();
  }
}
```

---

## 2. Behavior Mixins

### DraggableMixin.js

```javascript
export const DraggableMixin = (primitive) => {
  let dragStartPoint = null;
  let originalPoints = [];

  primitive.startDrag = (point) => {
    dragStartPoint = point;
    originalPoints = primitive.points.map((p) => ({ ...p }));
    primitive.isDragging = true;
  };

  primitive.updateDrag = (point, keyState = {}) => {
    if (!dragStartPoint) return;

    const deltaTime = point.time - dragStartPoint.time;
    const deltaPrice = point.price - dragStartPoint.price;

    primitive.points = originalPoints.map((p) => ({
      time: p.time + deltaTime,
      price: p.price + deltaPrice,
      logicalIndex:
        p.logicalIndex + (point.logicalIndex - dragStartPoint.logicalIndex),
    }));

    primitive.updatedAt = Date.now();
    primitive.requestUpdate();
  };

  primitive.endDrag = () => {
    primitive.isDragging = false;
    dragStartPoint = null;
    originalPoints = [];
    return { type: "move", before: originalPoints, after: primitive.points };
  };
};
```

### ResizableMixin.js

```javascript
export const ResizableMixin = (primitive) => {
  let resizeStartPoint = null;
  let originalPoints = [];

  primitive.startResize = (handle, point) => {
    resizeStartPoint = point;
    originalPoints = primitive.points.map((p) => ({ ...p }));
    primitive.isResizing = true;
    primitive.activeHandle = handle;
  };

  primitive.updateResize = (point, keyState = {}) => {
    if (!resizeStartPoint || !primitive.activeHandle) return;

    // Apply constraints if needed
    const constrainedPoint =
      primitive.applyConstraints?.(point, keyState) || point;

    // Update the point being resized
    const handleIndex = primitive.activeHandle.index;
    primitive.points[handleIndex] = constrainedPoint;

    primitive.updatedAt = Date.now();
    primitive.requestUpdate();
  };

  primitive.endResize = () => {
    primitive.isResizing = false;
    primitive.activeHandle = null;
    resizeStartPoint = null;
    const action = {
      type: "resize",
      before: originalPoints,
      after: primitive.points,
    };
    originalPoints = [];
    return action;
  };
};
```

### ConstraintMixin.js

```javascript
export const ConstraintMixin = (primitive) => {
  primitive.applyConstraints = (point, keyState) => {
    let constrainedPoint = { ...point };

    // Shift: Horizontal constraint (lock price)
    if (keyState.shift && primitive.points.length > 0) {
      const referencePoint = primitive.points[0];
      constrainedPoint.price = referencePoint.price;
    }

    // Ctrl/Meta: Snap to candle
    if (keyState.ctrl || keyState.meta) {
      const candle = primitive.findNearestCandle(point);
      if (candle) {
        constrainedPoint = primitive.snapToCandle(point, candle);
      }
    }

    return constrainedPoint;
  };

  primitive.snapToCandle = (point, candle) => {
    const prices = [candle.open, candle.high, candle.low, candle.close];
    const closestPrice = prices.reduce((closest, price) =>
      Math.abs(price - point.price) < Math.abs(closest - point.price)
        ? price
        : closest,
    );

    return { ...point, price: closestPrice, time: candle.time };
  };

  primitive.findNearestCandle = (point) => {
    // Implementation depends on candle data access
    return null;
  };
};
```

### AxisLabelMixin.js

```javascript
export const AxisLabelMixin = (primitive) => {
  primitive.getAxisLabels = () => {
    const labels = [];

    // Price labels (Y-axis)
    primitive.points.forEach((point) => {
      labels.push({
        type: "price",
        value: point.price,
        formatted: primitive.formatPrice(point.price),
      });
    });

    // Time labels (X-axis) - optional
    if (primitive.settings.showTimeLabels) {
      primitive.points.forEach((point) => {
        labels.push({
          type: "time",
          value: point.time,
          formatted: primitive.formatTime(point.time),
        });
      });
    }

    return labels;
  };

  primitive.formatPrice = (price) => {
    const precision = primitive.settings.precision || 2;
    return price.toFixed(precision);
  };

  primitive.formatTime = (time) => {
    return new Date(time * 1000).toLocaleString();
  };
};
```

### PreviewMixin.js

```javascript
export const PreviewMixin = (primitive) => {
  primitive.renderPreview = (target, previewPoint) => {
    // Render ghost/preview version of the drawing
    const originalSettings = { ...primitive.settings };

    // Apply preview styling
    primitive.settings = {
      ...primitive.settings,
      opacity: 0.5,
      lineStyle: "dashed",
    };

    // Render with preview point
    const originalPoints = [...primitive.points];
    primitive.points = [...primitive.points, previewPoint];
    primitive.render(target);

    // Restore original state
    primitive.points = originalPoints;
    primitive.settings = originalSettings;
  };
};
```

### SettingsMixin.js

```javascript
export const SettingsMixin = (primitive) => {
  primitive.getSettingsSchema = () => {
    // Return schema for settings UI
    return {
      color: { type: "color", default: "#2962FF", label: "Line Color" },
      lineWidth: {
        type: "number",
        default: 2,
        min: 1,
        max: 10,
        label: "Line Width",
      },
      lineStyle: {
        type: "select",
        options: ["solid", "dashed", "dotted"],
        default: "solid",
        label: "Line Style",
      },
      showLabels: { type: "boolean", default: true, label: "Show Labels" },
      precision: {
        type: "number",
        default: 2,
        min: 0,
        max: 8,
        label: "Decimal Places",
      },
    };
  };

  primitive.validateSettings = (settings) => {
    const schema = primitive.getSettingsSchema();
    const validated = {};

    Object.keys(schema).forEach((key) => {
      const rule = schema[key];
      const value = settings[key] ?? rule.default;

      // Type validation
      if (rule.type === "number") {
        validated[key] = Math.max(
          rule.min || -Infinity,
          Math.min(rule.max || Infinity, value),
        );
      } else {
        validated[key] = value;
      }
    });

    return validated;
  };
};
```

---

## 3. Drawing Manager

### DrawingManager.js

```javascript
class DrawingManager {
  constructor(chart, series, options = {}) {
    this.chart = chart;
    this.series = series;
    this.drawings = new Map(); // id -> drawing
    this.selectedId = null;
    this.hoveredId = null;
    this.currentTool = null;
    this.previewDrawing = null;
    this.isDrawing = false;

    // History for undo/redo
    this.history = new ActionHistory(options.historyLimit || 100);

    // Settings manager
    this.settings = new ToolSettings();

    // Event emitter
    this.listeners = new Map();

    this.setupEventHandlers();
  }

  // ===== CRUD Operations =====

  addDrawing(drawing, recordHistory = true) {
    this.drawings.set(drawing.id, drawing);

    if (recordHistory) {
      this.history.push(new CreateAction(drawing));
    }

    this.emit("change", { type: "add", drawing });
    this.requestUpdate();
    return drawing;
  }

  removeDrawing(id, recordHistory = true) {
    const drawing = this.drawings.get(id);
    if (!drawing) return null;

    this.drawings.delete(id);

    if (recordHistory) {
      this.history.push(new DeleteAction(drawing));
    }

    if (this.selectedId === id) this.selectedId = null;
    if (this.hoveredId === id) this.hoveredId = null;

    this.emit("change", { type: "remove", drawing });
    this.requestUpdate();
    return drawing;
  }

  getDrawing(id) {
    return this.drawings.get(id);
  }

  getAllDrawings() {
    return Array.from(this.drawings.values());
  }

  clearAll(recordHistory = true) {
    const allDrawings = this.getAllDrawings();

    if (recordHistory && allDrawings.length > 0) {
      this.history.push(new DeleteAction(allDrawings));
    }

    this.drawings.clear();
    this.selectedId = null;
    this.hoveredId = null;

    this.emit("change", { type: "clear" });
    this.requestUpdate();
  }

  // ===== Tool Management =====

  setTool(toolName) {
    this.currentTool = toolName;
    this.cancelDrawing();
    this.emit("toolChange", toolName);
  }

  startDrawing(point) {
    if (!this.currentTool) return;

    const settings = this.settings.getToolSettings(this.currentTool);
    this.previewDrawing = toolRegistry.create(
      this.currentTool,
      this.chart,
      this.series,
      { settings },
    );
    this.previewDrawing.points = [point];
    this.isDrawing = true;

    this.emit("drawingStart", this.previewDrawing);
  }

  updatePreview(point, keyState = {}) {
    if (!this.isDrawing || !this.previewDrawing) return;

    // Apply constraints
    const constrainedPoint =
      this.previewDrawing.applyConstraints?.(point, keyState) || point;

    // Update preview
    if (this.previewDrawing.points.length === 1) {
      this.previewDrawing.points = [
        this.previewDrawing.points[0],
        constrainedPoint,
      ];
    } else {
      this.previewDrawing.points[this.previewDrawing.points.length - 1] =
        constrainedPoint;
    }

    this.requestUpdate();
  }

  finishDrawing() {
    if (!this.isDrawing || !this.previewDrawing) return null;

    const drawing = this.previewDrawing;
    this.previewDrawing = null;
    this.isDrawing = false;

    // Only add if drawing is valid (has required points)
    if (this.isValidDrawing(drawing)) {
      this.addDrawing(drawing);
      this.selectDrawing(drawing.id);
      this.emit("drawingComplete", drawing);
      return drawing;
    }

    return null;
  }

  cancelDrawing() {
    this.previewDrawing = null;
    this.isDrawing = false;
    this.requestUpdate();
  }

  isValidDrawing(drawing) {
    // Check if drawing has minimum required points
    const minPoints = {
      line: 2,
      rectangle: 2,
      fibRetracement: 2,
      longPosition: 2,
      shortPosition: 2,
    };

    return drawing.points.length >= (minPoints[drawing.type] || 2);
  }

  // ===== Interaction Handlers =====

  handleClick(point) {
    if (this.isDrawing) {
      // Continue or finish drawing
      if (
        this.previewDrawing.points.length >=
        this.getRequiredPoints(this.currentTool)
      ) {
        this.finishDrawing();
      }
    } else {
      // Selection logic
      if (this.hoveredId) {
        this.selectDrawing(this.hoveredId);
      } else {
        this.selectDrawing(null);
      }
    }
  }

  handleMouseDown(point) {
    if (this.isDrawing) {
      this.startDrawing(point);
      return;
    }

    // Check for resize handle
    if (this.selectedId) {
      const drawing = this.getDrawing(this.selectedId);
      const handle = this.getHandleAtPoint(drawing, point);

      if (handle) {
        drawing.startResize(handle, point);
        return;
      }
    }

    // Check for drag
    if (this.hoveredId) {
      const drawing = this.getDrawing(this.hoveredId);
      drawing.startDrag(point);
    }
  }

  handleMouseMove(point, keyState = {}) {
    if (this.isDrawing) {
      this.updatePreview(point, keyState);
      return;
    }

    // Handle resize
    const selectedDrawing = this.selectedId
      ? this.getDrawing(this.selectedId)
      : null;
    if (selectedDrawing?.isResizing) {
      selectedDrawing.updateResize(point, keyState);
      return;
    }

    // Handle drag
    if (selectedDrawing?.isDragging) {
      selectedDrawing.updateDrag(point, keyState);
      return;
    }

    // Update hover state
    this.updateHover(point);
  }

  handleMouseUp() {
    const selectedDrawing = this.selectedId
      ? this.getDrawing(this.selectedId)
      : null;

    if (selectedDrawing?.isResizing) {
      const action = selectedDrawing.endResize();
      this.history.push(
        new ResizeAction(selectedDrawing.id, action.before, action.after),
      );
      this.emit("change", { type: "resize", drawing: selectedDrawing });
    }

    if (selectedDrawing?.isDragging) {
      const action = selectedDrawing.endDrag();
      this.history.push(
        new MoveAction(selectedDrawing.id, action.before, action.after),
      );
      this.emit("change", { type: "move", drawing: selectedDrawing });
    }
  }

  handleKeyDown(event) {
    // Undo: Ctrl+Z / Cmd+Z
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "z" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      this.undo();
      return;
    }

    // Redo: Ctrl+Shift+Z / Cmd+Shift+Z
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "z" &&
      event.shiftKey
    ) {
      event.preventDefault();
      this.redo();
      return;
    }

    // Delete: Backspace / Delete
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      this.deleteSelected();
      return;
    }

    // Escape: Cancel drawing or deselect
    if (event.key === "Escape") {
      if (this.isDrawing) {
        this.cancelDrawing();
      } else {
        this.selectDrawing(null);
      }
    }
  }

  // ===== State Management =====

  selectDrawing(id) {
    if (this.selectedId === id) return;

    // Deselect previous
    if (this.selectedId) {
      const prev = this.getDrawing(this.selectedId);
      prev?.setSelected(false);
    }

    this.selectedId = id;

    // Select new
    if (id) {
      const drawing = this.getDrawing(id);
      drawing?.setSelected(true);
    }

    this.emit("selectionChange", id);
    this.requestUpdate();
  }

  updateHover(point) {
    let newHoveredId = null;

    // Find first drawing that contains point
    for (const drawing of this.drawings.values()) {
      if (drawing.hitTest(point)) {
        newHoveredId = drawing.id;
        break;
      }
    }

    if (this.hoveredId !== newHoveredId) {
      // Clear previous hover
      if (this.hoveredId) {
        const prev = this.getDrawing(this.hoveredId);
        prev?.setHovered(false);
      }

      this.hoveredId = newHoveredId;

      // Set new hover
      if (newHoveredId) {
        const drawing = this.getDrawing(newHoveredId);
        drawing?.setHovered(true);
      }

      this.emit("hoverChange", newHoveredId);
      this.requestUpdate();
    }
  }

  deleteSelected() {
    if (this.selectedId) {
      this.removeDrawing(this.selectedId);
    }
  }

  // ===== Undo/Redo =====

  undo() {
    const action = this.history.undo();
    if (!action) return;

    action.undo(this);
    this.emit("undo", action);
    this.requestUpdate();
  }

  redo() {
    const action = this.history.redo();
    if (!action) return;

    action.redo(this);
    this.emit("redo", action);
    this.requestUpdate();
  }

  canUndo() {
    return this.history.canUndo();
  }

  canRedo() {
    return this.history.canRedo();
  }

  // ===== Persistence =====

  serialize() {
    return {
      drawings: this.getAllDrawings().map((d) => d.toJSON()),
      version: "1.0",
    };
  }

  deserialize(data) {
    this.clearAll(false); // Don't record in history

    if (!data || !data.drawings) return;

    data.drawings.forEach((drawingData) => {
      const PrimitiveClass = toolRegistry.getPrimitiveClass(drawingData.type);
      if (PrimitiveClass) {
        const drawing = PrimitiveClass.fromJSON(
          drawingData,
          this.chart,
          this.series,
        );
        this.addDrawing(drawing, false); // Don't record in history
      }
    });
  }

  // ===== Helpers =====

  getHandleAtPoint(drawing, point) {
    if (!drawing) return null;

    const handles = drawing.getHandles();
    for (const handle of handles) {
      if (this.isPointNearHandle(point, handle.point)) {
        return handle;
      }
    }

    return null;
  }

  isPointNearHandle(point, handlePoint, threshold = 10) {
    const dx = Math.abs(point.x - handlePoint.x);
    const dy = Math.abs(point.y - handlePoint.y);
    return dx <= threshold && dy <= threshold;
  }

  getRequiredPoints(toolType) {
    const requirements = {
      line: 2,
      rectangle: 2,
      fibRetracement: 2,
      longPosition: 2,
      shortPosition: 2,
    };
    return requirements[toolType] || 2;
  }

  requestUpdate() {
    this.chart?.requestUpdate?.();
  }

  // ===== Event System =====

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach((callback) => callback(data));
  }

  destroy() {
    this.clearAll(false);
    this.listeners.clear();
  }
}
```

---

## 4. Action History System

### ActionHistory.js

```javascript
class ActionHistory {
  constructor(limit = 100) {
    this.limit = limit;
    this.undoStack = [];
    this.redoStack = [];
  }

  push(action) {
    this.undoStack.push(action);

    // Clear redo stack when new action is performed
    this.redoStack = [];

    // Maintain limit
    if (this.undoStack.length > this.limit) {
      this.undoStack.shift();
    }
  }

  undo() {
    if (this.undoStack.length === 0) return null;

    const action = this.undoStack.pop();
    this.redoStack.push(action);

    return action;
  }

  redo() {
    if (this.redoStack.length === 0) return null;

    const action = this.redoStack.pop();
    this.undoStack.push(action);

    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  serialize() {
    return {
      undoStack: this.undoStack.map((a) => a.toJSON()),
      redoStack: this.redoStack.map((a) => a.toJSON()),
    };
  }
}
```

### Action Classes

#### CreateAction.js

```javascript
class CreateAction {
  constructor(drawing) {
    this.type = "create";
    this.drawingData = drawing.toJSON();
  }

  undo(manager) {
    manager.removeDrawing(this.drawingData.id, false);
  }

  redo(manager) {
    const PrimitiveClass = toolRegistry.getPrimitiveClass(
      this.drawingData.type,
    );
    const drawing = PrimitiveClass.fromJSON(
      this.drawingData,
      manager.chart,
      manager.series,
    );
    manager.addDrawing(drawing, false);
  }

  toJSON() {
    return { type: this.type, drawingData: this.drawingData };
  }
}
```

#### DeleteAction.js

```javascript
class DeleteAction {
  constructor(drawings) {
    this.type = "delete";
    this.drawingsData = Array.isArray(drawings)
      ? drawings.map((d) => d.toJSON())
      : [drawings.toJSON()];
  }

  undo(manager) {
    this.drawingsData.forEach((data) => {
      const PrimitiveClass = toolRegistry.getPrimitiveClass(data.type);
      const drawing = PrimitiveClass.fromJSON(
        data,
        manager.chart,
        manager.series,
      );
      manager.addDrawing(drawing, false);
    });
  }

  redo(manager) {
    this.drawingsData.forEach((data) => {
      manager.removeDrawing(data.id, false);
    });
  }

  toJSON() {
    return { type: this.type, drawingsData: this.drawingsData };
  }
}
```

#### MoveAction.js

```javascript
class MoveAction {
  constructor(drawingId, beforePoints, afterPoints) {
    this.type = "move";
    this.drawingId = drawingId;
    this.beforePoints = beforePoints;
    this.afterPoints = afterPoints;
  }

  undo(manager) {
    const drawing = manager.getDrawing(this.drawingId);
    if (drawing) {
      drawing.points = this.beforePoints;
      drawing.requestUpdate();
    }
  }

  redo(manager) {
    const drawing = manager.getDrawing(this.drawingId);
    if (drawing) {
      drawing.points = this.afterPoints;
      drawing.requestUpdate();
    }
  }

  toJSON() {
    return {
      type: this.type,
      drawingId: this.drawingId,
      beforePoints: this.beforePoints,
      afterPoints: this.afterPoints,
    };
  }
}
```

#### ResizeAction.js

```javascript
class ResizeAction {
  constructor(drawingId, beforePoints, afterPoints) {
    this.type = "resize";
    this.drawingId = drawingId;
    this.beforePoints = beforePoints;
    this.afterPoints = afterPoints;
  }

  undo(manager) {
    const drawing = manager.getDrawing(this.drawingId);
    if (drawing) {
      drawing.points = this.beforePoints;
      drawing.requestUpdate();
    }
  }

  redo(manager) {
    const drawing = manager.getDrawing(this.drawingId);
    if (drawing) {
      drawing.points = this.afterPoints;
      drawing.requestUpdate();
    }
  }

  toJSON() {
    return {
      type: this.type,
      drawingId: this.drawingId,
      beforePoints: this.beforePoints,
      afterPoints: this.afterPoints,
    };
  }
}
```

#### ModifyAction.js

```javascript
class ModifyAction {
  constructor(drawingId, beforeSettings, afterSettings) {
    this.type = "modify";
    this.drawingId = drawingId;
    this.beforeSettings = beforeSettings;
    this.afterSettings = afterSettings;
  }

  undo(manager) {
    const drawing = manager.getDrawing(this.drawingId);
    if (drawing) {
      drawing.updateSettings(this.beforeSettings);
    }
  }

  redo(manager) {
    const drawing = manager.getDrawing(this.drawingId);
    if (drawing) {
      drawing.updateSettings(this.afterSettings);
    }
  }

  toJSON() {
    return {
      type: this.type,
      drawingId: this.drawingId,
      beforeSettings: this.beforeSettings,
      afterSettings: this.afterSettings,
    };
  }
}
```

---

## 5. Tool Settings & Templates

### ToolSettings.js

```javascript
class ToolSettings {
  constructor() {
    this.currentSettings = new Map(); // toolType -> settings
    this.templates = new Map(); // templateId -> template
    this.activeTemplates = new Map(); // toolType -> templateId

    this.loadFromStorage();
  }

  // Get current settings for a tool
  getToolSettings(toolType) {
    if (!this.currentSettings.has(toolType)) {
      // Load default settings
      const defaults = defaultSettings[toolType] || {};
      this.currentSettings.set(toolType, { ...defaults });
    }

    return { ...this.currentSettings.get(toolType) };
  }

  // Update settings for a tool
  updateToolSettings(toolType, settings) {
    const current = this.getToolSettings(toolType);
    const updated = { ...current, ...settings };

    this.currentSettings.set(toolType, updated);
    this.saveToStorage();

    return updated;
  }

  // Reset to default settings
  resetToolSettings(toolType) {
    const defaults = defaultSettings[toolType] || {};
    this.currentSettings.set(toolType, { ...defaults });
    this.saveToStorage();

    return defaults;
  }

  // Template management
  saveTemplate(name, toolType, settings) {
    const template = {
      id: generateId(),
      name,
      toolType,
      settings: { ...settings },
      createdAt: Date.now(),
    };

    this.templates.set(template.id, template);
    this.saveToStorage();

    // Optionally sync to backend
    this.syncTemplateToBackend(template);

    return template;
  }

  loadTemplate(templateId) {
    return this.templates.get(templateId);
  }

  applyTemplate(templateId) {
    const template = this.loadTemplate(templateId);
    if (!template) return null;

    this.updateToolSettings(template.toolType, template.settings);
    this.activeTemplates.set(template.toolType, templateId);
    this.saveToStorage();

    return template;
  }

  deleteTemplate(templateId) {
    const template = this.templates.get(templateId);
    if (!template) return false;

    this.templates.delete(templateId);

    // Remove from active if it was active
    if (this.activeTemplates.get(template.toolType) === templateId) {
      this.activeTemplates.delete(template.toolType);
    }

    this.saveToStorage();

    // Optionally sync to backend
    this.deleteTemplateFromBackend(templateId);

    return true;
  }

  getTemplatesForTool(toolType) {
    return Array.from(this.templates.values()).filter(
      (t) => t.toolType === toolType,
    );
  }

  getAllTemplates() {
    return Array.from(this.templates.values());
  }

  // Storage
  saveToStorage() {
    const data = {
      currentSettings: Object.fromEntries(this.currentSettings),
      templates: Object.fromEntries(this.templates),
      activeTemplates: Object.fromEntries(this.activeTemplates),
    };

    localStorage.setItem("drawing_tool_settings", JSON.stringify(data));
  }

  loadFromStorage() {
    const stored = localStorage.getItem("drawing_tool_settings");
    if (!stored) return;

    try {
      const data = JSON.parse(stored);

      if (data.currentSettings) {
        this.currentSettings = new Map(Object.entries(data.currentSettings));
      }

      if (data.templates) {
        this.templates = new Map(Object.entries(data.templates));
      }

      if (data.activeTemplates) {
        this.activeTemplates = new Map(Object.entries(data.activeTemplates));
      }
    } catch (error) {
      console.error("Failed to load settings from storage:", error);
    }
  }

  // Backend sync (optional)
  async syncTemplateToBackend(template) {
    try {
      await fetch("/api/drawing-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });
    } catch (error) {
      console.error("Failed to sync template to backend:", error);
    }
  }

  async deleteTemplateFromBackend(templateId) {
    try {
      await fetch(`/api/drawing-templates/${templateId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to delete template from backend:", error);
    }
  }

  async loadTemplatesFromBackend() {
    try {
      const response = await fetch("/api/drawing-templates");
      const templates = await response.json();

      templates.forEach((template) => {
        this.templates.set(template.id, template);
      });

      this.saveToStorage();
    } catch (error) {
      console.error("Failed to load templates from backend:", error);
    }
  }
}
```

### defaultSettings.js

```javascript
export const defaultSettings = {
  line: {
    color: "#2962FF",
    lineWidth: 2,
    lineStyle: "solid",
    showLabels: true,
    showEndpoints: true,
    precision: 2,
  },

  rectangle: {
    borderColor: "#2962FF",
    fillColor: "#2962FF33",
    borderWidth: 2,
    borderStyle: "solid",
    showLabels: true,
    showHandles: true,
    precision: 2,
  },

  fibRetracement: {
    lineColor: "#787B86",
    lineWidth: 1,
    lineStyle: "solid",
    showLabels: true,
    showLevels: true,
    levels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1],
    levelColors: {
      0: "#787B86",
      0.236: "#F23645",
      0.382: "#FF9800",
      0.5: "#089981",
      0.618: "#2962FF",
      0.786: "#9C27B0",
      1: "#787B86",
    },
    precision: 2,
  },

  longPosition: {
    entryColor: "#089981",
    stopLossColor: "#F23645",
    takeProfitColor: "#2962FF",
    lineWidth: 2,
    lineStyle: "solid",
    showLabels: true,
    showRiskReward: true,
    precision: 2,
  },

  shortPosition: {
    entryColor: "#F23645",
    stopLossColor: "#089981",
    takeProfitColor: "#2962FF",
    lineWidth: 2,
    lineStyle: "solid",
    showLabels: true,
    showRiskReward: true,
    precision: 2,
  },
};
```

---

## 6. Storage System

### DrawingsStore.js (Per-Symbol Persistence)

```javascript
const STORAGE_KEY = "chart_drawings_v2";

export class DrawingsStore {
  // Get all drawings for a symbol
  static get(symbol) {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return all[symbol] || { drawings: [], version: "1.0" };
    } catch (error) {
      console.error("Failed to load drawings:", error);
      return { drawings: [], version: "1.0" };
    }
  }

  // Save drawings for a symbol
  static set(symbol, data) {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      all[symbol] = {
        ...data,
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return true;
    } catch (error) {
      console.error("Failed to save drawings:", error);
      return false;
    }
  }

  // Clear drawings for a symbol
  static clear(symbol) {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      delete all[symbol];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return true;
    } catch (error) {
      console.error("Failed to clear drawings:", error);
      return false;
    }
  }

  // Get all symbols that have drawings
  static getAllSymbols() {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return Object.keys(all);
    } catch (error) {
      console.error("Failed to get symbols:", error);
      return [];
    }
  }

  // Export all drawings (for backup)
  static exportAll() {
    try {
      const all = localStorage.getItem(STORAGE_KEY);
      return all || "{}";
    } catch (error) {
      console.error("Failed to export drawings:", error);
      return "{}";
    }
  }

  // Import drawings (from backup)
  static importAll(data) {
    try {
      const parsed = JSON.parse(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return true;
    } catch (error) {
      console.error("Failed to import drawings:", error);
      return false;
    }
  }
}
```

### HistoryStore.js (Action History Persistence)

```javascript
const HISTORY_KEY = "chart_history_v2";
const MAX_HISTORY_SIZE = 100; // Limit per symbol

export class HistoryStore {
  // Get history for a symbol
  static get(symbol) {
    try {
      const all = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
      return all[symbol] || { undoStack: [], redoStack: [] };
    } catch (error) {
      console.error("Failed to load history:", error);
      return { undoStack: [], redoStack: [] };
    }
  }

  // Save history for a symbol
  static set(symbol, history) {
    try {
      const all = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");

      // Limit history size
      const limitedHistory = {
        undoStack: history.undoStack.slice(-MAX_HISTORY_SIZE),
        redoStack: history.redoStack.slice(-MAX_HISTORY_SIZE),
      };

      all[symbol] = {
        ...limitedHistory,
        updatedAt: Date.now(),
      };

      localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
      return true;
    } catch (error) {
      console.error("Failed to save history:", error);
      return false;
    }
  }

  // Clear history for a symbol
  static clear(symbol) {
    try {
      const all = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
      delete all[symbol];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
      return true;
    } catch (error) {
      console.error("Failed to clear history:", error);
      return false;
    }
  }
}
```

---

## 7. React Integration

### useDrawingManager.js

```javascript
import { useRef, useEffect, useCallback } from "react";
import { DrawingManager } from "@drawing-tools/base/DrawingManager";
import { DrawingsStore } from "@drawing-tools/storage/DrawingsStore";
import { HistoryStore } from "@drawing-tools/storage/HistoryStore";

export function useDrawingManager(chart, series, symbol) {
  const managerRef = useRef(null);

  // Initialize manager
  useEffect(() => {
    if (!chart || !series) return;

    managerRef.current = new DrawingManager(chart, series, {
      historyLimit: 100,
    });

    // Load drawings from storage
    const saved = DrawingsStore.get(symbol);
    managerRef.current.deserialize(saved);

    // Load history from storage
    const history = HistoryStore.get(symbol);
    if (history) {
      managerRef.current.history.undoStack = history.undoStack;
      managerRef.current.history.redoStack = history.redoStack;
    }

    return () => {
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, [chart, series, symbol]);

  // Auto-save on changes
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;

    const handleChange = () => {
      // Save drawings
      const data = manager.serialize();
      DrawingsStore.set(symbol, data);

      // Save history
      const history = manager.history.serialize();
      HistoryStore.set(symbol, history);
    };

    manager.on("change", handleChange);

    return () => {
      manager.off("change", handleChange);
    };
  }, [symbol]);

  // API methods
  const setTool = useCallback((tool) => {
    managerRef.current?.setTool(tool);
  }, []);

  const deleteSelected = useCallback(() => {
    managerRef.current?.deleteSelected();
  }, []);

  const deleteAll = useCallback(() => {
    managerRef.current?.clearAll();
  }, []);

  const undo = useCallback(() => {
    managerRef.current?.undo();
  }, []);

  const redo = useCallback(() => {
    managerRef.current?.redo();
  }, []);

  const canUndo = useCallback(() => {
    return managerRef.current?.canUndo() || false;
  }, []);

  const canRedo = useCallback(() => {
    return managerRef.current?.canRedo() || false;
  }, []);

  const updateDrawingSettings = useCallback((drawingId, settings) => {
    const drawing = managerRef.current?.getDrawing(drawingId);
    if (drawing) {
      const before = { ...drawing.settings };
      drawing.updateSettings(settings);
      const after = { ...drawing.settings };

      // Record in history
      managerRef.current.history.push(
        new ModifyAction(drawingId, before, after),
      );
    }
  }, []);

  return {
    manager: managerRef.current,
    setTool,
    deleteSelected,
    deleteAll,
    undo,
    redo,
    canUndo,
    canRedo,
    updateDrawingSettings,
  };
}
```

### useToolSettings.js

```javascript
import { useState, useEffect, useCallback } from "react";
import { ToolSettings } from "@drawing-tools/settings/ToolSettings";

const settingsManager = new ToolSettings();

export function useToolSettings(toolType) {
  const [settings, setSettings] = useState(() =>
    settingsManager.getToolSettings(toolType),
  );

  const [templates, setTemplates] = useState(() =>
    settingsManager.getTemplatesForTool(toolType),
  );

  const updateSettings = useCallback(
    (newSettings) => {
      const updated = settingsManager.updateToolSettings(toolType, newSettings);
      setSettings(updated);
    },
    [toolType],
  );

  const resetSettings = useCallback(() => {
    const defaults = settingsManager.resetToolSettings(toolType);
    setSettings(defaults);
  }, [toolType]);

  const saveAsTemplate = useCallback(
    (name) => {
      const template = settingsManager.saveTemplate(name, toolType, settings);
      setTemplates(settingsManager.getTemplatesForTool(toolType));
      return template;
    },
    [toolType, settings],
  );

  const applyTemplate = useCallback((templateId) => {
    const template = settingsManager.applyTemplate(templateId);
    if (template) {
      setSettings(template.settings);
    }
  }, []);

  const deleteTemplate = useCallback(
    (templateId) => {
      settingsManager.deleteTemplate(templateId);
      setTemplates(settingsManager.getTemplatesForTool(toolType));
    },
    [toolType],
  );

  return {
    settings,
    updateSettings,
    resetSettings,
    templates,
    saveAsTemplate,
    applyTemplate,
    deleteTemplate,
  };
}
```

---

## 8. Tool Registry

### ToolRegistry.js

```javascript
class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  register(name, PrimitiveClass, defaultConfig = {}) {
    this.tools.set(name, { PrimitiveClass, defaultConfig });
  }

  create(name, chart, series, options = {}) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    const config = {
      ...tool.defaultConfig,
      ...options,
      type: name,
    };

    return new tool.PrimitiveClass(chart, series, config);
  }

  getPrimitiveClass(name) {
    const tool = this.tools.get(name);
    return tool?.PrimitiveClass;
  }

  getAllTools() {
    return Array.from(this.tools.keys());
  }

  getToolConfig(name) {
    const tool = this.tools.get(name);
    return tool?.defaultConfig;
  }
}

// Global registry instance
export const toolRegistry = new ToolRegistry();

// Register all tools
import { LinePrimitive } from "@drawing-tools/primitives/LinePrimitive";
import { RectanglePrimitive } from "@drawing-tools/primitives/RectanglePrimitive";
import { FibRetracementPrimitive } from "@drawing-tools/primitives/FibRetracementPrimitive";
import { LongPositionPrimitive } from "@drawing-tools/primitives/LongPositionPrimitive";
import { ShortPositionPrimitive } from "@drawing-tools/primitives/ShortPositionPrimitive";

toolRegistry.register("line", LinePrimitive, {
  minPoints: 2,
  maxPoints: 2,
});

toolRegistry.register("rectangle", RectanglePrimitive, {
  minPoints: 2,
  maxPoints: 2,
});

toolRegistry.register("fibRetracement", FibRetracementPrimitive, {
  minPoints: 2,
  maxPoints: 2,
});

toolRegistry.register("longPosition", LongPositionPrimitive, {
  minPoints: 3,
  maxPoints: 3,
});

toolRegistry.register("shortPosition", ShortPositionPrimitive, {
  minPoints: 3,
  maxPoints: 3,
});
```

---

## 9. Example Primitive Implementation

### LinePrimitive.js

```javascript
import { DrawingPrimitive } from "@drawing-tools/base/DrawingPrimitive";
import {
  DraggableMixin,
  ResizableMixin,
  ConstraintMixin,
  AxisLabelMixin,
  PreviewMixin,
  SettingsMixin,
} from "@drawing-tools/mixins";

export class LinePrimitive extends DrawingPrimitive {
  constructor(chart, series, config) {
    super(chart, series, config);

    // Apply mixins
    this.applyMixins(
      DraggableMixin,
      ResizableMixin,
      ConstraintMixin,
      AxisLabelMixin,
      PreviewMixin,
      SettingsMixin,
    );
  }

  getHandles() {
    if (!this.isSelected || this.points.length < 2) return [];

    return [
      {
        id: "p1",
        index: 0,
        point: this.points[0],
        cursor: "nwse-resize",
      },
      {
        id: "p2",
        index: 1,
        point: this.points[1],
        cursor: "nwse-resize",
      },
    ];
  }

  hitTest(point) {
    if (this.points.length < 2) return false;

    const p1 = this.points[0];
    const p2 = this.points[1];

    // Convert to screen coordinates
    const x1 = this.chart.timeScale().timeToCoordinate(p1.time);
    const y1 = this.series.priceToCoordinate(p1.price);
    const x2 = this.chart.timeScale().timeToCoordinate(p2.time);
    const y2 = this.series.priceToCoordinate(p2.price);
    const px = this.chart.timeScale().timeToCoordinate(point.time);
    const py = this.series.priceToCoordinate(point.price);

    // Calculate distance from point to line
    const distance = this.pointToLineDistance(px, py, x1, y1, x2, y2);

    return distance < 10; // 10 pixel threshold
  }

  pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }

  render(target) {
    if (this.points.length < 2) return;

    const p1 = this.points[0];
    const p2 = this.points[1];

    // Get screen coordinates
    const x1 = this.chart.timeScale().timeToCoordinate(p1.time);
    const y1 = this.series.priceToCoordinate(p1.price);
    const x2 = this.chart.timeScale().timeToCoordinate(p2.time);
    const y2 = this.series.priceToCoordinate(p2.price);

    // Draw line
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const scaledX1 = x1 * scope.horizontalPixelRatio;
      const scaledY1 = y1 * scope.verticalPixelRatio;
      const scaledX2 = x2 * scope.horizontalPixelRatio;
      const scaledY2 = y2 * scope.verticalPixelRatio;

      ctx.strokeStyle = this.settings.color;
      ctx.lineWidth = this.settings.lineWidth * scope.verticalPixelRatio;

      if (this.settings.lineStyle === "dashed") {
        ctx.setLineDash([5, 5]);
      } else if (this.settings.lineStyle === "dotted") {
        ctx.setLineDash([2, 2]);
      }

      ctx.beginPath();
      ctx.moveTo(scaledX1, scaledY1);
      ctx.lineTo(scaledX2, scaledY2);
      ctx.stroke();

      ctx.setLineDash([]);

      // Draw endpoints if selected
      if (this.isSelected && this.settings.showEndpoints) {
        this.drawHandle(ctx, scaledX1, scaledY1, scope);
        this.drawHandle(ctx, scaledX2, scaledY2, scope);
      }
    });

    // Draw axis labels
    if (this.settings.showLabels) {
      this.renderAxisLabels(target);
    }
  }

  drawHandle(ctx, x, y, scope) {
    const size = 8 * scope.verticalPixelRatio;

    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = this.settings.color;
    ctx.lineWidth = 2 * scope.verticalPixelRatio;

    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  clone() {
    const cloned = new LinePrimitive(this.chart, this.series, {
      type: this.type,
      settings: { ...this.settings },
    });

    cloned.points = this.points.map((p) => ({ ...p }));

    return cloned;
  }

  static fromJSON(data, chart, series) {
    const primitive = new LinePrimitive(chart, series, {
      type: data.type,
      settings: data.settings,
    });

    primitive.id = data.id;
    primitive.points = data.points;
    primitive.createdAt = data.createdAt;
    primitive.updatedAt = data.updatedAt;

    return primitive;
  }
}
```

---

## 10. Usage Example

### Chart Component

```javascript
import React from "react";
import { useDrawingManager } from "@hooks/useDrawingManager";
import { useToolSettings } from "@hooks/useToolSettings";

function Chart({ symbol }) {
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const {
    manager,
    setTool,
    deleteSelected,
    deleteAll,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDrawingManager(chartRef.current, seriesRef.current, symbol);

  const { settings, updateSettings, templates, saveAsTemplate, applyTemplate } =
    useToolSettings("line");

  return (
    <div>
      {/* Toolbar */}
      <div className='toolbar'>
        <button onClick={() => setTool("line")}>Line</button>
        <button onClick={() => setTool("rectangle")}>Rectangle</button>
        <button onClick={() => setTool("fibRetracement")}>Fib</button>
        <button onClick={deleteSelected}>Delete</button>
        <button onClick={deleteAll}>Clear All</button>
        <button onClick={undo} disabled={!canUndo()}>
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo()}>
          Redo
        </button>
      </div>

      {/* Settings Panel */}
      <div className='settings'>
        <input
          type='color'
          value={settings.color}
          onChange={(e) => updateSettings({ color: e.target.value })}
        />
        <input
          type='number'
          value={settings.lineWidth}
          onChange={(e) => updateSettings({ lineWidth: +e.target.value })}
        />
        <button onClick={() => saveAsTemplate("My Template")}>
          Save Template
        </button>
        <select onChange={(e) => applyTemplate(e.target.value)}>
          <option>Select Template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div ref={chartRef} />
    </div>
  );
}
```

---

## Implementation Phases

### Phase 1: Core Foundation (Week 1-2)

- [ ] Base DrawingPrimitive class
- [ ] DrawingManager class
- [ ] Basic mixins (Draggable, Resizable)
- [ ] ToolRegistry
- [ ] LinePrimitive implementation
- [ ] Basic React integration

### Phase 2: Storage & Persistence (Week 2-3)

- [ ] DrawingsStore (per-symbol)
- [ ] Auto-save functionality
- [ ] Load on symbol change
- [ ] Export/import functionality

### Phase 3: Undo/Redo System (Week 3-4)

- [ ] ActionHistory class
- [ ] Action classes (Create, Delete, Move, Resize, Modify)
- [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
- [ ] HistoryStore persistence

### Phase 4: Settings & Templates (Week 4-5)

- [ ] ToolSettings class
- [ ] TemplateManager
- [ ] Settings UI components
- [ ] Backend API integration
- [ ] Template sync

### Phase 5: Additional Primitives (Week 5-6)

- [ ] RectanglePrimitive
- [ ] FibRetracementPrimitive
- [ ] LongPositionPrimitive
- [ ] ShortPositionPrimitive

### Phase 6: Advanced Features (Week 6-7)

- [ ] ConstraintMixin (Shift/Ctrl)
- [ ] AxisLabelMixin
- [ ] PreviewMixin
- [ ] Cursor management
- [ ] Programmatic drawing API

### Phase 7: Polish & Testing (Week 7-8)

- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Documentation
- [ ] Migration guide

---

## Benefits of This Architecture

1. **Clean Separation**: Each component has a single responsibility
2. **Composition**: Mixins allow flexible behavior combination
3. **DRY**: No code duplication across tools
4. **Testable**: Each piece can be unit tested
5. **Extensible**: New tools are easy to add
6. **Type-Safe**: Ready for TypeScript migration
7. **Performance**: Centralized viewport optimization
8. **Maintainable**: Clear structure, easy to understand
9. **Feature-Rich**: Undo/redo, templates, persistence built-in
10. **User-Friendly**: Settings UI, keyboard shortcuts, smooth UX
