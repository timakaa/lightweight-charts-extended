import PluginBase from "../PluginBase.js";
import { defaultOptions } from "./options.js";
import {
  LinePaneView,
  HandlesPaneView,
  LinePriceAxisPaneView,
  LineTimeAxisPaneView,
  LinePriceAxisView,
  LineTimeAxisView,
} from "./views.js";
import { enhancePointWithLogicalIndex } from "../../helpers/coordinateUtils.js";

// Line.js - Implements the Line and PreviewLine primitives for drawing lines on the chart
// The Line class represents a drawable line primitive on the chart, with endpoints p1 and p2.
export class Line extends PluginBase {
  constructor(
    p1,
    p2,
    series,
    chart,
    selectedLineId,
    activeResizeHandleRef = null,
    candleData = null,
    id = null,
  ) {
    super();
    // Unique identifier for the line
    this.id = id || `line-${Date.now()}-${Math.random()}`;
    // Store candle data for coordinate calculations
    this._candleData = candleData;
    // Enhance endpoints with logical coordinates
    this._p1 = enhancePointWithLogicalIndex(p1, candleData);
    this._p2 = enhancePointWithLogicalIndex(p2, candleData);
    // Series and chart references for coordinate conversions
    this._series = series;
    this._chart = chart;
    // Drawing options (color, handles, etc.)
    this._options = { ...defaultOptions };
    // Currently selected line ID for selection logic
    this._selectedLineId = selectedLineId;
    // Pane views for rendering the line and its handles
    this._paneViews = [
      new LinePaneView(this),
      new HandlesPaneView(this, activeResizeHandleRef),
    ];
    // Axis views for price/time overlays
    this._priceAxisPaneViews = [new LinePriceAxisPaneView(this)];
    this._timeAxisPaneViews = [new LineTimeAxisPaneView(this)];
    this._priceAxisViews = [
      new LinePriceAxisView(this, "p1"),
      new LinePriceAxisView(this, "p2"),
    ];
    this._timeAxisViews = [
      new LineTimeAxisView(this, "p1"),
      new LineTimeAxisView(this, "p2"),
    ];
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
  }

  // Set the selected line ID (for selection logic)
  setSelectedLineId(selectedLineId) {
    this._selectedLineId = selectedLineId;
  }

  // Returns true if this line is the currently selected one
  isTargeted(selectedLineId) {
    return this.id === selectedLineId;
  }

  // Updates all views (pane and axis) for this line
  updateAllViews() {
    this._paneViews.forEach((v) => v.update());
    this._priceAxisPaneViews.forEach((v) => v.update());
    this._timeAxisPaneViews.forEach((v) => v.update());
    this._priceAxisViews.forEach((v) => v.update());
    this._timeAxisViews.forEach((v) => v.update());
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
      (this.isTargeted && this.isTargeted(this._selectedLineId)) ||
      this.constructor.name === "PreviewLine"
    ) {
      return this._priceAxisPaneViews;
    }
    return [];
  }

  // Returns time axis pane views if selected or preview
  timeAxisPaneViews() {
    if (
      (this.isTargeted && this.isTargeted(this._selectedLineId)) ||
      this.constructor.name === "PreviewLine"
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

  // Applies new options to the line (e.g., color, handles)
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

// PreviewLine is a temporary line shown while drawing (before finalizing)
export class PreviewLine extends Line {
  constructor(p1, p2, series, chart, selectedLineId, candleData = null) {
    super(p1, p2, series, chart, selectedLineId, null, candleData);
    // Use preview color for the preview line
    this.applyOptions({ color: defaultOptions.previewColor });
  }

  // Update the endpoint of the preview line as the mouse moves
  updateEndPoint(p) {
    this._p2 = enhancePointWithLogicalIndex(p, this._candleData);
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }
}
