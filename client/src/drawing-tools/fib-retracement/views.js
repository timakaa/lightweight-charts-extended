// views.js - View logic for fib retracement drawing tool
import {
  FibRetracementPaneRenderer,
  FibRetracementHandlesPaneRenderer,
  FibRetracementAxisPaneRenderer,
} from "./renderers.js";
import { getXCoordinate } from "../../helpers/coordinateUtils.js";

/**
 * FibRetracementPaneView - Manages the main chart pane view for fib retracements
 *
 * Handles coordinate conversion and rendering of the main retracement:
 * - Converts logical coordinates (time, price) to pixel coordinates with hybrid support
 * - Updates view when chart/series changes
 * - Provides renderer for main retracement drawing
 */
export class FibRetracementPaneView {
  constructor(source) {
    this._source = source;
    this._p1 = { x: null, y: null };
    this._p2 = { x: null, y: null };
  }

  /**
   * Updates view coordinates when chart/series changes using hybrid coordinate system
   */
  update() {
    const series = this._source._series;
    const timeScale = this._source._chart.timeScale();

    // Use hybrid coordinate system for X coordinates
    const x1 = getXCoordinate(
      this._source._p1,
      timeScale,
      this._source._candleData,
    );
    const x2 = getXCoordinate(
      this._source._p2,
      timeScale,
      this._source._candleData,
    );

    // Y coordinates remain the same (price-based)
    const y1 = series.priceToCoordinate(this._source._p1.price);
    const y2 = series.priceToCoordinate(this._source._p2.price);

    this._p1 = { x: x1, y: y1 };
    this._p2 = { x: x2, y: y2 };
  }

  /**
   * Returns the renderer for the main retracement
   * @returns {FibRetracementPaneRenderer} Renderer instance
   */
  renderer() {
    return new FibRetracementPaneRenderer(
      this._p1,
      this._p2,
      this._source._options,
    );
  }
}

/**
 * FibRetracementHandlesPaneView - Manages resize handles for fib retracements
 *
 * Handles coordinate conversion and rendering of resize handles:
 * - Converts logical coordinates (time, price) to pixel coordinates with hybrid support
 * - Updates view when chart/series changes
 * - Provides renderer for handles with hide logic
 */
export class FibRetracementHandlesPaneView {
  constructor(source, activeResizeHandleRef) {
    this._source = source;
    this._p1 = { x: null, y: null };
    this._p2 = { x: null, y: null };
    this._activeResizeHandleRef = activeResizeHandleRef;
  }

  /**
   * Updates view coordinates when chart/series changes using hybrid coordinate system
   */
  update() {
    const series = this._source._series;
    const timeScale = this._source._chart.timeScale();

    // Use hybrid coordinate system for X coordinates
    const x1 = getXCoordinate(
      this._source._p1,
      timeScale,
      this._source._candleData,
    );
    const x2 = getXCoordinate(
      this._source._p2,
      timeScale,
      this._source._candleData,
    );

    // Y coordinates remain the same (price-based)
    const y1 = series.priceToCoordinate(this._source._p1.price);
    const y2 = series.priceToCoordinate(this._source._p2.price);

    this._p1 = { x: x1, y: y1 };
    this._p2 = { x: x2, y: y2 };
  }

  /**
   * Returns the renderer for the handles
   * @returns {FibRetracementHandlesPaneRenderer} Renderer instance
   */
  renderer() {
    return new FibRetracementHandlesPaneRenderer(
      this._p1,
      this._p2,
      this._source._options,
      this._activeResizeHandleRef ? this._activeResizeHandleRef.current : null,
    );
  }
}

/**
 * FibRetracementAxisPaneView - Base class for axis overlay views
 *
 * Manages the view for axis overlays (blue background rectangles):
 * - Abstract base class for price and time axis overlays
 * - Handles visibility logic for selected/preview retracements
 * - Provides common functionality for axis overlays
 */
class FibRetracementAxisPaneView {
  constructor(source, vertical) {
    this._source = source;
    this._vertical = vertical;
    this._p1 = null;
    this._p2 = null;
  }

  /**
   * Abstract: must be implemented by subclass to provide axis points
   * @throws {Error} If not implemented by subclass
   */
  getPoints() {
    throw new Error("getPoints() must be implemented by subclass");
  }

  /**
   * Updates the axis overlay coordinates
   */
  update() {
    [this._p1, this._p2] = this.getPoints();
  }

  /**
   * Returns the renderer for the axis overlay
   * @returns {FibRetracementAxisPaneRenderer} Renderer instance
   */
  renderer() {
    return new FibRetracementAxisPaneRenderer(
      this._p1,
      this._p2,
      this._source._options,
      this._vertical,
    );
  }

  /**
   * Axis overlays are drawn at the bottom z-order
   * @returns {string} Z-order for axis overlays
   */
  zOrder() {
    return "bottom";
  }

  /**
   * Axis overlays are visible if the fib retracement is selected or preview
   * @returns {boolean} True if overlay should be visible
   */
  visible() {
    // Show if targeted (selected) or if this is a preview fib retracement
    return (
      (this._source.isTargeted &&
        this._source.isTargeted(this._source._selectedFibRetracementId)) ||
      this._source.constructor.name === "PreviewFibRetracement"
    );
  }
}

/**
 * FibRetracementPriceAxisPaneView - Provides the price axis overlay
 *
 * Manages the vertical blue background rectangle on the price axis:
 * - Converts price coordinates to pixel coordinates
 * - Passes fib levels and price data to renderer for proper coverage
 * - Covers the full range of all fib levels
 */
export class FibRetracementPriceAxisPaneView extends FibRetracementAxisPaneView {
  constructor(source) {
    super(source, true);
  }

