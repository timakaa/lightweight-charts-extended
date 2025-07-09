import PluginBase from "../PluginBase.js";
import {
  FibRetracementPaneView,
  FibRetracementHandlesPaneView,
  FibRetracementPriceAxisPaneView,
  FibRetracementTimeAxisPaneView,
  FibRetracementPriceAxisView,
  FibRetracementTimeAxisView,
} from "./views.js";
import { defaultOptions } from "./options.js";
import {
  enhancePointWithLogicalIndex,
  getXCoordinate,
} from "../../helpers/coordinateUtils.js";
import { generateId } from "../../helpers/generateId";

/**
 * FibRetracement - Main class for fib retracement drawing tool
 *
 * Handles the complete lifecycle of a fib retracement:
 * - Rendering fib levels as horizontal lines with labels
 * - Managing selection and hover states
 * - Providing axis overlays and labels
 * - Handling handle interactions for resize
 * - Updating views when chart/series changes
 * - Hybrid coordinate system support for positioning outside candle range
 *
 * @param {object} p1 - First point {time, price}
 * @param {object} p2 - Second point {time, price}
 * @param {object} series - Chart series instance
 * @param {object} chart - Chart instance
 * @param {string|null} selectedFibRetracementId - ID of selected retracement
 * @param {Array} candleData - Array of candle data for hybrid coordinates
 */
export class FibRetracement extends PluginBase {
  constructor(
    p1,
    p2,
    series,
    chart,
    selectedFibRetracementId = null,
    activeResizeHandleRef = null,
    candleData = null,
    id = null,
  ) {
    super();
    // Unique identifier for this retracement
    this.id = id || generateId("fib");
    // Store candle data for hybrid coordinate system
    this._candleData = candleData;
    // Endpoints of the retracement with enhanced logical coordinates
    this._p1 = enhancePointWithLogicalIndex(p1, this._candleData);
    this._p2 = enhancePointWithLogicalIndex(p2, this._candleData);
    this._series = series;
    this._chart = chart;
    // Options with defaults
    this._options = { ...defaultOptions };
    this._selectedFibRetracementId = selectedFibRetracementId;
    this._activeResizeHandleRef = activeResizeHandleRef;

    // Pane views for rendering the fib retracement on the main chart
    this._paneViews = [new FibRetracementPaneView(this)];

    // Always create handles pane view for resize handles
    this._handlesPaneView = new FibRetracementHandlesPaneView(
      this,
      activeResizeHandleRef,
    );

    // Axis views for price/time overlays (blue background rectangles)
    this._priceAxisPaneViews = [new FibRetracementPriceAxisPaneView(this)];
    this._timeAxisPaneViews = [new FibRetracementTimeAxisPaneView(this)];

    // Axis views for price/time labels (the big blue labels)
    this._priceAxisViews = [
      new FibRetracementPriceAxisView(this, "p1"),
      new FibRetracementPriceAxisView(this, "p2"),
    ];
    this._timeAxisViews = [
      new FibRetracementTimeAxisView(this, "p1"),
      new FibRetracementTimeAxisView(this, "p2"),
    ];

    // Subscribe to chart and series updates for live updating
    this._onChartUpdate = () => {
      if (this.requestUpdate) {
        this.requestUpdate();
      }
    };
    this._chart
      .timeScale()
      .subscribeVisibleLogicalRangeChange(this._onChartUpdate);
    this._series.subscribeDataChanged(this._onChartUpdate);
  }

  /**
   * Set the selected fib retracement ID (for selection logic)
   * @param {string|null} selectedFibRetracementId - ID of selected retracement
   */
  setSelectedFibRetracementId(selectedFibRetracementId) {
    this._selectedFibRetracementId = selectedFibRetracementId;
  }

  /**
   * Returns true if this retracement is the currently selected one
   * @param {string|null} selectedFibRetracementId - ID to check against
   * @returns {boolean} True if this retracement is selected
   */
  isTargeted(selectedFibRetracementId) {
    return this.id === selectedFibRetracementId;
  }

  /**
   * Returns the pane views for rendering the main retracement
   * @returns {Array} Array of pane views
   */
  paneViews() {
    const views = [...this._paneViews];

    // Add handles pane view if handles should be shown
    if (this._options.showHandles) {
      views.push(this._handlesPaneView);
    }

    return views;
  }

  /**
   * Returns price axis pane views if selected or preview (blue background rectangle)
   * @returns {Array} Array of price axis pane views
   */
  priceAxisPaneViews() {
    if (
      (this.isTargeted && this.isTargeted(this._selectedFibRetracementId)) ||
      this.constructor.name === "PreviewFibRetracement"
    ) {
      return this._priceAxisPaneViews;
    }
    return [];
  }

