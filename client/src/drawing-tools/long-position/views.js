// views.js - View logic for long position primitives, handles, and axis overlays
import { HandlesPaneRenderer, LongPositionPaneRenderer } from "./renderers.js";
import { PositionAxisPaneRenderer } from "../position-base/renderers.js";
import { getXCoordinate } from "../../helpers/coordinateUtils.js";

// HandlesPaneView manages the view for long position resize handles
export class HandlesPaneView {
  constructor(source, activeResizeHandle) {
    this._source = source;
    this._handles = [];
    this._activeResizeHandle = activeResizeHandle;
  }

  // Updates the pixel coordinates for the handles
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
      // Entry handle (circle) - use hybrid coordinate conversion
      this._handles.push({
        name: "entry-left",
        x: getXCoordinate(this._source._entryPrice, timeScale, candleData),
        y: series.priceToCoordinate(this._source._entryPrice.price),
        type: "circle",
      });
      // Width handle (square) - use hybrid coordinate conversion
      this._handles.push({
        name: "entry-right",
        x: getXCoordinate(this._source._targetPrice, timeScale, candleData),
        y: series.priceToCoordinate(this._source._entryPrice.price),
        type: "rect",
      });
      // Profit handle (square) - use hybrid coordinate conversion
      this._handles.push({
        name: "profit-top-left",
        x: getXCoordinate(this._source._entryPrice, timeScale, candleData),
        y: series.priceToCoordinate(this._source._targetPrice.price),
        type: "rect",
      });
      // Loss handle (square) - use hybrid coordinate conversion
      this._handles.push({
        name: "loss-bottom-left",
        x: getXCoordinate(this._source._entryPrice, timeScale, candleData),
        y: series.priceToCoordinate(this._source._stopPrice.price),
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

// LongPositionPaneView manages the view for the profit/loss boxes and entry line
export class LongPositionPaneView {
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
    const timeScale = chart.timeScale();
    const candleData = this._source._candleData;

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
    const x1 = getXCoordinate(this._source._p1, timeScale, candleData);
    const y1 = series.priceToCoordinate(maxPrice);
    const x2 = getXCoordinate(this._source._p2, timeScale, candleData);
    const y2 = series.priceToCoordinate(minPrice);
    this._p1 = { x: x1, y: y1 };
    this._p2 = { x: x2, y: y2 };

    // The width of the boxes should match the horizontal distance between entry and target
    const entryX = getXCoordinate(entry, timeScale, candleData);
    const entryY = series.priceToCoordinate(entry.price);
    const targetX = getXCoordinate(target, timeScale, candleData);
    const targetY = series.priceToCoordinate(target.price);
    const stopY = series.priceToCoordinate(stop.price);

    // Handle null coordinates gracefully
    if (entryX === null || targetX === null) return;

    const leftX = Math.min(entryX, targetX);
    const boxWidth = Math.abs(targetX - entryX);

    // Profit box: from entry to target
    this._profitBox = {
      x: leftX,
      y: Math.min(entryY, targetY),
      width: boxWidth,
      height: Math.abs(targetY - entryY),
    };
    // Loss box: from entry to stop
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

  // Returns the renderer for the long position
  renderer() {
    return new LongPositionPaneRenderer(
      this._profitBox,
      this._lossBox,
      this._entryLine,
      this._source._options,
      this._source,
    );
  }
}

// LongPositionAxisPaneView manages the view for the axis overlays (price/time axis)
class LongPositionAxisPaneView {
  constructor(source, vertical) {
    this._source = source;
    this._vertical = vertical;
    this._p1 = null;
    this._p2 = null;
  }

  // Abstract: must be implemented by subclass to provide axis points
  getPoints() {
    throw new Error("getPoints() must be implemented by subclass");
  }

  // Updates the axis overlay coordinates
  update() {
    [this._p1, this._p2] = this.getPoints();
  }

  // Returns the renderer for the axis overlay
  renderer() {
    return new PositionAxisPaneRenderer(
      this._p1,
      this._p2,
      this._source._options.fillColor,
      this._vertical,
    );
  }

  // Axis overlays are drawn at the bottom z-order
  zOrder() {
    return "bottom";
  }

  // Axis overlays are visible if the position is selected or preview
  visible() {
    return (
      (this._source.isTargeted &&
        this._source.isTargeted(this._source._selectedPositionId)) ||
      this._source.constructor.name === "PreviewLongPosition"
    );
  }
}

// LongPositionTimeAxisPaneView provides the time axis overlay
export class LongPositionTimeAxisPaneView extends LongPositionAxisPaneView {
  constructor(source) {
    super(source, false);
  }

  getPoints() {
    const chart = this._source._chart;
    if (!chart) return [null, null];
    const timeScale = chart.timeScale();
    const candleData = this._source._candleData;

    // Use hybrid coordinate conversion for time axis points
    // Use the actual position points if _p1/_p2 exist, otherwise use entry/target points
    let p1, p2;
    if (this._source._p1 && this._source._p2) {
      p1 = this._source._p1;
      p2 = this._source._p2;
    } else if (this._source._entryPrice && this._source._targetPrice) {
      // Fallback to entry and target points
      p1 = {
        time: Math.min(
          this._source._entryPrice.time,
          this._source._targetPrice.time,
        ),
        price: 0,
      };
      p2 = {
        time: Math.max(
          this._source._entryPrice.time,
          this._source._targetPrice.time,
        ),
        price: 0,
      };
    } else {
      return [null, null];
    }

    const x1 = getXCoordinate(p1, timeScale, candleData);
    const x2 = getXCoordinate(p2, timeScale, candleData);

    return [x1, x2];
  }
}

// LongPositionPriceAxisPaneView provides the price axis overlay
export class LongPositionPriceAxisPaneView extends LongPositionAxisPaneView {
  constructor(source) {
    super(source, true);
  }

  getPoints() {
    const series = this._source._series;
    if (!series) return [null, null];

    // Use the actual position points if _p1/_p2 exist, otherwise calculate from entry/target/stop
    let p1, p2;
    if (this._source._p1 && this._source._p2) {
      p1 = this._source._p1;
      p2 = this._source._p2;
    } else if (
      this._source._entryPrice &&
      this._source._targetPrice &&
      this._source._stopPrice
    ) {
      // Calculate the bounding box from entry, target, and stop prices
      const minPrice = Math.min(
        this._source._entryPrice.price,
        this._source._targetPrice.price,
        this._source._stopPrice.price,
      );
      const maxPrice = Math.max(
        this._source._entryPrice.price,
        this._source._targetPrice.price,
        this._source._stopPrice.price,
      );
      p1 = { time: 0, price: maxPrice };
      p2 = { time: 0, price: minPrice };
    } else {
      return [null, null];
    }

    const y1 = series.priceToCoordinate(p1.price);
    const y2 = series.priceToCoordinate(p2.price);
    return [y1, y2];
  }
}

// LongPositionAxisView manages the view for axis labels (price/time) for the long position
class LongPositionAxisView {
  constructor(source, point) {
    this._source = source;
    this._point = point;
    this._pos = null;
  }
  update() {}
  coordinate() {
    return this._pos ?? -1;
  }
  visible() {
    return (
      (this._source.isTargeted &&
        this._source.isTargeted(this._source._selectedPositionId)) ||
      this._source.constructor.name === "PreviewLongPosition"
    );
  }
  tickVisible() {
    return this.visible();
  }
  textColor() {
    return this._source._options.labelTextColor;
  }
  backColor() {
    return this._source._options.labelColor;
  }
  movePoint(point) {
    this._point = point;
    this.update();
  }
}

// LongPositionPriceAxisView provides the price axis label for the long position
export class LongPositionPriceAxisView extends LongPositionAxisView {
  update() {
    // Get the price directly from the appropriate point
    let price;
    if (this._point === "entry") {
      price = this._source._entryPrice?.price;
    } else if (this._point === "p1") {
      price = this._source._p1?.price;
    } else if (this._point === "p2") {
      price = this._source._p2?.price;
    } else {
      price = this._source[`_${this._point}`]?.price;
    }

    if (price !== undefined && price !== null) {
      this._pos = this._source._series.priceToCoordinate(price);
    } else {
      this._pos = -1;
    }
  }
  text() {
    // Get the price directly from the appropriate point
    let price;
    if (this._point === "entry") {
      price = this._source._entryPrice?.price;
    } else if (this._point === "p1") {
      price = this._source._p1?.price;
    } else if (this._point === "p2") {
      price = this._source._p2?.price;
    } else {
      price = this._source[`_${this._point}`]?.price;
    }

    if (price === undefined || price === null) return "";
    return this._source._options.priceLabelFormatter(price);
  }
}

// LongPositionTimeAxisView provides the time axis label for the long position
export class LongPositionTimeAxisView extends LongPositionAxisView {
  update() {
    // Use hybrid coordinate conversion for time axis labels
    const timeScale = this._source._chart.timeScale();
    const candleData = this._source._candleData;

    // Get the point directly like in rectangle implementation
    let point;
    if (this._point === "entry") {
      point = this._source._entryPrice;
    } else if (this._point === "p1") {
      point = this._source._p1;
    } else if (this._point === "p2") {
      point = this._source._p2;
    } else {
      point = this._source[`_${this._point}`];
    }

    if (point) {
      this._pos = getXCoordinate(point, timeScale, candleData);
    } else {
      this._pos = -1;
    }
  }
  text() {
    // Get the time directly from the appropriate point
    let time;
    if (this._point === "entry") {
      time = this._source._entryPrice?.time;
    } else if (this._point === "p1") {
      time = this._source._p1?.time;
    } else if (this._point === "p2") {
      time = this._source._p2?.time;
    } else {
      time = this._source[`_${this._point}`]?.time;
    }

    if (time === undefined || time === null) return "";
    return this._source._options.timeLabelFormatter(time);
  }
}
