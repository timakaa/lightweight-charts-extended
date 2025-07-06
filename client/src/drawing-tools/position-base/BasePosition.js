// BasePosition.js - Abstract base class for position drawing tools (long/short)
import PluginBase from "../PluginBase.js";
import { enhancePointWithLogicalIndex } from "../../helpers/coordinateUtils.js";

// BasePosition provides common logic for position tools (entry, target, stop, axis views, handles, etc.)
export default class BasePosition extends PluginBase {
  constructor(
    entryPrice,
    targetPrice,
    stopPrice,
    series,
    chart,
    selectedPositionId = null,
    activeResizeHandleRef = null,
    candleData = null,
    options = {},
    PaneViewClass,
    HandlesPaneViewClass,
    PriceAxisPaneViewClass,
    TimeAxisPaneViewClass,
    PriceAxisViewClass,
    TimeAxisViewClass,
    defaultOptions = {},
    id = null,
  ) {
    super();
    // Unique identifier for the position
    this.id = id || `position-${Date.now()}-${Math.random()}`;
    // Store candle data for coordinate calculations
    this._candleData = candleData;
    // Logical coordinates for entry, target, and stop enhanced with logical indices
    this._entryPrice = enhancePointWithLogicalIndex(entryPrice, candleData);
    this._targetPrice = enhancePointWithLogicalIndex(targetPrice, candleData);
    this._stopPrice = enhancePointWithLogicalIndex(stopPrice, candleData);
    // Series and chart references
    this._series = series;
    this._chart = chart;
    // Drawing options (colors, handles, etc.)
    this._options = { ...defaultOptions, ...options };
    // Selection and hover state
    this._selectedPositionId = selectedPositionId;
    this._hoveredPositionId = null;
    // Pane and axis views for rendering
    this._paneViews = [
      new PaneViewClass(this),
      new HandlesPaneViewClass(this, activeResizeHandleRef),
    ];
    this._priceAxisPaneViews = [new PriceAxisPaneViewClass(this)];
    this._timeAxisPaneViews = [new TimeAxisPaneViewClass(this)];
    this._priceAxisViews = [
      new PriceAxisViewClass(this, "p1"),
      new PriceAxisViewClass(this, "p2"),
      new PriceAxisViewClass(this, "entry"),
    ];
    this._timeAxisViews = [
      new TimeAxisViewClass(this, "p1"),
      new TimeAxisViewClass(this, "p2"),
    ];
    // State for entry tap (UI feedback)
    this._entryTapped = false;
  }

  // Update candle data and propagate to all position instances
  updateCandleData(candleData) {
    this._candleData = candleData;

    // Invalidate logical indices to prevent stale index issues when new data is loaded
    // They will be recalculated as needed by getXCoordinate
    if (this._entryPrice && this._entryPrice.logicalIndex !== undefined) {
      delete this._entryPrice.logicalIndex;
    }
    if (this._targetPrice && this._targetPrice.logicalIndex !== undefined) {
      delete this._targetPrice.logicalIndex;
    }
    if (this._stopPrice && this._stopPrice.logicalIndex !== undefined) {
      delete this._stopPrice.logicalIndex;
    }

    // Re-enhance points with new candle data
    if (this._entryPrice) {
      this._entryPrice = enhancePointWithLogicalIndex(
        this._entryPrice,
        candleData,
      );
    }
    if (this._targetPrice) {
      this._targetPrice = enhancePointWithLogicalIndex(
        this._targetPrice,
        candleData,
      );
    }
    if (this._stopPrice) {
      this._stopPrice = enhancePointWithLogicalIndex(
        this._stopPrice,
        candleData,
      );
    }
  }

  // Set the selected position ID (for selection logic)
  setSelectedPositionId(selectedPositionId) {
    this._selectedPositionId = selectedPositionId;
  }

  // Set the hovered position ID (for hover logic)
  setHoveredPositionId(hoveredPositionId) {
    this._hoveredPositionId = hoveredPositionId;
    this.updateAllViews();
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }

  // Returns true if this position is the currently selected one
  isTargeted(selectedPositionId) {
    return this.id === selectedPositionId;
  }

  // Returns true if this position is currently hovered
  isHovered(hoveredPositionId) {
    return this.id === hoveredPositionId;
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
    const result =
      (this.isTargeted && this.isTargeted(this._selectedPositionId)) ||
      this.constructor.name.startsWith("Preview")
        ? this._priceAxisPaneViews
        : [];
    return result;
  }

  // Returns time axis pane views if selected or preview
  timeAxisPaneViews() {
    if (
      (this.isTargeted && this.isTargeted(this._selectedPositionId)) ||
      this.constructor.name.startsWith("Preview")
    ) {
      return this._timeAxisPaneViews;
    }
    return [];
  }

  // Returns time axis label views
  timeAxisViews() {
    return this._timeAxisViews;
  }

  // Returns price axis label views
  priceAxisViews() {
    return this._priceAxisViews;
  }

  // Applies new options to the position (e.g., color, handles)
  applyOptions(options) {
    this._options = {
      ...this._options,
      ...options,
    };
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }

  // Updates all views (pane and axis) for this position
  updateAllViews() {
    // Only update views if chart and series are defined
    if (!this._chart || !this._series) return;
    this._paneViews.forEach((v) => v.update());
    this._priceAxisPaneViews.forEach((v) => v.update());
    this._timeAxisPaneViews.forEach((v) => v.update());
    this._priceAxisViews.forEach((v) => v.update());
    this._timeAxisViews.forEach((v) => v.update());
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }

  // Set the entry tapped state (for UI feedback)
  setEntryTapped(tapped) {
    this._entryTapped = tapped;
    this.updateAllViews();
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }
}
