import PluginBase from "../PluginBase.js";
import { getSnappedPrice } from "../helpers.js";
// No snapping helpers for now, but can add if needed
import { Line, PreviewLine } from "./Line.js";
import {
  logicalIndexToTime,
  enhancePointWithLogicalIndex,
} from "../../helpers/coordinateUtils";
import { useDrawingsStore } from "../../store/drawings.js";
import { useChartStore } from "../../store/chart.js";

// index.js - Implements the LineDrawingTool for managing line drawing interactions on the chart
// LineDrawingTool manages the creation, drawing, and management of line primitives on the chart
export class LineDrawingTool extends PluginBase {
  _series;
  _p1 = null;
  _p2 = null;
  _lines = new Set();
  _previewLine = null;
  _drawing = false;
  _onToolChanged;
  _onLinesChange;
  _onLineCreated;
  _isSnapping = false;
  _isConstrained = false;
  _lastCrosshairParam = null;
  _selectedLineId = null;
  _activeResizeHandleRef;
  _candleData;

  constructor(
    chart,
    series,
    onToolChanged,
    options,
    onLinesChange,
    onLineCreated,
    activeResizeHandleRef,
    candleData = null,
  ) {
    super();
    // Chart and series references
    this._chart = chart;
    this._series = series;
    // Callback for when the tool changes (e.g., drawing finished)
    this._onToolChanged = onToolChanged;
    // Callback for when the set of lines changes
    this._onLinesChange = onLinesChange;
    // Callback for when a new line is created
    this._onLineCreated = onLineCreated;
    // Currently selected line ID
    this._selectedLineId = null;
    // Ref for active resize handle (for UI feedback)
    this._activeResizeHandleRef = activeResizeHandleRef;
    // Candle data for coordinate calculations
    this._candleData = candleData;
  }

  // Set the selected line ID and update all lines
  setSelectedLineId(selectedLineId) {
    this._selectedLineId = selectedLineId;
    // Update all lines with the new selectedLineId
    this._lines.forEach((line) => {
      if (line.setSelectedLineId) {
        line.setSelectedLineId(selectedLineId);
      }
    });
    if (this._previewLine && this._previewLine.setSelectedLineId) {
      this._previewLine.setSelectedLineId(selectedLineId);
    }
  }

  // Remove all lines and preview line from the chart
  remove() {
    this._lines.forEach((line) => this._removeLine(line));
    this._lines.clear();
    this._removePreviewLine();
  }

  // Remove all lines from chart without removing from store (for ticker/timeframe changes)
  removeFromChartOnly() {
    this._lines.forEach((line) => this._removeLineFromChartOnly(line));
    this._lines.clear();
    this._removePreviewLine();
  }

  // Start drawing mode: subscribe to chart and document events
  startDrawing() {
    if (this._drawing) return;
    this._drawing = true;
    this._chart
      .chartElement()
      .addEventListener("mousedown", this._onMouseDown, { capture: true });
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
    this._removePreviewLine();
    this._chart
      .chartElement()
      .removeEventListener("mousedown", this._onMouseDown, { capture: true });
    this._chart.unsubscribeClick(this._onClick);
    this._chart.unsubscribeCrosshairMove(this._onCrosshairMove);
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
  }

  // Mouse down handler: check for constraint mode (shift key)
  _onMouseDown = (e) => {
    this._isConstrained = e.shiftKey;
  };

  // Key down handler: enable snapping or constraint mode
  _onKeyDown = (e) => {
    if (e.key === "Control" || e.key === "Meta") this._isSnapping = true;
    if (e.key === "Shift") {
      if (!this._isConstrained) {
        this._isConstrained = true;
        if (this._drawing && this._p1 && this._lastCrosshairParam) {
          this._onCrosshairMove(this._lastCrosshairParam);
        }
      }
    }
  };