  /**
   * Returns time axis pane views if selected or preview (blue background rectangle)
   * @returns {Array} Array of time axis pane views
   */
  timeAxisPaneViews() {
    if (
      (this.isTargeted && this.isTargeted(this._selectedFibRetracementId)) ||
      this.constructor.name === "PreviewFibRetracement"
    ) {
      return this._timeAxisPaneViews;
    }
    return [];
  }

  /**
   * Returns price axis label views for all fib levels (the big blue labels)
   * Creates a view for every fib level at the correct price position
   * @returns {Array} Array of price axis views
   */
  priceAxisViews() {
    // Add a view for every level (including 1 and 0) at the correct price
    const fibLevels = this._options.fibLevels || [];
    const views = [];
    for (const level of fibLevels) {
      // Calculate price for this level using the same formula as renderer
      const price =
        this._p1.price + (this._p2.price - this._p1.price) * (1 - level);
      views.push({
        update: () => {},
        coordinate: () => this._series.priceToCoordinate(price),
        visible: () =>
          (this.isTargeted &&
            this.isTargeted(this._selectedFibRetracementId)) ||
          this.constructor.name === "PreviewFibRetracement",
        tickVisible: () => true,
        textColor: () => this._options.labelTextColor,
        backColor: () => this._options.labelColor,
        text: () => this._options.priceLabelFormatter(price),
        movePoint: () => {},
      });
    }
    return views;
  }

  /**
   * Returns time axis label views
   * @returns {Array} Array of time axis views
   */
  timeAxisViews() {
    return this._timeAxisViews;
  }

  /**
   * Update all views to reflect current state
   */
  updateAllViews() {
    this._paneViews.forEach((v) => v.update());
    this._handlesPaneView.update();
    this._priceAxisPaneViews.forEach((v) => v.update());
    this._timeAxisPaneViews.forEach((v) => v.update());
    this._priceAxisViews.forEach((v) => v.update());
    this._timeAxisViews.forEach((v) => v.update());
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }

  /**
   * Returns true if the crosshair is close to any level line (within 5px)
   * Used for hover detection in pixel coordinates
   * @param {object} crosshair - Crosshair position {x, y}
   * @returns {boolean} True if crosshair is near a level line
   */
  isHovered(crosshair) {
    const isSelected =
      this._selectedFibRetracementId &&
      this.isTargeted(this._selectedFibRetracementId);
    if (!crosshair && !isSelected) {
      this._options.showHandles = false;
      return false;
    }
    const fibLevels = this._options.fibLevels;
    const series = this._series;
    const timeScale = this._chart.timeScale();

    // Always recalculate from logical coordinates
    const y1 = series.priceToCoordinate(this._p1.price);
    const y2 = series.priceToCoordinate(this._p2.price);
    const x1 = timeScale.timeToCoordinate(this._p1.time);
    const x2 = timeScale.timeToCoordinate(this._p2.time);

    // Check if crosshair is within the x-axis bounds of the retracement with tolerance
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const width = maxX - minX;
    // If width is 0 (vertical line), allow a minimum tolerance
    const tolerance = Math.max(width * this._options.hoverTolerance, 10);
    if (
      crosshair &&
      (crosshair.x < minX - tolerance || crosshair.x > maxX + tolerance)
    ) {
      this._options.showHandles = isSelected;
      return false;
    }

    // Use the same logic as the renderer for level placement
    if (crosshair) {
      for (const level of fibLevels) {
        const y = y1 + (y2 - y1) * (1 - level);
        if (Math.abs(crosshair.y - y) <= 5) {
          this._options.showHandles = true;
          return true;
        }
      }
    }
    this._options.showHandles = isSelected;
    return false;
  }

  /**
   * Logical hit-testing for hover (time, price coordinates)
   * More precise than pixel-based hover detection
   * @param {object} point - Point to test {time, price}
   * @param {number} percent - Tolerance as percentage of retracement height
   * @returns {boolean} True if point is near a level line
   */
  isHoveredLogical({ time, price }, percent = 0.05) {
    const isSelected =
      this._selectedFibRetracementId &&
      this.isTargeted(this._selectedFibRetracementId);
    if (time == null || price == null) {
      this._options.showHandles = isSelected;
      return false;
    }

    // Check if time is within bounds
    const minTime = Math.min(this._p1.time, this._p2.time);
    const maxTime = Math.max(this._p1.time, this._p2.time);
    if (time < minTime || time > maxTime) {
      this._options.showHandles = isSelected;
      return false;
    }

    // Check if price is near any level (percent of retracement height)
    const fibLevels = this._options.fibLevels;
    const minPrice = this._p1.price;
    const maxPrice = this._p2.price;
    const height = Math.abs(maxPrice - minPrice);
    const priceThreshold = height * percent;
    for (const level of fibLevels) {
      const levelPrice = minPrice + (maxPrice - minPrice) * (1 - level);
      if (Math.abs(price - levelPrice) <= priceThreshold) {
        this._options.showHandles = true;
        return true;
      }
    }
    this._options.showHandles = isSelected;
    return false;
  }

