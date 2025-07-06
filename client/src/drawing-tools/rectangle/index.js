import PluginBase from "../PluginBase.js";
import { Rectangle, PreviewRectangle } from "./Rectangle.js";
import { getSnappedPrice } from "../helpers.js";
import {
  logicalIndexToTime,
  enhancePointWithLogicalIndex,
} from "../../helpers/coordinateUtils.js";
import { useDrawingsStore } from "../../store/drawings.js";
import { useChartStore } from "../../store/chart.js";

// index.js - Implements the RectangleDrawingTool for managing rectangle (box) drawing interactions on the chart
// RectangleDrawingTool manages the creation, drawing, and management of rectangle primitives on the chart
export class RectangleDrawingTool extends PluginBase {
  _series;
  _p1 = null;
  _p2 = null;
  _rectangles = new Set();
  _previewRectangle = null;
  _drawing = false;
  _onToolChanged;
  _onBoxesChange;
  _onBoxCreated;
  _isSnapping = false;
  _selectedBoxId;
  _activeResizeHandleRef;
  _candleData;

  constructor(
    chart,
    series,
    onToolChanged,
    options,
    onBoxesChange,
    onBoxCreated,
    activeResizeHandleRef,
    candleData = null,
  ) {
    super();
    // Chart and series references
    this._chart = chart;
    this._series = series;
    // Callback for when the tool changes (e.g., drawing finished)
    this._onToolChanged = onToolChanged;
    // Callback for when the set of rectangles changes
    this._onBoxesChange = onBoxesChange;
    // Callback for when a new rectangle is created
    this._onBoxCreated = onBoxCreated;
    // Ref for active resize handle (for UI feedback)
    this._activeResizeHandleRef = activeResizeHandleRef;
    // Candle data for coordinate calculations
    this._candleData = candleData;
  }

  // Remove all rectangles and preview rectangle from the chart
  remove() {
    this._rectangles.forEach((rect) => this._removeRectangle(rect));
    this._rectangles.clear();
    this._removePreviewRectangle();
  }

  // Remove all rectangles from chart without removing from store (for ticker/timeframe changes)
  removeFromChartOnly() {
    this._rectangles.forEach((rect) =>
      this._removeRectangleFromChartOnly(rect),
    );
    this._rectangles.clear();
    this._removePreviewRectangle();
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
    this._removePreviewRectangle();
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
        this._removePreviewRectangle();
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

  // Handle chart click: set p1 or p2, create rectangle, and reset state
  _onClick = (param) => {
    if (!param.point) return;

    if (!this._p1) {
      // First click: set first endpoint
      this._p1 = this._getPoint(param);
    } else {
      // Second click: set second endpoint and create rectangle
      this._p2 = this._getPoint(param);

      const newBox = new Rectangle(
        this._p1,
        this._p2,
        this._series,
        this._chart,
        this._selectedBoxId,
        this._activeResizeHandleRef,
        this._candleData,
      );
      this._series.attachPrimitive(newBox);
      this._rectangles.add(newBox);

      // Save rectangle to persistent store
      this._saveRectangleToStore(newBox);

      if (this._onBoxesChange) {
        this._onBoxesChange([...this._rectangles]);
      }
      if (this._onBoxCreated) {
        this._onBoxCreated(newBox);
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

  // Handle crosshair move: update preview rectangle endpoint
  _onCrosshairMove = (param) => {
    if (!this._p1 || !param.point) return;

    this._p2 = this._getPoint(param);

    // Create or update preview rectangle
    if (!this._previewRectangle) {
      this._previewRectangle = new PreviewRectangle(
        this._p1,
        this._p2,
        this._series,
        this._chart,
        this._candleData,
      );
      this._series.attachPrimitive(this._previewRectangle);
    } else {
      this._previewRectangle.updateEndPoint(this._p2);
    }
  };

  // Called when drawing is finished (after rectangle creation)
  _onDrawingFinished = () => {
    this._removePreviewRectangle();
    // We don't want to stop drawing, just reset the points
    // so the user can draw another rectangle.
    // The tool is stopped from the outside.
  };

  // Remove a rectangle primitive from the chart and update state
  _removeRectangle(rectangle) {
    this._series.detachPrimitive(rectangle);
    this._rectangles.delete(rectangle);

    // Remove from persistent store
    this._removeRectangleFromStore(rectangle);

    if (this._onBoxesChange) {
      this._onBoxesChange([...this._rectangles]);
    }
  }

  // Remove a rectangle primitive from chart only (without removing from store)
  _removeRectangleFromChartOnly(rectangle) {
    this._series.detachPrimitive(rectangle);
    this._rectangles.delete(rectangle);

    if (this._onBoxesChange) {
      this._onBoxesChange([...this._rectangles]);
    }
  }

  // Remove the preview rectangle from the chart
  _removePreviewRectangle() {
    if (this._previewRectangle) {
      this._series.detachPrimitive(this._previewRectangle);
      this._previewRectangle = null;
    }
  }

  // Delete all rectangles from the chart
  deleteAll() {
    this.remove();
  }

  // Set the currently selected box ID (for selection logic)
  setSelectedBoxId(selectedBoxId) {
    this._selectedBoxId = selectedBoxId;

    // Update all existing rectangles with the new selection state
    this._rectangles.forEach((rect) => {
      if (rect && rect.setSelectedBoxId) {
        rect.setSelectedBoxId(selectedBoxId);
        // Trigger re-render for axis label visibility changes
        if (rect.requestUpdate) {
          rect.requestUpdate();
        }
      }
    });
  }

  // Set the active resize handle ref (for UI feedback)
  setActiveResizeHandle(activeResizeHandleRef) {
    this._activeResizeHandleRef = activeResizeHandleRef;
  }

  // Update candle data for coordinate calculations
  updateCandleData(candleData) {
    this._candleData = candleData;

    // Update candleData on all existing rectangles and trigger re-render
    this._rectangles.forEach((rect) => {
      if (rect && rect.updateCandleData) {
        rect.updateCandleData(candleData);
        // Trigger re-render by requesting update
        if (rect.requestUpdate) {
          rect.requestUpdate();
        }
      }
    });

    // Update preview rectangle if it exists
    if (this._previewRectangle && this._previewRectangle.updateCandleData) {
      this._previewRectangle.updateCandleData(candleData);
    }
  }

  // Save rectangle data to persistent store
  _saveRectangleToStore(rectangle) {
    const { addDrawing } = useDrawingsStore.getState();
    const { ticker } = useChartStore.getState();

    if (!ticker) return;

    const rectangleData = {
      type: "rectangle",
      ticker: ticker.replace("/", ""),
      startTime: new Date(rectangle._p1.time * 1000).toISOString(),
      endTime: new Date(rectangle._p2.time * 1000).toISOString(),
      startPrice: rectangle._p1.price,
      endPrice: rectangle._p2.price,
      primitiveId: rectangle.id, // Link to the primitive object
      style: {
        borderColor: rectangle._options.borderColor || "#FF0000",
        borderWidth: rectangle._options.borderWidth || 2,
        fillColor: rectangle._options.fillColor || "rgba(255, 0, 0, 0.1)",
      },
    };

    addDrawing(rectangleData);
  }

  // Remove rectangle data from persistent store
  _removeRectangleFromStore(rectangle) {
    const { drawings, removeDrawing } = useDrawingsStore.getState();

    // Find the drawing by primitiveId
    const drawing = drawings.find((d) => d.primitiveId === rectangle.id);

    if (drawing) {
      removeDrawing(drawing.id);
    }
  }
}
