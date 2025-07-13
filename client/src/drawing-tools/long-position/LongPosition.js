// LongPosition.js - Implements the LongPosition and PreviewLongPosition primitives for drawing long position tools on the chart
import BasePosition from "../position-base/BasePosition.js";
import { defaultOptions } from "./options.js";
import {
  HandlesPaneView,
  LongPositionPaneView,
  LongPositionPriceAxisPaneView,
  LongPositionTimeAxisPaneView,
  LongPositionPriceAxisView,
  LongPositionTimeAxisView,
} from "./views.js";
import { enhancePointWithLogicalIndex } from "../../helpers/coordinateUtils.js";

// LongPosition represents a long position drawing tool (entry, target, stop)
export class LongPosition extends BasePosition {
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
      LongPositionPaneView,
      HandlesPaneView,
      LongPositionPriceAxisPaneView,
      LongPositionTimeAxisPaneView,
      LongPositionPriceAxisView,
      LongPositionTimeAxisView,
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

// PreviewLongPosition is a temporary long position shown while drawing (before finalizing)
export class PreviewLongPosition extends LongPosition {
  constructor(entryPrice, targetPrice, stopPrice, series, chart, candleData) {
    super(
      entryPrice,
      targetPrice,
      stopPrice,
      series,
      chart,
      null,
      null,
      candleData,
      { fillColor: defaultOptions.previewFillColor },
    );
  }

  // Update the endpoint of the preview long position as the mouse moves
  updateEndPoint(pointType, p) {
    const enhancedPoint = enhancePointWithLogicalIndex(p, this._candleData);
    this[`_${pointType}`] = enhancedPoint;
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }
}
