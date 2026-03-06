import { getSnappedPrice } from "./helpers.js";
import {
  logicalIndexToTime,
  enhancePointWithLogicalIndex,
} from "@helpers/coordinateUtils.js";
import { useDrawingsStore } from "@store/drawings.js";
import { useChartStore } from "@store/chart.js";

/**
 * BaseDrawingTool - Abstract base class for all drawing tools
 *
 * Drawing tools are manager classes that handle user interaction and create primitives.
 * They do NOT extend PluginBase because they are not attached to the chart as primitives.
 *
 * Provides common functionality for drawing tools including:
 * - Event handling (click, crosshair move, keyboard shortcuts)
 * - Drawing state management (p1, p2, preview)
 * - Snapping and constraint modes
 * - Store persistence
 * - Coordinate conversion
 *
 * Subclasses must implement:
 * - createPrimitive(p1, p2) - Factory method to create the specific primitive type
 * - createPreviewPrimitive(p1, p2) - Factory method to create preview primitive
 * - getPrimitiveCollection() - Returns the Set containing primitives (_lines, _rectangles, etc.)
 * - getDrawingType() - Returns the drawing type string ("line", "rectangle", etc.)
 * - getStoreData(primitive) - Returns the data object to save to store
 */
export class BaseDrawingTool {
  _series;
  _p1 = null;
  _p2 = null;
  _primitives = new Set();
  _previewPrimitive = null;
  _drawing = false;
  _onToolChanged;
  _onPrimitivesChange;
  _onPrimitiveCreated;
  _isSnapping = false;
  _selectedPrimitiveId = null;
  _activeResizeHandleRef;
  _candleData;

  constructor(
    chart,
    series,
    onToolChanged,
    options,
    onPrimitivesChange,
    onPrimitiveCreated,
    activeResizeHandleRef,
    candleData = null,
  ) {
    this._chart = chart;
    this._series = series;
    this._onToolChanged = onToolChanged;
    this._options = options || {};
    this._onPrimitivesChange = onPrimitivesChange;
    this._onPrimitiveCreated = onPrimitiveCreated;
    this._activeResizeHandleRef = activeResizeHandleRef;
    this._candleData = candleData;
  }

  // ============================================================================
  // Abstract methods - must be implemented by subclasses
  // ============================================================================

  /**
   * Create a new primitive instance
   * @param {Object} p1 - First point {time, price}
   * @param {Object} p2 - Second point {time, price}
   * @returns {Object} Primitive instance
   */
  createPrimitive(p1, p2) {
    throw new Error("createPrimitive() must be implemented by subclass");
  }

  /**
   * Create a preview primitive instance
   * @param {Object} p1 - First point {time, price}
   * @param {Object} p2 - Second point {time, price}
   * @returns {Object} Preview primitive instance
   */
  createPreviewPrimitive(p1, p2) {
    throw new Error("createPreviewPrimitive() must be implemented by subclass");
  }

  /**
   * Get the drawing type string for store persistence
   * @returns {string} Drawing type ("line", "rectangle", etc.)
   */
  getDrawingType() {
    throw new Error("getDrawingType() must be implemented by subclass");
  }

