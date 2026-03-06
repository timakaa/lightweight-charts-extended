// BasePositionDrawingTool.js - Abstract base class for position drawing tools (long/short)
import {
  enhancePointWithLogicalIndex,
  logicalIndexToTime,
} from "@helpers/coordinateUtils.js";
import { useDrawingsStore } from "@store/drawings.js";
import { useChartStore } from "@store/chart.js";

/**
 * BasePositionDrawingTool - Base class for position drawing tools
 *
 * Drawing tools are manager classes that handle user interaction and create primitives.
 * They do NOT extend PluginBase because they are not attached to the chart as primitives.
 *
 * Provides common functionality for position tools including:
 * - Single-click drawing (calculates entry/target/stop from one click)
 * - Event handling and drawing state management
 * - Store persistence
 * - Coordinate conversion with hybrid coordinate support
 *
 * Subclasses must implement:
 * - _getDrawingType() - Returns the drawing type string ("long_position", "short_position")
 * - _calculatePrices(entryPrice) - Returns {targetPrice, stopPrice} based on entry
 */
export class BasePositionDrawingTool {
  _series;
  _positions = new Set();
  _drawing = false;
  _onToolChanged;
  _onPositionsChange;
  _onPositionCreated;
  _isSnapping = false;
  _selectedPositionId;
  _candleData;
  _hoveredPositionId;
  _activeResizeHandleRef;
  _PositionClass;

  constructor(
    chart,
    series,
    onToolChanged,
    options,
    onPositionsChange,
    onPositionCreated,
    candleData,
    activeResizeHandleRef,
    PositionClass,
  ) {
    this._chart = chart;
    this._series = series;
    this._onToolChanged = onToolChanged;
    this._options = options || {};
    this._onPositionsChange = onPositionsChange;
    this._onPositionCreated = onPositionCreated;
    this._candleData = candleData;
    this._activeResizeHandleRef = activeResizeHandleRef;
    this._PositionClass = PositionClass;
  }

  // ============================================================================
  // Abstract methods - must be implemented by subclasses
  // ============================================================================

  /**
   * Get the drawing type for store persistence
   * @returns {string} Drawing type ("long_position", "short_position")
   */
  _getDrawingType() {
    throw new Error("_getDrawingType() must be implemented by subclass");
  }

