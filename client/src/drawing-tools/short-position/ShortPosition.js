// ShortPosition.js - Defines the ShortPosition drawing primitive for the chart
import BasePosition from "../position-base/BasePosition.js";
import { defaultOptions } from "./options.js";
import {
  ShortHandlesPaneView,
  ShortPositionPaneView,
  ShortPositionPriceAxisPaneView,
  ShortPositionTimeAxisPaneView,
  ShortPositionPriceAxisView,
  ShortPositionTimeAxisView,
} from "./views.js";
import { enhancePointWithLogicalIndex } from "../../helpers/coordinateUtils.js";

// ShortPosition represents a short trade (entry, target, stop) on the chart
// Inherits all logic from BasePosition and provides short-specific views
export class ShortPosition extends BasePosition {
  constructor(
    entryPrice,
    targetPrice,
    stopPrice,
    startTime,
    endTime,
    series,
    chart,
    selectedPositionId = null,
    activeResizeHandleRef = null,
    candleData = null,
    options = {},
    id = null,
  ) {
    // Pass all arguments and short-specific views to the base class
    super(
      entryPrice,
      targetPrice,
      stopPrice,
      startTime,
      endTime,
      series,
      chart,
      selectedPositionId,
      activeResizeHandleRef,
      candleData,
      options,
      ShortPositionPaneView,
      ShortHandlesPaneView,
      ShortPositionPriceAxisPaneView,
      ShortPositionTimeAxisPaneView,
      ShortPositionPriceAxisView,
      ShortPositionTimeAxisView,
      defaultOptions,
      id,
    );

    // Store candle data for coordinate calculations
    this._candleData = candleData;

    // Enhance entry, target, and stop points with logical coordinates
    this._entryPrice = enhancePointWithLogicalIndex(
      { time: startTime, price: entryPrice },
      candleData,
    );
    this._targetPrice = enhancePointWithLogicalIndex(
      { time: endTime, price: targetPrice },
      candleData,
    );
    this._stopPrice = enhancePointWithLogicalIndex(
      { time: endTime, price: stopPrice },
      candleData,
    );
  }

  // Update candle data for coordinate calculations
  updateCandleData(candleData) {
    this._candleData = candleData;

    // Invalidate logical indices to prevent stale index issues when new data is loaded
    // They will be recalculated as needed by getXCoordinate
    if (this._entryPrice.logicalIndex !== undefined) {
      delete this._entryPrice.logicalIndex;
    }
    if (this._targetPrice.logicalIndex !== undefined) {
      delete this._targetPrice.logicalIndex;
    }
    if (this._stopPrice.logicalIndex !== undefined) {
      delete this._stopPrice.logicalIndex;
    }

    // Re-enhance points with new candle data
    this._entryPrice = enhancePointWithLogicalIndex(
      this._entryPrice,
      candleData,
    );
    this._targetPrice = enhancePointWithLogicalIndex(
      this._targetPrice,
      candleData,
    );
    this._stopPrice = enhancePointWithLogicalIndex(this._stopPrice, candleData);
  }
}
