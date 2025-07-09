import PluginBase from "../PluginBase.js";
import {
  RulerPaneView,
  RulerPriceAxisView,
  RulerTimeAxisView,
  RulerPriceAxisPaneView,
  RulerTimeAxisPaneView,
} from "./views.js";
import { defaultRulerOptions } from "./options.js";
import { enhancePointWithLogicalIndex } from "../../helpers/coordinateUtils.js";
import { generateId } from "../../helpers/generateId";

// Ruler.js - Implements the Ruler and PreviewRuler primitives for drawing measurement rulers on the chart
// The Ruler class represents a measurement ruler primitive on the chart, with endpoints p1 and p2.
export class Ruler extends PluginBase {
  constructor(p1, p2, series, chart, candleData) {
    super();
    // Unique identifier for the ruler
    this.id = generateId("ruler");
    // Store candle data for coordinate calculations
    this._candleData = candleData;
    // Enhance endpoints with logical coordinates
    this._p1 = enhancePointWithLogicalIndex(p1, candleData);
    this._p2 = enhancePointWithLogicalIndex(p2, candleData);
    // Series and chart references for coordinate conversions
    this._series = series;
    this._chart = chart;
    // Drawing options (color, labels, etc.)
    this._options = { ...defaultRulerOptions };
    // Candle data for bar counting and time diff (kept for backward compatibility)
    this.candleData = candleData;
    // Pane and axis views for rendering
    this._paneViews = [new RulerPaneView(this)];
    this._priceAxisViews = [
      new RulerPriceAxisView(this, this._p1),
      new RulerPriceAxisView(this, this._p2),
    ];
    this._timeAxisViews = [
      new RulerTimeAxisView(this, this._p1),
      new RulerTimeAxisView(this, this._p2),
    ];
    this._priceAxisPaneViews = [new RulerPriceAxisPaneView(this)];
    this._timeAxisPaneViews = [new RulerTimeAxisPaneView(this)];

    // Subscribe to chart updates for live updating
    this._chart
      .timeScale()
      .subscribeVisibleLogicalRangeChange(this._onChartUpdate);
    this._series.subscribeDataChanged(this._onChartUpdate);
  }

  // Called on chart or data update to trigger a redraw
  _onChartUpdate = () => {
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  };

  // Updates all views (pane and axis) for this ruler
  updateAllViews() {
    this._paneViews.forEach((v) => v.update());
    this._priceAxisViews.forEach((v) => v.update());
    this._timeAxisViews.forEach((v) => v.update());
    this._priceAxisPaneViews.forEach((v) => v.update());
    this._timeAxisPaneViews.forEach((v) => v.update());
  }

  // Returns the pane views for rendering
  paneViews() {
    return this._paneViews;
  }

  // Returns price axis label views
  priceAxisViews() {
    return this._priceAxisViews;
  }

  // Returns time axis label views
  timeAxisViews() {
    return this._timeAxisViews;
  }

  // Returns price axis pane views
  priceAxisPaneViews() {
    return this._priceAxisPaneViews;
  }

  // Returns time axis pane views
  timeAxisPaneViews() {
    return this._timeAxisPaneViews;
  }

  // Returns all axis pane views
  axisPaneViews() {
    const views = [...this._priceAxisPaneViews, ...this._timeAxisPaneViews];
    return views;
  }

  // Applies new options to the ruler (e.g., color, labels)
  applyOptions(options) {
    this._options = {
      ...this._options,
      ...options,
    };
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }

  // Cleanup subscriptions when the ruler is destroyed
  destroy() {
    this._chart
      .timeScale()
      .unsubscribeVisibleLogicalRangeChange(this._onChartUpdate);
    this._series.unsubscribeDataChanged(this._onChartUpdate);
  }

  // Update candle data for coordinate calculations
  updateCandleData(candleData) {
    this._candleData = candleData;
    this.candleData = candleData; // Keep for backward compatibility

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
}

// PreviewRuler is a temporary ruler shown while drawing (before finalizing)
export class PreviewRuler extends Ruler {
  constructor(p1, p2, series, chart, candleData) {
    super(p1, p2, series, chart, candleData);
    // Use preview fill color for the preview ruler
    this.applyOptions({ fillColor: defaultRulerOptions.previewFillColor });
  }

  // Update the endpoint of the preview ruler as the mouse moves
  updateEndPoint(p) {
    this._p2 = enhancePointWithLogicalIndex(p, this._candleData);
    this._paneViews[0].update();
    this._timeAxisViews[1].movePoint(this._p2);
    this._priceAxisViews[1].movePoint(this._p2);
    this._priceAxisPaneViews[0].update();
    this._timeAxisPaneViews[0].update();
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }

  priceAxisPaneViews() {
    return this._priceAxisPaneViews;
  }

  timeAxisPaneViews() {
    return this._timeAxisPaneViews;
  }
}
