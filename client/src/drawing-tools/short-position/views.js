// views.js - View logic for short position primitives, handles, and axis overlays
import { HandlesPaneRenderer } from "../long-position/renderers.js";
import { ShortPositionPaneRenderer } from "./renderers.js";
import { getXCoordinate } from "../../helpers/coordinateUtils.js";

export { HandlesPaneView } from "../long-position/views.js";
import {
  LongPositionPriceAxisView,
  LongPositionTimeAxisView,
  LongPositionPriceAxisPaneView,
  LongPositionTimeAxisPaneView,
} from "../long-position/views.js";

// ShortPositionPaneView manages the view for the profit/loss boxes and entry line (short logic)
export class ShortPositionPaneView {
  constructor(source) {
    this._source = source;
    this._p1 = { x: null, y: null };
    this._p2 = { x: null, y: null };
    this._profitBox = null;
    this._lossBox = null;
    this._entryLine = null;
  }

  // Updates the pixel coordinates for the boxes and entry line
  update() {
    const series = this._source._series;
    const chart = this._source._chart;
    if (!series || !chart) return;

    const entry = this._source._entryPrice;
    const target = this._source._targetPrice;
    const stop = this._source._stopPrice;
    if (!entry || !target || !stop) return;
    // Logical box corners: left is min time, right is max time; top is max price, bottom is min price
    const minTime = Math.min(entry.time, target.time);
    const maxTime = Math.max(entry.time, target.time);
    const minPrice = Math.min(entry.price, target.price, stop.price);
    const maxPrice = Math.max(entry.price, target.price, stop.price);
    this._source._p1 = { time: minTime, price: maxPrice };
    this._source._p2 = { time: maxTime, price: minPrice };

    // Convert to screen coordinates for _p1 and _p2 using hybrid coordinate system
    const timeScale = chart.timeScale();
    const candleData = this._source._candleData;
    const x1 = getXCoordinate(this._source._p1, timeScale, candleData);
    const y1 = series.priceToCoordinate(maxPrice);
    const x2 = getXCoordinate(this._source._p2, timeScale, candleData);
    const y2 = series.priceToCoordinate(minPrice);
    this._p1 = { x: x1, y: y1 };
    this._p2 = { x: x2, y: y2 };

    // The width of the boxes should match the horizontal distance between entry and target using hybrid coordinates
    const entryX = getXCoordinate(entry, timeScale, candleData);
    const entryY = series.priceToCoordinate(entry.price);
    const targetX = getXCoordinate(target, timeScale, candleData);
    const targetY = series.priceToCoordinate(target.price);
    const stopY = series.priceToCoordinate(stop.price);

    // Handle null coordinates gracefully
    if (entryX === null || targetX === null) return;

    const leftX = Math.min(entryX, targetX);
    const boxWidth = Math.abs(targetX - entryX);

    // Profit box: from entry to target (for short, profit is below entry)
    this._profitBox = {
      x: leftX,
      y: Math.min(entryY, targetY),
      width: boxWidth,
      height: Math.abs(targetY - entryY),
    };
    // Loss box: from entry to stop (for short, loss is above entry)
    this._lossBox = {
      x: leftX,
      y: Math.min(entryY, stopY),
      width: boxWidth,
      height: Math.abs(stopY - entryY),
    };
    // Entry line (across the box)
    this._entryLine = {
      x1: entryX,
      x2: targetX,
      y: entryY,
    };
  }

  // Returns the renderer for the short position
  renderer() {
    return new ShortPositionPaneRenderer(
      this._profitBox,
      this._lossBox,
      this._entryLine,
      this._source._options,
      this._source,
    );
  }
}

// Axis pane and label views for short position reuse long position logic
export class ShortPositionPriceAxisPaneView extends LongPositionPriceAxisPaneView {}
export class ShortPositionTimeAxisPaneView extends LongPositionTimeAxisPaneView {}
export class ShortPositionPriceAxisView extends LongPositionPriceAxisView {}
export class ShortPositionTimeAxisView extends LongPositionTimeAxisView {}

// ShortHandlesPaneView manages the view for short position resize handles (custom logic)
export class ShortHandlesPaneView {
  constructor(source, activeResizeHandle) {
    this._source = source;
    this._handles = [];
    this._activeResizeHandle = activeResizeHandle;
  }

  // Updates the pixel coordinates for the handles (short logic)
  update() {
    const series = this._source._series;
    const chart = this._source._chart;
    if (!series || !chart) return;
    const timeScale = chart.timeScale();
    const candleData = this._source._candleData;

    this._handles = [];
    if (
      this._source._entryPrice &&
      this._source._targetPrice &&
      this._source._stopPrice
    ) {
      // Entry handle (circle) using hybrid coordinates
      this._handles.push({
        name: "entry-left",
        x: getXCoordinate(this._source._entryPrice, timeScale, candleData),
        y: series.priceToCoordinate(this._source._entryPrice.price),
        type: "circle",
      });
      // Width handle (square) using hybrid coordinates
      this._handles.push({
        name: "entry-right",
        x: getXCoordinate(this._source._targetPrice, timeScale, candleData),
        y: series.priceToCoordinate(this._source._entryPrice.price),
        type: "rect",
      });
      // Profit handle (square) - for short, at the bottom of the profit box using hybrid coordinates
      this._handles.push({
        name: "loss-bottom-left",
        x: getXCoordinate(this._source._entryPrice, timeScale, candleData),
        y: Math.max(
          series.priceToCoordinate(this._source._entryPrice.price),
          series.priceToCoordinate(this._source._targetPrice.price),
        ),
        type: "rect",
      });
      // Loss handle (square) - for short, at the top of the loss box using hybrid coordinates
      this._handles.push({
        name: "profit-top-left",
        x: getXCoordinate(this._source._entryPrice, timeScale, candleData),
        y: Math.min(
          series.priceToCoordinate(this._source._entryPrice.price),
          series.priceToCoordinate(this._source._stopPrice.price),
        ),
        type: "rect",
      });
    }
  }

  // Returns the renderer for the handles
  renderer() {
    return new HandlesPaneRenderer(
      this._handles,
      this._source._options,
      this._activeResizeHandle ? this._activeResizeHandle.current : null,
    );
  }
}
