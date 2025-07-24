// views.js - View logic for ruler primitives, axis overlays, and axis labels
import { RulerPaneRenderer } from "./renderers.js";
import { positionsBox } from "../positions.js";
import { getXCoordinate } from "../../helpers/coordinateUtils.js";

// RulerPaneView manages the view for the main ruler
export class RulerPaneView {
  constructor(source) {
    this._source = source;
    this._p1 = { x: null, y: null };
    this._p2 = { x: null, y: null };
  }

  // Updates the pixel coordinates for the ruler endpoints
  update() {
    const series = this._source._series;
    const chart = this._source._chart;
    if (!series || !chart || !this._source._p1 || !this._source._p2) {
      this._p1 = { x: null, y: null };
      this._p2 = { x: null, y: null };
      return;
    }
    const y1 = series.priceToCoordinate(this._source._p1.price);
    const y2 = series.priceToCoordinate(this._source._p2.price);
    const timeScale = chart.timeScale();

    // Use enhanced coordinate conversion with logical fallback
    const candleData = this._source._candleData;
    const x1 = getXCoordinate(this._source._p1, timeScale, candleData);
    const x2 = getXCoordinate(this._source._p2, timeScale, candleData);

    this._p1 = { x: x1, y: y1 };
    this._p2 = { x: x2, y: y2 };
  }

  // Returns the renderer for the ruler
  renderer() {
    return new RulerPaneRenderer(this._p1, this._p2, this._source);
  }
}

// RulerAxisView manages the view for axis labels (price/time) for the ruler
class RulerAxisView {
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
    return this._source._options.showLabels;
  }
  tickVisible() {
    return this._source._options.showLabels;
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

// RulerPriceAxisView provides the price axis label for the ruler
export class RulerPriceAxisView extends RulerAxisView {
  update() {
    if (!this._source._series) {
      this._pos = -1; // Skip if not properly attached yet
      return;
    }
    this._pos = this._source._series.priceToCoordinate(this._point.price);
  }
  text() {
    return this._source._options.priceLabelFormatter(this._point.price);
  }
}

// RulerTimeAxisView provides the time axis label for the ruler
export class RulerTimeAxisView extends RulerAxisView {
  update() {
    if (!this._source._chart) {
      this._pos = -1; // Skip if not properly attached yet
      return;
    }
    const timeScale = this._source._chart.timeScale();
    const candleData = this._source._candleData;
    this._pos = getXCoordinate(this._point, timeScale, candleData);
  }
  text() {
    return this._source._options.timeLabelFormatter(this._point.time);
  }
}

// RulerAxisPaneRenderer draws the filled axis overlay for the ruler (price or time axis)
class RulerAxisPaneRenderer {
  constructor(p1, p2, fillColor, vertical) {
    this._p1 = p1;
    this._p2 = p2;
    this._fillColor = fillColor;
    this._vertical = vertical;
  }

  // Draws the axis overlay on the chart
  draw(target) {
    target.useBitmapCoordinateSpace((scope) => {
      if (this._p1 === null || this._p2 === null) return;
      const ctx = scope.context;
      ctx.globalAlpha = 0.5;
      const positions = positionsBox(
        this._p1,
        this._p2,
        this._vertical ? scope.verticalPixelRatio : scope.horizontalPixelRatio,
      );
      ctx.fillStyle = this._fillColor;
      if (this._vertical) {
        ctx.fillRect(0, positions.position, 15, positions.length);
      } else {
        ctx.fillRect(positions.position, 0, positions.length, 15);
      }
    });
  }
}

// RulerAxisPaneView manages the view for the axis overlays (price/time axis)
class RulerAxisPaneView {
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
    return new RulerAxisPaneRenderer(
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
}

// RulerPriceAxisPaneView provides the price axis overlay
class RulerPriceAxisPaneView extends RulerAxisPaneView {
  constructor(source) {
    super(source, true);
  }

  getPoints() {
    const series = this._source._series;
    if (!series) {
      return [null, null]; // Skip if not properly attached yet
    }
    const y1 = series.priceToCoordinate(this._source._p1.price);
    const y2 = series.priceToCoordinate(this._source._p2.price);
    return [y1, y2];
  }
}

// RulerTimeAxisPaneView provides the time axis overlay
class RulerTimeAxisPaneView extends RulerAxisPaneView {
  constructor(source) {
    super(source, false);
  }

  getPoints() {
    if (!this._source._chart) {
      return [null, null]; // Skip if not properly attached yet
    }
    const timeScale = this._source._chart.timeScale();
    const candleData = this._source._candleData;
    const x1 = getXCoordinate(this._source._p1, timeScale, candleData);
    const x2 = getXCoordinate(this._source._p2, timeScale, candleData);
    return [x1, x2];
  }
}

export { RulerPriceAxisPaneView, RulerTimeAxisPaneView };
