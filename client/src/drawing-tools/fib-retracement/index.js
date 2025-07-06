import PluginBase from "../PluginBase.js";
import { getSnappedPrice } from "../helpers.js";
import { FibRetracement } from "./FibRetracement.js";
import {
  enhancePointWithLogicalIndex,
  logicalIndexToTime,
} from "../../helpers/coordinateUtils.js";
import { useDrawingsStore } from "../../store/drawings.js";
import { useChartStore } from "../../store/chart.js";

/**
 * PreviewFibRetracement - Temporary retracement shown while drawing
 *
 * Extends FibRetracement to provide preview functionality:
 * - Shows retracement while user is drawing (before finalizing)
 * - Updates endpoint as user moves mouse with hybrid coordinate support
 * - Same rendering as final retracement but temporary
 */
class PreviewFibRetracement extends FibRetracement {
  constructor(p1, p2, series, chart, candleData = null) {
    super(p1, p2, series, chart, null, null, candleData);
    // Optionally set preview style here if needed
  }

  /**
   * Updates the endpoint during drawing preview with hybrid coordinate support
   * @param {object} p - New endpoint {time, price}
   */
  updateEndPoint(p) {
    this._p2 = enhancePointWithLogicalIndex(p, this._candleData);
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }
}

/**
 * FibRetracementDrawingTool - Main drawing tool for fib retracements
 *
 * Handles the complete drawing workflow for fib retracements:
 * - Mouse click handling for setting endpoints with hybrid coordinate support
 * - Preview retracement while drawing
 * - Snap-to-candle functionality with Ctrl/Meta
 * - Tool state management and cleanup
 * - Integration with chart events and callbacks
 * - Support for positioning outside candle range
 */
export class FibRetracementDrawingTool extends PluginBase {
  _series;
  _p1 = null;
  _p2 = null;
  _retracements = new Set();
  _previewRetracement = null;
  _drawing = false;
  _onToolChanged;
  _onRetracementsChange;
  _onRetracementCreated;
  _isSnapping = false;
  _selectedFibRetracementId;
  _candleData = null;

  constructor(
    chart,
    series,
    onToolChanged,
    options,
    onRetracementsChange,
    onRetracementCreated,
    candleData = null,
  ) {
    super();
    this._chart = chart;
    this._series = series;
    this._onToolChanged = onToolChanged;
    this._onRetracementsChange = onRetracementsChange;
    this._onRetracementCreated = onRetracementCreated;
    this._candleData = candleData;
  }

  /**
   * Updates candle data for all retracements and the drawing tool
   * @param {Array} newCandleData - New candle data array
   */
  updateCandleData(newCandleData) {
    this._candleData = newCandleData;

    // Update all existing retracements with new candle data
    this._retracements.forEach((fib) => {
      if (fib.updateCandleData) {
        fib.updateCandleData(newCandleData);
      }
    });

    // Update preview retracement if it exists
    if (this._previewRetracement && this._previewRetracement.updateCandleData) {
      this._previewRetracement.updateCandleData(newCandleData);
    }
  }

  /**
   * Removes all retracements and cleans up
   */
  remove() {
    this._retracements.forEach((fib) => this._removeRetracement(fib));
    this._retracements.clear();
    this._removePreviewRetracement();
  }

  /**
   * Removes all retracements from chart without removing from store (for ticker/timeframe changes)
   */
  removeFromChartOnly() {
    this._retracements.forEach((fib) =>
      this._removeRetracementFromChartOnly(fib),
    );
    this._retracements.clear();
    this._removePreviewRetracement();
  }

  /**
   * Starts drawing mode - enables mouse and keyboard event listeners
   */
  startDrawing() {
    if (this._drawing) return;
    this._drawing = true;
    this._chart.subscribeClick(this._onClick);
    this._chart.subscribeCrosshairMove(this._onCrosshairMove);
    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("keyup", this._onKeyUp);
  }

  /**
   * Stops drawing mode - disables event listeners and cleans up
   */
  stopDrawing() {
    if (!this._drawing) return;
    this._drawing = false;
    this._p1 = null;
    this._p2 = null;
    this._removePreviewRetracement();
    this._chart.unsubscribeClick(this._onClick);
    this._chart.unsubscribeCrosshairMove(this._onCrosshairMove);
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
  }

  /**
   * Handles keyboard events for drawing controls
   * @param {KeyboardEvent} e - Keyboard event
   */
  _onKeyDown = (e) => {
    if (e.key === "Escape") {
      if (this._drawing && this._p1) {
        // Cancel drawing on Escape
        this._p1 = null;
        this._p2 = null;
        this._removePreviewRetracement();
        if (this._onToolChanged) this._onToolChanged();
        e.preventDefault();
      }
    }
    if (e.key === "Control" || e.key === "Meta") {
      this._isSnapping = true;
    }
  };

  /**
   * Handles keyboard release events
   * @param {KeyboardEvent} e - Keyboard event
   */
  _onKeyUp = (e) => {
    if (e.key === "Control" || e.key === "Meta") {
      this._isSnapping = false;
    }
  };

  /**
   * Converts chart event to logical point coordinates with hybrid coordinate support
   * @param {object} param - Chart event parameter
   * @returns {object|null} Point {time, price} or null
   */
  _getPoint(param) {
    const price = this._getPriceFromEvent(param);
    if (!price) return null;

    // Get time from chart parameter or handle clicks outside candle range
    let time = param.time;

    // If no time (clicked outside candle range), calculate it from logical coordinates
    if (
      !time &&
      param.point &&
      this._candleData &&
      this._candleData.length > 0
    ) {
      const timeScale = this._chart.timeScale();
      const logicalIndex = timeScale.coordinateToLogical(param.point.x);

      if (logicalIndex !== null) {
        // Calculate time from logical index using candle data
        time = logicalIndexToTime(logicalIndex, this._candleData);
      }
    }

    if (!time) return null;

    const point = { time, price };
    return enhancePointWithLogicalIndex(point, this._candleData);
  }