  /**
   * Calculate target and stop prices based on entry price
   * @param {number} entryPrice - The entry price
   * @returns {{targetPrice: number, stopPrice: number}} Target and stop prices
   */
  _calculatePrices(entryPrice) {
    throw new Error("_calculatePrices() must be implemented by subclass");
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Remove all positions from the chart
   */
  remove() {
    this._positions.forEach((pos) => this._removePosition(pos));
    this._positions.clear();
  }

  /**
   * Remove all positions from chart without removing from store
   */
  removeFromChartOnly() {
    this._positions.forEach((pos) => this._removePositionFromChartOnly(pos));
    this._positions.clear();
  }

  /**
   * Start drawing mode: subscribe to chart and document events
   */
  startDrawing() {
    if (this._drawing) return;
    this._drawing = true;
    this._chart.subscribeClick(this._onClick);
    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("keyup", this._onKeyUp);
  }

  /**
   * Stop drawing mode: unsubscribe from events and reset state
   */
  stopDrawing() {
    if (!this._drawing) return;
    this._drawing = false;
    this._chart.unsubscribeClick(this._onClick);
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
  }

  /**
   * Delete all positions from the chart
   */
  deleteAll() {
    this.remove();
  }

  /**
   * Update candle data for coordinate calculations
   */
  updateCandleData(candleData) {
    this._candleData = candleData;

    // Update candleData on all existing positions
    this._positions.forEach((position) => {
      if (position && position.updateCandleData) {
        position.updateCandleData(candleData);
        if (position.requestUpdate) {
          position.requestUpdate();
        }
      }
    });
  }

  /**
   * Set the selected position ID and notify all positions
   */
  setSelectedPositionId(selectedPositionId) {
    this._selectedPositionId = selectedPositionId;
    this._positions.forEach((position) => {
      if (position && position.setSelectedPositionId) {
        position.setSelectedPositionId(selectedPositionId);
      }
    });
  }

  /**
   * Set the hovered position ID and notify all positions
   */
  setHoveredPositionId(hoveredPositionId) {
    this._hoveredPositionId = hoveredPositionId;
    this._positions.forEach((position) => {
      if (position && position.setHoveredPositionId) {
        position.setHoveredPositionId(hoveredPositionId);
      }
    });
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Key down handler: enable snapping or cancel drawing
   */
  _onKeyDown = (e) => {
    if (e.key === "Escape") {
      if (this._drawing) {
        if (this._onToolChanged) this._onToolChanged();
        e.preventDefault();
      }
    }
    if (e.key === "Control" || e.key === "Meta") {
      this._isSnapping = true;
    }
  };

  /**
   * Key up handler: disable snapping
   */
  _onKeyUp = (e) => {
    if (e.key === "Control" || e.key === "Meta") {
      this._isSnapping = false;
    }
  };

  /**
   * Handle chart click: single click creates position with calculated prices
   */
  _onClick = (param) => {
    if (!param.point) return;
    if (!this._candleData || this._candleData.length === 0) return;

    // Get entry point with hybrid coordinate support
    const entryPoint = this._getPoint(param);
    if (!entryPoint || entryPoint.price == null) return;

    // Calculate target time (2% of visible bars to the right)
    const targetTime = this._calculateTargetTime(entryPoint);
    if (!targetTime) return;

    // Calculate target and stop prices based on entry
    const { targetPrice, stopPrice } = this._calculatePrices(entryPoint.price);

    // Create position
    const newPosition = this._createPosition(
      entryPoint.price,
      targetPrice,
      stopPrice,
      entryPoint.time,
      targetTime,
    );

    // Attach to chart
    this._series.attachPrimitive(newPosition);
    if (typeof newPosition.attached === "function") {
      newPosition.attached({
        chart: this._chart,
        series: this._series,
      });
    }

    // Add to collection
    this._positions.add(newPosition);

    // Trigger callbacks
    if (this._onPositionsChange) {
      this._onPositionsChange([...this._positions]);
    }
    if (this._onPositionCreated) {
      this._onPositionCreated(newPosition);
    }
    if (this._onToolChanged) {
      this._onToolChanged();
    }

    this._isSnapping = false;
  };

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Convert chart event param to logical point with hybrid coordinate support
   */
  _getPoint(param) {
    const price = this._getPriceFromEvent(param);
    if (!price) return null;

    let time = param.time;

    // Handle clicks outside candle range using logical coordinates
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
   * Get price from event (no snapping for positions)
   */
  _getPriceFromEvent(param) {
    if (!param.point) return null;
    return this._series.coordinateToPrice(param.point.y);
  }

  /**
   * Calculate target time (2% of visible bars to the right of entry)
   */
  _calculateTargetTime(entryPoint) {
    const logicalRange = this._chart.timeScale().getVisibleLogicalRange();
    if (!logicalRange) return null;

    const visibleBars = logicalRange.to - logicalRange.from;
    const timeOffset = Math.max(1, Math.round(visibleBars * 0.02)); // 2% of visible bars

    let targetTime, targetLogicalIndex;

    if (
      entryPoint.logicalIndex !== undefined &&
      entryPoint.logicalIndex !== null
    ) {
      // Use logical index for positioning (works outside data range)
      targetLogicalIndex = entryPoint.logicalIndex + timeOffset;

      // Calculate target time from logical index
      if (
        targetLogicalIndex >= 0 &&
        targetLogicalIndex < this._candleData.length
      ) {
        // Within data range - use actual candle time
        targetTime = this._candleData[Math.floor(targetLogicalIndex)].time;
      } else if (this._candleData.length >= 2) {
        // Outside data range - calculate time using interval
        const interval =
          this._candleData[this._candleData.length - 1].time -
          this._candleData[this._candleData.length - 2].time;

        if (targetLogicalIndex >= this._candleData.length) {
          // After last candle
          const extraSteps = targetLogicalIndex - (this._candleData.length - 1);
          targetTime =
            this._candleData[this._candleData.length - 1].time +
            extraSteps * interval;
        } else if (targetLogicalIndex < 0) {
          // Before first candle
          const interval = this._candleData[1].time - this._candleData[0].time;
          targetTime = this._candleData[0].time + targetLogicalIndex * interval;
        }
      }
    } else if (entryPoint.time) {
      // Fallback to time-based calculation
      const entryIndex = this._candleData.findIndex(
        (c) => c.time === entryPoint.time,
      );
      if (entryIndex !== -1) {
        const targetIndex = entryIndex + timeOffset;
        if (targetIndex < this._candleData.length) {
          targetTime = this._candleData[targetIndex].time;
        } else {
          // Calculate time beyond data range
          const interval =
            this._candleData[this._candleData.length - 1].time -
            this._candleData[this._candleData.length - 2].time;
          const extraSteps = targetIndex - (this._candleData.length - 1);
          targetTime =
            this._candleData[this._candleData.length - 1].time +
            extraSteps * interval;
        }
      }
    }

    // Final fallback
    if (!targetTime && entryPoint.time && this._candleData.length >= 2) {
      const avgInterval =
        (this._candleData[this._candleData.length - 1].time -
          this._candleData[0].time) /
        (this._candleData.length - 1);
      targetTime = entryPoint.time + timeOffset * avgInterval;
    }

    return targetTime;
  }

  /**
   * Create a position with enhanced points
   */
  _createPosition(entryPrice, targetPrice, stopPrice, startTime, endTime) {
    const position = new this._PositionClass(
      entryPrice,
      targetPrice,
      stopPrice,
      startTime,
      endTime,
      this._series,
      this._chart,
      this._selectedPositionId,
      this._activeResizeHandleRef,
      this._candleData,
    );

    // Apply custom options if provided
    if (this._options && Object.keys(this._options).length > 0) {
      position.applyOptions(this._options);
    }

    // Save to persistent store
    this._savePositionToStore(position);

    return position;
  }

  /**
   * Remove a position from the chart and store
   */
  _removePosition(position) {
    this._series.detachPrimitive(position);
    this._positions.delete(position);
    this._removePositionFromStore(position);

    if (this._onPositionsChange) {
      this._onPositionsChange([...this._positions]);
    }
  }

  /**
   * Remove a position from chart only (without removing from store)
   */
  _removePositionFromChartOnly(position) {
    this._series.detachPrimitive(position);
    this._positions.delete(position);

    if (this._onPositionsChange) {
      this._onPositionsChange([...this._positions]);
    }
  }

  // ============================================================================
  // Store Persistence
  // ============================================================================

  /**
   * Save position data to persistent store
   */
  _savePositionToStore(position) {
    // Don't save drawings when in backtest mode
    if (window.location.pathname.startsWith("/backtest/")) return;

    const { addDrawing } = useDrawingsStore.getState();
    const { ticker } = useChartStore.getState();

    if (!ticker) return;

    const positionData = {
      type: this._getDrawingType(),
      ticker: ticker.replace("/", ""),
      startTime: new Date(position._startTime * 1000).toISOString(),
      endTime: new Date(position._endTime * 1000).toISOString(),
      entryPrice: position._entryPrice.price,
      targetPrice: position._targetPrice.price,
      stopPrice: position._stopPrice.price,
      primitiveId: position.id,
      style: {},
    };

    addDrawing(positionData);
  }

  /**
   * Remove position data from persistent store
   */
  _removePositionFromStore(position) {
    const { drawings, removeDrawing } = useDrawingsStore.getState();

    // Find the drawing by primitiveId
    const drawing = drawings.find((d) => d.primitiveId === position.id);

    if (drawing) {
      removeDrawing(drawing.id);
    }
  }
}