  /**
   * Get the data object to save to store
   * @param {Object} primitive - The primitive instance
   * @returns {Object} Data object for store
   */
  getStoreData(primitive) {
    throw new Error("getStoreData() must be implemented by subclass");
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Set the selected primitive ID and update all primitives
   */
  setSelectedPrimitiveId(selectedId) {
    this._selectedPrimitiveId = selectedId;
    this._primitives.forEach((primitive) => {
      if (primitive.setSelectedLineId) {
        primitive.setSelectedLineId(selectedId);
      } else if (primitive.setSelectedBoxId) {
        primitive.setSelectedBoxId(selectedId);
      } else if (primitive.setSelectedPositionId) {
        primitive.setSelectedPositionId(selectedId);
      }
    });
    if (this._previewPrimitive) {
      if (this._previewPrimitive.setSelectedLineId) {
        this._previewPrimitive.setSelectedLineId(selectedId);
      } else if (this._previewPrimitive.setSelectedBoxId) {
        this._previewPrimitive.setSelectedBoxId(selectedId);
      }
    }
  }

  /**
   * Remove all primitives and preview from the chart
   */
  remove() {
    this._primitives.forEach((primitive) => this._removePrimitive(primitive));
    this._primitives.clear();
    this._removePreviewPrimitive();
  }

  /**
   * Remove all primitives from chart without removing from store
   */
  removeFromChartOnly() {
    this._primitives.forEach((primitive) =>
      this._removePrimitiveFromChartOnly(primitive),
    );
    this._primitives.clear();
    this._removePreviewPrimitive();
  }

  /**
   * Start drawing mode: subscribe to chart and document events
   */
  startDrawing() {
    if (this._drawing) return;
    this._drawing = true;

    // Subscribe to chart events
    this._chart.subscribeClick(this._onClick);
    this._chart.subscribeCrosshairMove(this._onCrosshairMove);

    // Subscribe to keyboard events
    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("keyup", this._onKeyUp);
  }

  /**
   * Stop drawing mode: unsubscribe from events and reset state
   */
  stopDrawing() {
    if (!this._drawing) return;
    this._drawing = false;
    this._p1 = null;
    this._p2 = null;
    this._removePreviewPrimitive();

    // Unsubscribe from chart events
    this._chart.unsubscribeClick(this._onClick);
    this._chart.unsubscribeCrosshairMove(this._onCrosshairMove);

    // Unsubscribe from keyboard events
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
  }

  /**
   * Delete all primitives from the chart
   */
  deleteAll() {
    this.remove();
  }

  /**
   * Update candle data for coordinate calculations
   */
  updateCandleData(candleData) {
    this._candleData = candleData;

    // Update candleData on all existing primitives
    this._primitives.forEach((primitive) => {
      if (primitive && primitive.updateCandleData) {
        primitive.updateCandleData(candleData);
        if (primitive.requestUpdate) {
          primitive.requestUpdate();
        }
      }
    });

    // Update preview primitive if it exists
    if (this._previewPrimitive && this._previewPrimitive.updateCandleData) {
      this._previewPrimitive.updateCandleData(candleData);
    }
  }

  /**
   * Set the active resize handle ref
   */
  setActiveResizeHandle(activeResizeHandleRef) {
    this._activeResizeHandleRef = activeResizeHandleRef;
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Key down handler: enable snapping or cancel drawing
   */
  _onKeyDown = (e) => {
    // Escape: cancel current drawing
    if (e.key === "Escape") {
      if (this._drawing && this._p1) {
        this._p1 = null;
        this._p2 = null;
        this._removePreviewPrimitive();
        if (this._onToolChanged) this._onToolChanged();
        e.preventDefault();
      }
    }

    // Control/Meta: enable snapping
    if (e.key === "Control" || e.key === "Meta") {
      this._isSnapping = true;
    }
  };

  /**
   * Key up handler: disable snapping
   */
  _onKeyUp = (e) => {
    // Control/Meta: disable snapping
    if (e.key === "Control" || e.key === "Meta") {
      this._isSnapping = false;
    }
  };

  /**
   * Handle chart click: set p1 or p2, create primitive, and reset state
   */
  _onClick = (param) => {
    if (!param.point) return;

    if (!this._p1) {
      // First click: set first endpoint
      this._p1 = this._getPoint(param);
      if (!this._p1) return;
    } else {
      // Second click: set second endpoint and create primitive
      this._p2 = this._getPoint(param);
      if (!this._p2) return;

      // Create new primitive using factory method
      const newPrimitive = this.createPrimitive(this._p1, this._p2);

      // Apply custom options if provided
      if (this._options && Object.keys(this._options).length > 0) {
        newPrimitive.applyOptions(this._options);
      }

      // Attach to chart and add to collection
      this._series.attachPrimitive(newPrimitive);
      this._primitives.add(newPrimitive);

      // Save to persistent store
      this._savePrimitiveToStore(newPrimitive);

      // Trigger callbacks
      if (this._onPrimitivesChange) {
        this._onPrimitivesChange([...this._primitives]);
      }
      if (this._onPrimitiveCreated) {
        this._onPrimitiveCreated(newPrimitive);
      }
      if (this._onToolChanged) {
        this._onToolChanged();
      }

      // Reset state
      this._onDrawingFinished();
      this._p1 = null;
      this._p2 = null;
      this._isSnapping = false;
    }
  };

  /**
   * Handle crosshair move: update preview primitive endpoint
   */
  _onCrosshairMove = (param) => {
    if (!this._p1 || !param.point) return;

    this._p2 = this._getPoint(param);
    if (!this._p2) return;

    // Create or update preview primitive
    if (!this._previewPrimitive) {
      this._previewPrimitive = this.createPreviewPrimitive(this._p1, this._p2);

      // Apply custom options if provided
      if (this._options && Object.keys(this._options).length > 0) {
        this._previewPrimitive.applyOptions(this._options);
      }

      this._series.attachPrimitive(this._previewPrimitive);
    } else {
      this._previewPrimitive.updateEndPoint(this._p2);

      // Update selection state if needed
      if (this._previewPrimitive.setSelectedLineId) {
        this._previewPrimitive.setSelectedLineId(this._selectedPrimitiveId);
      } else if (this._previewPrimitive.setSelectedBoxId) {
        this._previewPrimitive.setSelectedBoxId(this._selectedPrimitiveId);
      }
    }
  };

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Convert chart event param to logical point (time, price) with hybrid coordinate support
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
        time = logicalIndexToTime(logicalIndex, this._candleData);
      }
    }

