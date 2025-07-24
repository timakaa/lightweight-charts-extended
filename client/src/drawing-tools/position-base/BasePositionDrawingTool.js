// BasePositionDrawingTool.js - Abstract base class for position drawing tools (long/short)
import PluginBase from "../PluginBase.js";
import {
  enhancePointWithLogicalIndex,
  logicalIndexToTime,
} from "../../helpers/coordinateUtils.js";

// BasePositionDrawingTool provides common logic for drawing tools that manage position primitives
export class BasePositionDrawingTool extends PluginBase {
  _series;
  _entry = null;
  _target = null;
  _stop = null;
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
    onPositionsChange,
    onPositionCreated,
    candleData,
    activeResizeHandleRef,
    PositionClass,
  ) {
    super();
    // Chart and series references
    this._chart = chart;
    this._series = series;
    // Callbacks for tool state and position changes
    this._onToolChanged = onToolChanged;
    this._onPositionsChange = onPositionsChange;
    this._onPositionCreated = onPositionCreated;
    // Candle data for hybrid coordinate calculations
    this._candleData = candleData;
    // Ref for active resize handle (for UI feedback)
    this._activeResizeHandleRef = activeResizeHandleRef;
    // The Position class to instantiate (LongPosition/ShortPosition)
    this._PositionClass = PositionClass;
  }

  // Remove all positions from the chart
  remove() {
    this._positions.forEach((pos) => this._removePosition(pos));
    this._positions.clear();
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
    this._entry = null;
    this._target = null;
    this._stop = null;
    this._chart.unsubscribeClick(this._onClick);
    this._chart.unsubscribeCrosshairMove(this._onCrosshairMove);
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
  }

  // Key down handler: enable snapping or cancel drawing
  _onKeyDown = (e) => {
    if (e.key === "Escape") {
      if (this._drawing && this._entry) {
        this._entry = null;
        this._target = null;
        this._stop = null;
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

  // Get price from event
  _getPriceFromEvent(param) {
    if (!param.point) return null;
    const price = this._series.coordinateToPrice(param.point.y);
    return price;
  }

  // Handle chart click: set entry, target, stop, and create position
  _onClick = (param) => {
    if (!param.point) return;

    if (!this._entry) {
      // First click: entry
      this._entry = this._getPoint(param);
    } else if (!this._target) {
      // Second click: target
      this._target = this._getPoint(param);
    } else {
      // Third click: stop, finalize
      this._stop = this._getPoint(param);

      const newPosition = this._createPosition(
        this._entry.price,
        this._target.price,
        this._stop.price,
        this._entry.time,
        this._target.time,
      );

      this._series.attachPrimitive(newPosition);
      if (typeof newPosition.attached === "function") {
        newPosition.attached({
          chart: this._chart,
          series: this._series,
        });
      }
      this._positions.add(newPosition);
      if (this._onPositionsChange) {
        this._onPositionsChange([...this._positions]);
      }
      if (this._onPositionCreated) {
        this._onPositionCreated(newPosition);
      }
      if (this._onToolChanged) {
        this._onToolChanged();
      }
      this._onDrawingFinished();
      this._entry = null;
      this._target = null;
      this._stop = null;
      this._isSnapping = false;
    }
  };

  // Handle crosshair move (no preview logic needed)
  _onCrosshairMove = () => {
    // No preview logic needed
  };

  // Called when drawing is finished (after position creation)
  _onDrawingFinished = () => {
    // Reset points so user can draw another position
    // Tool is stopped from the outside
  };

  // Remove a position primitive from the chart and update state
  _removePosition(position) {
    this._series.detachPrimitive(position);
    this._positions.delete(position);
    if (this._onPositionsChange) {
      this._onPositionsChange([...this._positions]);
    }
  }

  // Delete all positions from the chart
  deleteAll() {
    this.remove();
  }

  // Update candle data for coordinate calculations
  updateCandleData(candleData) {
    this._candleData = candleData;

    // Update candleData on all existing positions and trigger re-render
    this._positions.forEach((position) => {
      if (position && position.updateCandleData) {
        position.updateCandleData(candleData);
        // Trigger re-render by requesting update
        if (position.requestUpdate) {
          position.requestUpdate();
        }
      }
    });
  }

  // Set the selected position ID and notify all positions
  setSelectedPositionId(selectedPositionId) {
    this._selectedPositionId = selectedPositionId;
    this._positions.forEach((position) => {
      if (position && position.setSelectedPositionId) {
        position.setSelectedPositionId(selectedPositionId);
      }
    });
  }

  // Set the hovered position ID and notify all positions
  setHoveredPositionId(hoveredPositionId) {
    this._hoveredPositionId = hoveredPositionId;
    this._positions.forEach((position) => {
      if (position && position.setHoveredPositionId) {
        position.setHoveredPositionId(hoveredPositionId);
      }
    });
  }

  // Create a position with enhanced points
  _createPosition(entryPrice, targetPrice, stopPrice, startTime, endTime) {
    return new this._PositionClass(
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
  }
}
