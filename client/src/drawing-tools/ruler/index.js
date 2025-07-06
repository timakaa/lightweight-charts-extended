import PluginBase from "../PluginBase.js";
import { getSnappedPrice } from "../helpers.js";
import {
  logicalIndexToTime,
  enhancePointWithLogicalIndex,
} from "../../helpers/coordinateUtils.js";
import { Ruler, PreviewRuler } from "./Ruler.js";

// index.js - Implements the RulerTool for managing ruler drawing interactions on the chart
// RulerTool manages the creation, drawing, and management of ruler primitives on the chart
export class RulerTool extends PluginBase {
  _series;
  _p1 = null;
  _p2 = null;
  _rulers = new Set();
  _previewRuler = null;
  _drawing = false;
  _onToolChanged;
  _onRulersChange;
  _isSnapping = false;
  candleData = null; // Will be set externally

  constructor(chart, series, onToolChanged, onRulersChange) {
    super();
    // Chart and series references
    this._chart = chart;
    this._series = series;
    // Callback for when the tool changes (e.g., drawing finished)
    this._onToolChanged = onToolChanged;
    // Callback for when the set of rulers changes
    this._onRulersChange = onRulersChange;
  }

  // Remove all rulers and preview ruler from the chart
  remove() {
    this._rulers.forEach((ruler) => {
      ruler.destroy && ruler.destroy();
      this._series.detachPrimitive(ruler);
    });
    this._rulers.clear();
    this._removePreviewRuler();
  }

  // Start drawing mode: subscribe to chart and document events
  startDrawing() {
    if (this._drawing) return;
    this._drawing = true;
    this._chart.subscribeClick(this._onClick);
    this._chart.subscribeCrosshairMove(this._onCrosshairMove);
    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("keyup", this._onKeyUp);
  }

  // Stop drawing mode: unsubscribe from events and reset state
  stopDrawing() {
    if (!this._drawing) return;
    this._drawing = false;
    this._p1 = null;
    this._p2 = null;
    this._removePreviewRuler();
    this._chart.unsubscribeClick(this._onClick);
    this._chart.unsubscribeCrosshairMove(this._onCrosshairMove);
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
  }

  // Key down handler: enable snapping or cancel drawing
  _onKeyDown = (e) => {
    if (e.key === "Escape") {
      if (this._drawing && this._p1) {
        this._p1 = null;
        this._p2 = null;
        this._removePreviewRuler();
        if (this._onToolChanged) this._onToolChanged();
        e.preventDefault();
      }
    }
    if (e.key === "Control" || e.key === "Meta") {
      this._isSnapping = true;
    }
  };

  // Key up handler: disable snapping
  _onKeyUp = (e) => {
    if (e.key === "Control" || e.key === "Meta") {
      this._isSnapping = false;
    }
  };

  // Convert chart event param to logical point (time, price) with hybrid coordinate support
  _getPoint(param) {
    const price = this._getPriceFromEvent(param);
    if (!price) return null;

    // Get time from chart parameter or handle clicks outside candle range
    let time = param.time;

    // If no time (clicked outside candle range), calculate it from logical coordinates
    if (!time && param.point && this.candleData && this.candleData.length > 0) {
      const timeScale = this._chart.timeScale();
      const logicalIndex = timeScale.coordinateToLogical(param.point.x);

      if (logicalIndex !== null) {
        // Calculate time from logical index using candle data
        time = logicalIndexToTime(logicalIndex, this.candleData);
      }
    }

    if (!time) return null;

    const point = { time, price };
    return enhancePointWithLogicalIndex(point, this.candleData);
  }

  // Get price from event, with optional snapping to candle
  _getPriceFromEvent(param) {
    if (!param.point) return null;
    const price = this._series.coordinateToPrice(param.point.y);
    if (this._isSnapping) {
      const candle = param.seriesData.get(this._series);
      return getSnappedPrice(price, candle);
    }
    return price;
  }

  // Handle chart click: set p1 or p2, create ruler, and reset state
  _onClick = (param) => {
    if (!param.point || param.hoveredSeries) return;

    if (!this._p1) {
      // Remove all previous rulers before starting a new one
      this.deleteAll();
      // First click: set first endpoint
      this._p1 = this._getPoint(param);
      if (!this._p1) return; // Failed to get valid point
    } else {
      // Second click: set second endpoint and create ruler
      this._p2 = this._getPoint(param);
      if (!this._p2) return; // Failed to get valid point

      const newRuler = new Ruler(
        this._p1,
        this._p2,
        this._series,
        this._chart,
        this.candleData,
      );
      this._series.attachPrimitive(newRuler);
      this._rulers.add(newRuler);
      if (this._onRulersChange) {
        this._onRulersChange([...this._rulers]);
      }
      if (this._onToolChanged) {
        this._onToolChanged();
      }
      this._onDrawingFinished();
      this._p1 = null;
      this._p2 = null;
      this._isSnapping = false;
    }
  };

  // Handle crosshair move: update preview ruler endpoint
  _onCrosshairMove = (param) => {
    if (!this._p1 || !param.point) {
      this._removePreviewRuler();
      return;
    }

    const p2 = this._getPoint(param);
    if (!p2) {
      this._removePreviewRuler();
      return;
    }

    // Create or update preview ruler
    if (!this._previewRuler) {
      this._previewRuler = new PreviewRuler(
        this._p1,
        p2,
        this._series,
        this._chart,
        this.candleData,
      );
      this._series.attachPrimitive(this._previewRuler);
    } else {
      this._previewRuler.updateEndPoint(p2);
    }
  };

  // Called when drawing is finished (after ruler creation)
  _onDrawingFinished = () => {
    this._removePreviewRuler();
    // We don't want to stop drawing, just reset the points
    // so the user can draw another ruler.
    // The tool is stopped from the outside.
  };

  // Remove a ruler primitive from the chart and update state
  _removeRuler(ruler) {
    ruler.destroy && ruler.destroy();
    this._series.detachPrimitive(ruler);
    this._rulers.delete(ruler);
    if (this._onRulersChange) {
      this._onRulersChange([...this._rulers]);
    }
  }

  // Remove the preview ruler from the chart
  _removePreviewRuler() {
    if (this._previewRuler) {
      this._series.detachPrimitive(this._previewRuler);
      this._previewRuler = null;
    }
  }

  // Delete all rulers from the chart
  deleteAll() {
    this.remove();
  }

  // Programmatically set the first point (for external control)
  setFirstPointFromEvent(param) {
    if (!this._drawing) this.startDrawing();
    this.deleteAll();
    // Support modifierKey for snapping
    let prevSnapping = this._isSnapping;
    if (param.modifierKey === "snap") this._isSnapping = true;
    this._p1 = this._getPoint(param);
    this._isSnapping = prevSnapping;
  }

  // Update candle data for coordinate calculations
  updateCandleData(candleData) {
    this.candleData = candleData;

    // Update candleData on all existing rulers
    this._rulers.forEach((ruler) => {
      if (ruler && ruler.updateCandleData) {
        ruler.updateCandleData(candleData);
      }
    });

    // Update preview ruler if it exists
    if (this._previewRuler && this._previewRuler.updateCandleData) {
      this._previewRuler.updateCandleData(candleData);
    }
  }
}
