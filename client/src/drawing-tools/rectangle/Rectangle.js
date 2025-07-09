import PluginBase from "../PluginBase.js";
import { defaultOptions } from "./options.js";
import {
  HandlesPaneView,
  RectanglePaneView,
  RectanglePriceAxisPaneView,
  RectangleTimeAxisPaneView,
  RectanglePriceAxisView,
  RectangleTimeAxisView,
} from "./views.js";
import { enhancePointWithLogicalIndex } from "../../helpers/coordinateUtils.js";
import { generateId } from "../../helpers/generateId";

// Rectangle.js - Implements the Rectangle and PreviewRectangle primitives for drawing rectangles (boxes) on the chart
// The Rectangle class represents a drawable rectangle primitive on the chart, with endpoints p1 and p2.
export class Rectangle extends PluginBase {
  constructor(
    p1,
    p2,
    series,
    chart,
    selectedBoxId = null,
    activeResizeHandleRef = null,
    candleData = null,
    id = null,
  ) {
    super();
    // Unique identifier for the rectangle
    this.id = id || generateId("rectangle");
    // Store candle data for coordinate calculations
    this._candleData = candleData;
    // Enhance endpoints with logical coordinates
    this._p1 = enhancePointWithLogicalIndex(p1, candleData);
    this._p2 = enhancePointWithLogicalIndex(p2, candleData);
    // Series and chart references for coordinate conversions
    this._series = series;
    this._chart = chart;
    // Drawing options (fill color, handles, etc.)
    this._options = { ...defaultOptions };
    // Currently selected box ID for selection logic
    this._selectedBoxId = selectedBoxId;
    // Pane views for rendering the rectangle and its handles
    this._paneViews = [
      new RectanglePaneView(this),
      new HandlesPaneView(this, activeResizeHandleRef),
    ];
    // Axis views for price/time overlays
    this._priceAxisPaneViews = [new RectanglePriceAxisPaneView(this)];
    this._timeAxisPaneViews = [new RectangleTimeAxisPaneView(this)];
    this._priceAxisViews = [
      new RectanglePriceAxisView(this, "p1"),
      new RectanglePriceAxisView(this, "p2"),
    ];
    this._timeAxisViews = [
      new RectangleTimeAxisView(this, "p1"),
      new RectangleTimeAxisView(this, "p2"),
    ];
  }

  // Set the selected box ID (for selection logic)
  setSelectedBoxId(selectedBoxId) {
    this._selectedBoxId = selectedBoxId;
  }

  // Returns true if this rectangle is the currently selected one
  isTargeted(selectedBoxId) {
    return this.id === selectedBoxId;
  }

  // Update candle data for coordinate calculations
  updateCandleData(candleData) {
    this._candleData = candleData;

    // Invalidate logical indices to prevent stale index issues when new data is loaded
    // They will be recalculated as needed by getXCoordinate
    if (this._p1.logicalIndex !== undefined) {
      delete this._p1.logicalIndex;
    }
    if (this._p2.logicalIndex !== undefined) {
      delete this._p2.logicalIndex;
    }

    // Re-enhance points with new candle data
    this._p1 = enhancePointWithLogicalIndex(this._p1, candleData);
    this._p2 = enhancePointWithLogicalIndex(this._p2, candleData);
  }

  // Updates all views (pane and axis) for this rectangle
  updateAllViews() {
    this._paneViews.forEach((v) => v.update());
    this._priceAxisPaneViews.forEach((v) => v.update());
    this._timeAxisPaneViews.forEach((v) => v.update());
    this._priceAxisViews.forEach((v) => v.update());
    this._timeAxisViews.forEach((v) => v.update());
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }

  // Returns the pane views for rendering (handles shown if enabled)
  paneViews() {
    const views = [this._paneViews[0]];
    if (this._options.showHandles) {
      views.push(this._paneViews[1]);
    }
    return views;
  }

  // Returns price axis pane views if selected or preview
  priceAxisPaneViews() {
    if (
      (this.isTargeted && this.isTargeted(this._selectedBoxId)) ||
      this.constructor.name === "PreviewRectangle"
    ) {
      return this._priceAxisPaneViews;
    }
    return [];
  }

  // Returns time axis pane views if selected or preview
  timeAxisPaneViews() {
    if (
      (this.isTargeted && this.isTargeted(this._selectedBoxId)) ||
      this.constructor.name === "PreviewRectangle"
    ) {
      return this._timeAxisPaneViews;
    }
    return [];
  }

  // Returns price axis label views
  priceAxisViews() {
    return this._priceAxisViews;
  }

  // Returns time axis label views
  timeAxisViews() {
    return this._timeAxisViews;
  }

  // Set the active resize handle for this rectangle (for UI feedback)
  setActiveResizeHandle(activeResizeHandleRef) {
    if (this._paneViews[1] && this._paneViews[1] instanceof HandlesPaneView) {
      this._paneViews[1]._activeResizeHandle = activeResizeHandleRef;
    }
  }

  // Applies new options to the rectangle (e.g., fill color, handles)
  applyOptions(options) {
    this._options = {
      ...this._options,
      ...options,
    };
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }
}

// PreviewRectangle is a temporary rectangle shown while drawing (before finalizing)
export class PreviewRectangle extends Rectangle {
  constructor(p1, p2, series, chart, candleData = null) {
    super(p1, p2, series, chart, null, null, candleData);
    // Use preview fill color for the preview rectangle
    this.applyOptions({ fillColor: defaultOptions.previewFillColor });
  }

  // Update the endpoint of the preview rectangle as the mouse moves
  updateEndPoint(p) {
    this._p2 = enhancePointWithLogicalIndex(p, this._candleData);
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }
}