    if (!time) return null;

    const point = { time, price };
    return enhancePointWithLogicalIndex(point, this._candleData);
  }

  /**
   * Get price from event, with optional snapping to candle
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
   * Called when drawing is finished (after primitive creation)
   */
  _onDrawingFinished = () => {
    this._removePreviewPrimitive();
  };

  /**
   * Remove a primitive from the chart and store
   */
  _removePrimitive(primitive) {
    this._series.detachPrimitive(primitive);
    this._primitives.delete(primitive);
    this._removePrimitiveFromStore(primitive);

    if (this._onPrimitivesChange) {
      this._onPrimitivesChange([...this._primitives]);
    }
  }

  /**
   * Remove a primitive from chart only (without removing from store)
   */
  _removePrimitiveFromChartOnly(primitive) {
    this._series.detachPrimitive(primitive);
    this._primitives.delete(primitive);

    if (this._onPrimitivesChange) {
      this._onPrimitivesChange([...this._primitives]);
    }
  }

  /**
   * Remove the preview primitive from the chart
   */
  _removePreviewPrimitive() {
    if (this._previewPrimitive) {
      this._series.detachPrimitive(this._previewPrimitive);
      this._previewPrimitive = null;
    }
  }

  // ============================================================================
  // Store Persistence
  // ============================================================================

  /**
   * Save primitive data to persistent store
   */
  _savePrimitiveToStore(primitive) {
    // Don't save drawings when in backtest mode
    if (window.location.pathname.startsWith("/backtest/")) return;

    const { addDrawing } = useDrawingsStore.getState();
    const { ticker } = useChartStore.getState();

    if (!ticker) return;

    const drawingData = {
      type: this.getDrawingType(),
      ticker: ticker.replace("/", ""),
      primitiveId: primitive.id,
      ...this.getStoreData(primitive),
    };

    addDrawing(drawingData);
  }

  /**
   * Remove primitive data from persistent store
   */
  _removePrimitiveFromStore(primitive) {
    const { drawings, removeDrawing } = useDrawingsStore.getState();

    // Find the drawing by primitiveId
    const drawing = drawings.find((d) => d.primitiveId === primitive.id);

    if (drawing) {
      removeDrawing(drawing.id);
    }
  }
}
