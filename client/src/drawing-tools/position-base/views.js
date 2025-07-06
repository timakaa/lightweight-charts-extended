// views.js - View logic for axis overlays and axis labels for position tools (generic)
// PositionAxisPaneView manages the view for the axis overlays (price/time axis)
export class PositionAxisPaneView {
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
    return this._source._getAxisPaneRenderer(
      this._p1,
      this._p2,
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
      this._source.constructor.name.startsWith("Preview")
    );
  }
}

// PositionTimeAxisPaneView provides the time axis overlay
export class PositionTimeAxisPaneView extends PositionAxisPaneView {
  constructor(source) {
    super(source, false);
  }

  getPoints() {
    const timeScale = this._source._chart.timeScale();
    const p1 = this._source._p1;
    const p2 = this._source._p2;
    if (!p1 || !p2) return [null, null];
    const x1 = timeScale.timeToCoordinate(p1.time);
    const x2 = timeScale.timeToCoordinate(p2.time);
    return [x1, x2];
  }
}

// PositionPriceAxisPaneView provides the price axis overlay
export class PositionPriceAxisPaneView extends PositionAxisPaneView {
  constructor(source) {
    super(source, true);
  }

  getPoints() {
    const series = this._source._series;
    const p1 = this._source._p1;
    const p2 = this._source._p2;
    if (!p1 || !p2) return [null, null];
    const y1 = series.priceToCoordinate(p1.price);
    const y2 = series.priceToCoordinate(p2.price);
    return [y1, y2];
  }
}

// PositionAxisView manages the view for axis labels (price/time) for the position
export class PositionAxisView {
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
      this._source.constructor.name.startsWith("Preview")
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

// PositionPriceAxisView provides the price axis label for the position
export class PositionPriceAxisView extends PositionAxisView {
  update() {
    if (!this._source._p1 || !this._source._p2 || !this._point) {
      this._pos = -1;
      return;
    }
    let price;
    if (this._point === "entry") {
      price = this._source._entryPrice?.price;
    } else {
      price = this._source[`_${this._point}`]?.price;
    }
    this._pos = this._source._series.priceToCoordinate(price);
  }
  text() {
    if (!this._source._p1 || !this._source._p2 || !this._point) return "";
    let price;
    if (this._point === "entry") {
      price = this._source._entryPrice?.price;
    } else {
      price = this._source[`_${this._point}`]?.price;
    }
    return this._source._options.priceLabelFormatter(price);
  }
}

// PositionTimeAxisView provides the time axis label for the position
export class PositionTimeAxisView extends PositionAxisView {
  update() {
    if (!this._source._p1 || !this._source._p2 || !this._point) {
      this._pos = -1;
      return;
    }
    this._pos = this._source._chart
      .timeScale()
      .timeToCoordinate(this._source[`_${this._point}`].time);
  }
  text() {
    if (!this._source._p1 || !this._source._p2 || !this._point) return "";
    return this._source._options.timeLabelFormatter(
      this._source[`_${this._point}`].time,
    );
  }
}