  // Key up handler: disable snapping or constraint mode
  _onKeyUp = (e) => {
    if (e.key === "Escape") {
      if (this._drawing && this._p1) {
        this._p1 = null;
        this._p2 = null;
        this._removePreviewLine();
        if (this._onToolChanged) this._onToolChanged();
        e.preventDefault();
      }
    }
    if (e.key === "Control" || e.key === "Meta") this._isSnapping = false;
    if (e.key === "Shift") {
      if (this._isConstrained) {
        this._isConstrained = false;
        if (this._drawing && this._p1 && this._lastCrosshairParam) {
          this._onCrosshairMove(this._lastCrosshairParam);
        }
      }
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

  // Handle chart click: set p1 or p2, create line, and reset state
  _onClick = (param) => {
    if (!param.point) return;

    if (!this._p1) {
      // First click: set first endpoint
      this._p1 = this._getPoint(param);
      if (!this._p1) return; // Skip if point couldn't be calculated
    } else {
      // Second click: set second endpoint and create line
      this._p2 = this._getPoint(param);
      if (!this._p2) return; // Skip if point couldn't be calculated

      if (this._isConstrained) {
        this._p2.price = this._p1.price;
      }

      // Create and attach new line primitive
      const newLine = new Line(
        this._p1,
        this._p2,
        this._series,
        this._chart,
        this._selectedLineId,
        this._activeResizeHandleRef,
        this._candleData,
      );
      this._series.attachPrimitive(newLine);
      this._lines.add(newLine);

      // Save line to persistent store
      this._saveLineToStore(newLine);

      if (this._onLinesChange) this._onLinesChange([...this._lines]);
      if (this._onLineCreated) this._onLineCreated(newLine);
      if (this._onToolChanged) this._onToolChanged();

      this._onDrawingFinished();
      this._p1 = null;
      this._p2 = null;
      this._isSnapping = false;
    }
  };

  // Handle crosshair move: update preview line endpoint
  _onCrosshairMove = (param) => {
    if (!this._p1 || !param.point) return;
    this._lastCrosshairParam = param;

    this._p2 = this._getPoint(param);
    if (!this._p2) return; // Skip if point couldn't be calculated

    if (this._isConstrained) {
      this._p2.price = this._p1.price;
    }

    // Create or update preview line
    if (!this._previewLine) {
      this._previewLine = new PreviewLine(
        this._p1,
        this._p2,
        this._series,
        this._chart,
        this._selectedLineId,
        this._candleData,
      );
      this._series.attachPrimitive(this._previewLine);
    } else {
      this._previewLine.updateEndPoint(this._p2);
      if (this._previewLine.setSelectedLineId) {
        this._previewLine.setSelectedLineId(this._selectedLineId);
      }
    }
  };

  // Called when drawing is finished (after line creation)
  _onDrawingFinished = () => {
    this._removePreviewLine();
    // We don't want to stop drawing, just reset the points
    // so the user can draw another line.
    // The tool is stopped from the outside.
  };

  // Remove a line primitive from the chart and update state
  _removeLine(line) {
    this._series.detachPrimitive(line);
    this._lines.delete(line);

    // Remove from persistent store
    this._removeLineFromStore(line);

    if (this._onLinesChange) {
      this._onLinesChange([...this._lines]);
    }
  }

  // Remove a line primitive from chart only (without removing from store)
  _removeLineFromChartOnly(line) {
    this._series.detachPrimitive(line);
    this._lines.delete(line);

    if (this._onLinesChange) {
      this._onLinesChange([...this._lines]);
    }
  }

  // Remove the preview line from the chart
  _removePreviewLine() {
    if (this._previewLine) {
      this._series.detachPrimitive(this._previewLine);
      this._previewLine = null;
    }
  }

  // Delete all lines from the chart
  deleteAll() {
    this.remove();
  }

  // Set the active resize handle for all rectangles (for UI feedback)
  setActiveResizeHandle(activeResizeHandleRef) {
    this._activeResizeHandleRef = activeResizeHandleRef;
    this._rectangles.forEach((rect) => {
      rect.setActiveResizeHandle(activeResizeHandleRef);
      rect.updateAllViews(); // Force redraw
    });
  }

  // Update candle data for coordinate calculations
  updateCandleData(candleData) {
    this._candleData = candleData;

    // Update candleData on all existing lines and trigger re-render
    this._lines.forEach((line) => {
      if (line && line.updateCandleData) {
        line.updateCandleData(candleData);
        // Trigger re-render by requesting update
        if (line.requestUpdate) {
          line.requestUpdate();
        }
      }
    });

    // Update preview line if it exists
    if (this._previewLine && this._previewLine.updateCandleData) {
      this._previewLine.updateCandleData(candleData);
    }
  }

  // Save line data to persistent store
  _saveLineToStore(line) {
    const { addDrawing } = useDrawingsStore.getState();
    const { ticker } = useChartStore.getState();

    if (!ticker) return;

    const lineData = {
      type: "line",
      ticker: ticker.replace("/", ""),
      startTime: new Date(line._p1.time * 1000).toISOString(),
      endTime: new Date(line._p2.time * 1000).toISOString(),
      startPrice: line._p1.price,
      endPrice: line._p2.price,
      primitiveId: line.id, // Link to the primitive object
      style: {
        color: line._options.color,
        width: line._options.width || 2,
        style: "solid",
      },
    };

    addDrawing(lineData);
  }

  // Remove line data from persistent store
  _removeLineFromStore(line) {
    const { drawings, removeDrawing } = useDrawingsStore.getState();

    // Find the drawing by primitiveId
    const drawing = drawings.find((d) => d.primitiveId === line.id);

    if (drawing) {
      removeDrawing(drawing.id);
    }
  }
}