  /**
   * Gets price axis points (vertical coordinates)
   * @returns {Array} Array of [y1, y2] coordinates
   */
  getPoints() {
    const series = this._source._series;
    const y1 = series.priceToCoordinate(this._source._p1.price);
    const y2 = series.priceToCoordinate(this._source._p2.price);
    return [y1, y2];
  }

  /**
   * Returns the renderer with fib level data for proper axis coverage
   * @returns {FibRetracementAxisPaneRenderer} Renderer with fib level data
   */
  renderer() {
    // Pass fibLevels, minPrice, maxPrice, series, and logical prices for axis ticks/labels
    const fibLevels = this._source._options.fibLevels;
    const minPrice = Math.min(this._source._p1.price, this._source._p2.price);
    const maxPrice = Math.max(this._source._p1.price, this._source._p2.price);
    const series = this._source._series;
    const p1Price = this._source._p1.price;
    const p2Price = this._source._p2.price;
    return new FibRetracementAxisPaneRenderer(
      this._p1,
      this._p2,
      this._source._options,
      this._vertical,
      fibLevels,
      minPrice,
      maxPrice,
      series,
      p1Price,
      p2Price,
    );
  }
}

/**
 * FibRetracementTimeAxisPaneView - Provides the time axis overlay
 *
 * Manages the horizontal blue background rectangle on the time axis:
 * - Converts time coordinates to pixel coordinates with hybrid support
 * - Provides time axis overlay covering the full width of the retracement
 */
export class FibRetracementTimeAxisPaneView extends FibRetracementAxisPaneView {
  constructor(source) {
    super(source, false);
  }

  /**
   * Gets time axis points (horizontal coordinates) using hybrid coordinate system
   * @returns {Array} Array of [x1, x2] coordinates
   */
  getPoints() {
    const timeScale = this._source._chart.timeScale();

    // Use hybrid coordinate system for X coordinates
    const x1 = getXCoordinate(
      this._source._p1,
      timeScale,
      this._source._candleData,
    );
    const x2 = getXCoordinate(
      this._source._p2,
      timeScale,
      this._source._candleData,
    );

    return [x1, x2];
  }
}

/**
 * FibRetracementAxisView - Base class for axis label views
 *
 * Manages the view for axis labels (the big blue labels):
 * - Abstract base class for price and time axis labels
 * - Handles visibility logic for selected/preview retracements
 * - Provides common functionality for axis labels
 */
class FibRetracementAxisView {
  constructor(source, point) {
    this._source = source;
    this._point = point;
    this._pos = null;
  }

  /**
   * Updates the label position
   */
  update() {}

  /**
   * Returns the coordinate position for the label
   * @returns {number} Coordinate position or -1 if not set
   */
  coordinate() {
    return this._pos ?? -1;
  }

  /**
   * Labels are visible if the fib retracement is selected or preview
   * @returns {boolean} True if label should be visible
   */
  visible() {
    // Show if targeted (selected) or if this is a preview fib retracement
    return (
      (this._source.isTargeted &&
        this._source.isTargeted(this._source._selectedFibRetracementId)) ||
      this._source.constructor.name === "PreviewFibRetracement"
    );
  }

  /**
   * Returns whether the tick should be visible
   * @returns {boolean} True if tick should be visible
   */
  tickVisible() {
    return this.visible();
  }

  /**
   * Returns the text color for the label
   * @returns {string} Text color
   */
  textColor() {
    return this._source._options.labelTextColor;
  }

  /**
   * Returns the background color for the label
   * @returns {string} Background color
   */
  backColor() {
    return this._source._options.labelColor;
  }

  /**
   * Updates the point reference
   * @param {object} point - New point reference
   */
  movePoint(point) {
    this._point = point;
    this.update();
  }
}

/**
 * FibRetracementPriceAxisView - Provides the price axis label for the fib retracement
 *
 * Manages price labels on the price axis:
 * - Converts price to coordinate position
 * - Formats price for display
 * - Updates when price changes
 */
export class FibRetracementPriceAxisView extends FibRetracementAxisView {
  /**
   * Updates the price coordinate position
   */
  update() {
    // Use the string key to always access the latest _p1/_p2 from the source
    this._pos = this._source._series.priceToCoordinate(
      this._source[`_${this._point}`].price,
    );
  }

  /**
   * Returns the formatted price text
   * @returns {string} Formatted price string
   */
  text() {
    return this._source._options.priceLabelFormatter(
      this._source[`_${this._point}`].price,
    );
  }
}

/**
 * FibRetracementTimeAxisView - Provides time axis labels for fib retracement endpoints
 *
 * Shows time labels at the endpoint positions on the time axis:
 * - Uses hybrid coordinate system for robust positioning
 * - Displays time labels for both endpoints (p1 and p2)
 */
export class FibRetracementTimeAxisView extends FibRetracementAxisView {
  constructor(source, point) {
    super(source, point);
  }

  /**
   * Updates the view (no-op for time axis labels)
   */
  update() {
    // Time axis labels update automatically
  }

  /**
   * Gets the X coordinate for the time axis label using hybrid coordinate system
   * @returns {number|null} X coordinate or null if conversion fails
   */
  coordinate() {
    const point = this._point === "p1" ? this._source._p1 : this._source._p2;
    const timeScale = this._source._chart.timeScale();

    // Use hybrid coordinate system for robust positioning
    return getXCoordinate(point, timeScale, this._source._candleData);
  }

  /**
   * Returns the formatted time text for the label
   * @returns {string} Formatted time text
   */
  text() {
    const point = this._point === "p1" ? this._source._p1 : this._source._p2;
    return this._source._options.timeLabelFormatter(point.time);
  }
}