  /**
   * Gets price from chart event with optional snapping
   * @param {object} param - Chart event parameter
   * @returns {number|null} Price value or null
   */
  _getPriceFromEvent(param) {
    if (!param.point) return null;
    const price = this._series.coordinateToPrice(param.point.y);
    if (this._isSnapping) {
      const candle = param.seriesData.get(this._series);
      return getSnappedPrice(price, candle);
    }
    return price;
  }

  /**
   * Handles chart click events for setting endpoints with hybrid coordinate support
   * @param {object} param - Chart click event parameter
   */
  _onClick = (param) => {
    if (!param.point || param.hoveredSeries) return;

    if (!this._p1) {
      // First click - set first endpoint
      this._p1 = this._getPoint(param);
      if (!this._p1) return; // Failed to get valid point
    } else {
      // Second click - set second endpoint and create retracement
      this._p2 = this._getPoint(param);
      if (!this._p2) return; // Failed to get valid point

      const newFib = new FibRetracement(
        this._p1,
        this._p2,
        this._series,
        this._chart,
        null,
        null,
        this._candleData,
      );
      this._series.attachPrimitive(newFib);
      this._retracements.add(newFib);

      // Add to store
      const { addDrawing } = useDrawingsStore.getState();
      const { ticker } = useChartStore.getState();

      if (ticker) {
        const drawingData = {
          type: "fib_retracement",
          ticker: ticker.replace("/", ""),
          startTime: new Date(this._p1.time * 1000).toISOString(),
          endTime: new Date(this._p2.time * 1000).toISOString(),
          startPrice: this._p1.price,
          endPrice: this._p2.price,
          primitiveId: newFib.id,
        };

        addDrawing(drawingData);
      }

      if (this._onRetracementsChange) {
        this._onRetracementsChange([...this._retracements]);
      }
      if (this._onRetracementCreated) {
        this._onRetracementCreated(newFib);
      }
      if (this._onToolChanged) {
        this._onToolChanged();
      }
      this._onDrawingFinished();
      this._p1 = null;
      this._p2 = null;
      this._removePreviewRetracement();
    }
  };

  /**
   * Handles crosshair move events for preview retracement with hybrid coordinate support
   * @param {object} param - Crosshair move event parameter
   */
  _onCrosshairMove = (param) => {
    if (!this._p1 || !param.point) {
      this._removePreviewRetracement();
      return;
    }

    const p2 = this._getPoint(param);
    if (!p2) {
      this._removePreviewRetracement();
      return;
    }

    if (this._previewRetracement) {
      this._previewRetracement.updateEndPoint(p2);
    } else {
      this._previewRetracement = new PreviewFibRetracement(
        this._p1,
        p2,
        this._series,
        this._chart,
        this._candleData,
      );
      this._series.attachPrimitive(this._previewRetracement);
    }
  };

  /**
   * Called when drawing is finished - cleans up preview
   */
  _onDrawingFinished = () => {
    this._removePreviewRetracement();
  };

  /**
   * Removes a retracement from the chart and store
   * @param {FibRetracement} fib - The retracement to remove
   */
  _removeRetracement(fib) {
    // Remove from chart first
    if (fib && this._series) {
      this._series.detachPrimitive(fib);
    }

    // Remove from store
    const { drawings, removeDrawing } = useDrawingsStore.getState();
    if (fib && fib.id) {
      // Find the drawing by primitiveId
      const drawing = drawings.find((d) => d.primitiveId === fib.id);
      if (drawing) {
        removeDrawing(drawing.id);
      }
    }

    // Remove from internal tracking
    if (fib) {
      this._retracements.delete(fib);
      if (this._onRetracementsChange) {
        this._onRetracementsChange([...this._retracements]);
      }
    }
  }

  /**
   * Removes a retracement from chart only (without removing from store)
   * @param {FibRetracement} fib - The retracement to remove
   */
  _removeRetracementFromChartOnly(fib) {
    // Remove from chart only
    if (fib && this._series) {
      this._series.detachPrimitive(fib);
    }

    // Remove from internal tracking
    if (fib) {
      this._retracements.delete(fib);
      if (this._onRetracementsChange) {
        this._onRetracementsChange([...this._retracements]);
      }
    }
  }

  /**
   * Removes the preview retracement
   */
  _removePreviewRetracement() {
    if (this._previewRetracement) {
      this._series.detachPrimitive(this._previewRetracement);
      this._previewRetracement = null;
    }
  }

  /**
   * Deletes all retracements and cleans up
   */
  deleteAll() {
    // Remove each retracement from chart and store
    this._retracements.forEach((fib) => {
      this._removeRetracement(fib);
    });
    this._retracements.clear();
    if (this._onRetracementsChange) {
      this._onRetracementsChange([]);
    }
  }

  /**
   * Set the selected fib retracement ID for all retracements (for selection logic)
   * @param {string|null} selectedId - ID of selected retracement
   */
  setSelectedFibRetracementId(selectedId) {
    this._selectedFibRetracementId = selectedId;
    this._retracements.forEach((fib) =>
      fib.setSelectedFibRetracementId(selectedId),
    );
  }
}
