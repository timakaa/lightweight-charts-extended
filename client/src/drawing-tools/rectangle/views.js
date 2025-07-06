// views.js - View logic for rectangle (box) primitives, handles, and axis overlays
import {
  HandlesPaneRenderer,
  RectanglePaneRenderer,
  RectangleAxisPaneRenderer,
} from "./renderers.js";
import { getXCoordinate } from "../../helpers/coordinateUtils.js";

// HandlesPaneView manages the view for rectangle resize handles
export class HandlesPaneView {
  constructor(source, activeResizeHandleRef) {
    this._source = source;
    this._p1 = { x: null, y: null };
    this._p2 = { x: null, y: null };
    this._activeResizeHandleRef = activeResizeHandleRef;
  }

  // Updates the pixel coordinates for the handles
  update() {
    const series = this._source._series;
    const y1 = series.priceToCoordinate(this._source._p1.price);
    const y2 = series.priceToCoordinate(this._source._p2.price);
    const timeScale = this._source._chart.timeScale();

    // Use enhanced coordinate conversion with logical fallback
    const candleData = this._source._candleData;
    const x1 = getXCoordinate(this._source._p1, timeScale, candleData);
    const x2 = getXCoordinate(this._source._p2, timeScale, candleData);

    this._p1 = { x: x1, y: y1 };
    this._p2 = { x: x2, y: y2 };
  }

  // Returns the renderer for the handles
  renderer() {
    return new HandlesPaneRenderer(
      this._p1,
      this._p2,
      this._source._options,
      this._activeResizeHandleRef ? this._activeResizeHandleRef.current : null,
    );
  }
}

// RectanglePaneView manages the view for the filled rectangle and midline
export class RectanglePaneView {
  constructor(source) {
    this._source = source;
    this._p1 = { x: null, y: null };
    this._p2 = { x: null, y: null };
  }

  // Updates the pixel coordinates for the rectangle
  update() {
    const series = this._source._series;
    const y1 = series.priceToCoordinate(this._source._p1.price);
    const y2 = series.priceToCoordinate(this._source._p2.price);
    const timeScale = this._source._chart.timeScale();

    // Use enhanced coordinate conversion with logical fallback
    const candleData = this._source._candleData;
    const x1 = getXCoordinate(this._source._p1, timeScale, candleData);
    const x2 = getXCoordinate(this._source._p2, timeScale, candleData);

    this._p1 = { x: x1, y: y1 };
    this._p2 = { x: x2, y: y2 };
  }

  // Returns the renderer for the rectangle
  renderer() {
    return new RectanglePaneRenderer(
      this._p1,
      this._p2,
      this._source._options,
      this._source,
    );
  }
}

// RectangleAxisPaneView manages the view for the axis overlays (price/time axis)
class RectangleAxisPaneView {
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
    return new RectangleAxisPaneRenderer(
      this._p1,
      this._p2,
      this._source._options,
      this._vertical,
    );
  }

  // Axis overlays are drawn at the bottom z-order
  zOrder() {
    return "bottom";
  }

  // Axis overlays are visible if the rectangle is selected or preview
  visible() {
    // Show if targeted (selected) or if this is a preview rectangle
    return (
      (this._source.isTargeted &&
        this._source.isTargeted(this._source._selectedBoxId)) ||
      this._source.constructor.name === "PreviewRectangle"
    );
  }
}

// RectanglePriceAxisPaneView provides the price axis overlay
export class RectanglePriceAxisPaneView extends RectangleAxisPaneView {
  constructor(source) {
    super(source, true);
  }

  getPoints() {
    const series = this._source._series;
    const y1 = series.priceToCoordinate(this._source._p1.price);
    const y2 = series.priceToCoordinate(this._source._p2.price);
    return [y1, y2];
  }
}

// RectangleTimeAxisPaneView provides the time axis overlay
export class RectangleTimeAxisPaneView extends RectangleAxisPaneView {
  constructor(source) {
    super(source, false);
  }

  getPoints() {
    const timeScale = this._source._chart.timeScale();

    // Use enhanced coordinate conversion with logical fallback
    const candleData = this._source._candleData;
    const x1 = getXCoordinate(this._source._p1, timeScale, candleData);
    const x2 = getXCoordinate(this._source._p2, timeScale, candleData);

    return [x1, x2];
  }
}

// RectangleAxisView manages the view for axis labels (price/time) for the rectangle
class RectangleAxisView {
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
    // Show if targeted (selected) or if this is a preview rectangle
    return (
      (this._source.isTargeted &&
        this._source.isTargeted(this._source._selectedBoxId)) ||
      this._source.constructor.name === "PreviewRectangle"
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

// RectanglePriceAxisView provides the price axis label for the rectangle
export class RectanglePriceAxisView extends RectangleAxisView {
  update() {
    // Use the string key to always access the latest _p1/_p2 from the source
    this._pos = this._source._series.priceToCoordinate(
      this._source[`_${this._point}`].price,
    );
  }
  text() {
    return this._source._options.priceLabelFormatter(
      this._source[`_${this._point}`].price,
    );
  }
}

// RectangleTimeAxisView provides the time axis label for the rectangle
export class RectangleTimeAxisView extends RectangleAxisView {
  update() {
    const timeScale = this._source._chart.timeScale();

    // Use enhanced coordinate conversion with logical fallback
    const candleData = this._source._candleData;
    const point = this._source[`_${this._point}`];
    if (point) {
      this._pos = getXCoordinate(point, timeScale, candleData);
    } else {
      this._pos = -1;
    }
  }
  text() {
    const time = this._source[`_${this._point}`]?.time;
    const text = this._source._options.timeLabelFormatter(time);
    return text;
  }
}
