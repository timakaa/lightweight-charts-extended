// views.js - View logic for line primitives, handles, and axis overlays
import {
  LinePaneRenderer,
  LineHandlesPaneRenderer,
  LineAxisPaneRenderer,
} from "./renderers.js";
import { getXCoordinate } from "../../helpers/coordinateUtils.js";

// LinePaneView manages the view for the main line
export class LinePaneView {
  constructor(source) {
    this._source = source;
    this._p1 = { x: null, y: null };
    this._p2 = { x: null, y: null };
  }

  // Updates the pixel coordinates for the line endpoints
  update() {
    const series = this._source._series;
    if (!series || !this._source._chart) {
      return; // Skip update if not properly attached yet
    }
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

  // Returns the renderer for the line
  renderer() {
    return new LinePaneRenderer(
      this._p1,
      this._p2,
      this._source._options.color,
    );
  }
}

// HandlesPaneView manages the view for line endpoint handles
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
    if (!series || !this._source._chart) {
      return; // Skip update if not properly attached yet
    }
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
    return new LineHandlesPaneRenderer(
      this._p1,
      this._p2,
      this._source._options,
      this._activeResizeHandleRef ? this._activeResizeHandleRef.current : null,
    );
  }
}

// LineAxisPaneView manages the view for the axis overlays (price/time axis)
class LineAxisPaneView {
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
    return new LineAxisPaneRenderer(
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

  // Axis overlays are visible if the line is selected or preview
  visible() {
    // Show if targeted (selected) or if this is a preview line
    return (
      (this._source.isTargeted &&
        this._source.isTargeted(this._source._selectedLineId)) ||
      this._source.constructor.name === "PreviewLine"
    );
  }
}

// LinePriceAxisPaneView provides the price axis overlay
export class LinePriceAxisPaneView extends LineAxisPaneView {
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

// LineTimeAxisPaneView provides the time axis overlay
export class LineTimeAxisPaneView extends LineAxisPaneView {
  constructor(source) {
    super(source, false);
  }

  getPoints() {
    if (!this._source._chart) {
      return [null, null]; // Skip if not properly attached yet
    }
    const timeScale = this._source._chart.timeScale();

    // Use enhanced coordinate conversion with logical fallback
    const candleData = this._source._candleData;
    const x1 = getXCoordinate(this._source._p1, timeScale, candleData);
    const x2 = getXCoordinate(this._source._p2, timeScale, candleData);

    return [x1, x2];
  }
}

// LineAxisView manages the view for axis labels (price/time) for the line
class LineAxisView {
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
    // Show if targeted (selected) or if this is a preview line
    return (
      (this._source.isTargeted &&
        this._source.isTargeted(this._source._selectedLineId)) ||
      this._source.constructor.name === "PreviewLine"
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

// LinePriceAxisView provides the price axis label for the line
export class LinePriceAxisView extends LineAxisView {
  update() {
    if (!this._source._series) {
      this._pos = -1; // Skip if not properly attached yet
      return;
    }
    const price = this._source[`_${this._point}`]?.price;
    this._pos = this._source._series.priceToCoordinate(price);
  }
  text() {
    const price = this._source[`_${this._point}`]?.price;
    const text = this._source._options.priceLabelFormatter(price);
    return text;
  }
}

// LineTimeAxisView provides the time axis label for the line
export class LineTimeAxisView extends LineAxisView {
  update() {
    if (!this._source._chart) {
      this._pos = -1; // Skip if not properly attached yet
      return;
    }
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