  /**
   * Returns true if a logical point is inside the retracement area
   * Considers the full rectangle between p1 and p2, covering all fib levels
   * @param {object} point - Point to test {time, price}
   * @returns {boolean} True if point is inside retracement area
   */
  isPointInsideRetracement({ time, price }) {
    const minTime = Math.min(this._p1.time, this._p2.time);
    const maxTime = Math.max(this._p1.time, this._p2.time);
    const fibLevels = this._options.fibLevels;

    // Compute all level prices for both directions
    const levelPrices = fibLevels.map(
      (level) =>
        this._p1.price + (this._p2.price - this._p1.price) * (1 - level),
    );
    const minLevelPrice = Math.min(...levelPrices);
    const maxLevelPrice = Math.max(...levelPrices);

    return (
      time >= minTime &&
      time <= maxTime &&
      price >= minLevelPrice &&
      price <= maxLevelPrice
    );
  }

  /**
   * Cleanup subscriptions when the retracement is destroyed
   */
  destroy() {
    this._chart
      .timeScale()
      .unsubscribeVisibleLogicalRangeChange(this._onChartUpdate);
    this._series.unsubscribeDataChanged(this._onChartUpdate);
  }

  /**
   * Set the active resize handle for this retracement
   * @param {object} activeResizeHandleRef - Reference to the active resize handle
   */
  setActiveResizeHandle(activeResizeHandleRef) {
    this._handlesPaneView._activeResizeHandleRef = activeResizeHandleRef;
  }

  /**
   * Applies new options to the fib retracement (e.g., handles)
   * @param {object} options - Options to apply
   */
  applyOptions(options) {
    this._options = {
      ...this._options,
      ...options,
    };
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }

  /**
   * Returns 'p1' or 'p2' if the point is near the left or right handle, or null
   * Used for resize handle detection with hybrid coordinate support
   * @param {object} point - Point to test {time, price}
   * @param {object} chart - Chart instance
   * @param {object} series - Series instance
   * @returns {string|null} Handle name or null
   */
  getHandleAtPoint({ time, price }, chart, series) {
    const timeScale = chart.timeScale();

    // Use hybrid coordinate system for robust handle detection
    const x1 = getXCoordinate(this._p1, timeScale, this._candleData);
    const y1 = series.priceToCoordinate(this._p1.price);
    const x2 = getXCoordinate(this._p2, timeScale, this._candleData);
    const y2 = series.priceToCoordinate(this._p2.price);

    // Convert point coordinates with hybrid support
    const pointX = getXCoordinate({ time, price }, timeScale, this._candleData);
    const pointY = series.priceToCoordinate(price);

    // Return early if coordinate conversion failed
    if (x1 === null || x2 === null || pointX === null || pointY === null) {
      return null;
    }

    const radius = this._options.handleRadius || 5;

    // p1 is always 0-level handle, p2 is always 1-level handle
    if (Math.hypot(pointX - x1, pointY - y1) <= radius * 2) {
      return "p1";
    }
    if (Math.hypot(pointX - x2, pointY - y2) <= radius * 2) {
      return "p2";
    }
    return null;
  }

  /**
   * Updates candle data and invalidates logical coordinates if data has changed
   * @param {Array} newCandleData - New candle data array
   */
  updateCandleData(newCandleData) {
    if (!newCandleData || !Array.isArray(newCandleData)) return;

    const oldLength = this._candleData ? this._candleData.length : 0;
    const newLength = newCandleData.length;

    // Update candle data
    this._candleData = newCandleData;

    // Invalidate logical indices if data has changed to prevent stale coordinates
    if (oldLength !== newLength) {
      // Re-enhance points with updated logical indices
      this._p1 = enhancePointWithLogicalIndex(
        { time: this._p1.time, price: this._p1.price },
        this._candleData,
      );
      this._p2 = enhancePointWithLogicalIndex(
        { time: this._p2.time, price: this._p2.price },
        this._candleData,
      );

      // Update all views with new coordinates
      this.updateAllViews();
    }
  }
}
