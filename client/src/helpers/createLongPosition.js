// createLongPosition.js - Function to create a long position drawing object from backend data
import { LongPosition } from "../drawing-tools/long-position/LongPosition.js";
import { toUnixSeconds } from "./time.js";
import { useDrawingsStore } from "../store/drawings.js";

/**
 * Creates a long position drawing object from backend data
 * @param {Object} chart - The chart instance
 * @param {Object} candlestickSeries - The candlestick series instance
 * @param {Array} candleData - Array of candle data for calculations
 * @param {Object} longPositionData - The long position data from backend
 * @param {string|number} longPositionData.startTime - Start time of the position
 * @param {string|number} longPositionData.endTime - End time of the position
 * @param {number} longPositionData.entryPrice - Entry price
 * @param {number} longPositionData.targetPrice - Target price
 * @param {number} longPositionData.stopPrice - Stop price
 * @param {Function} setLongPositionsData - Function to update long positions state
 * @param {Object} longPositionDrawingTool - The long position drawing tool instance
 * @param {Object} activeResizeHandleRef - Reference to the active resize handle
 * @returns {LongPosition} The created long position drawing object
 */
export function createLongPosition(
  chart,
  candlestickSeries,
  candleData,
  longPositionData,
  setLongPositionsData = null,
  longPositionDrawingTool = null,
  activeResizeHandleRef = null,
) {
  if (!chart || !candlestickSeries || !candleData || candleData.length === 0)
    return;

  // Parse data
  const startTime = toUnixSeconds(longPositionData.startTime);
  const endTime = toUnixSeconds(longPositionData.endTime);
  const entryPrice = longPositionData.entryPrice;
  const targetPrice = longPositionData.targetPrice;
  const stopPrice = longPositionData.stopPrice;

  const longPosition = new LongPosition(
    entryPrice,
    targetPrice,
    stopPrice,
    startTime,
    endTime,
    candlestickSeries,
    chart,
    null, // selectedPositionId
    activeResizeHandleRef,
    candleData,
    { showHandles: false }, // Disable handles for programmatic creation
    longPositionData.id, // Use consistent ID
  );

  // Attach to the series
  candlestickSeries.attachPrimitive(longPosition);

  // Add to state if setter is provided
  if (setLongPositionsData) {
    setLongPositionsData((prev) => [...prev, longPosition]);
  }

  // Add to drawing tool's internal tracking if provided
  if (longPositionDrawingTool && longPositionDrawingTool.current) {
    longPositionDrawingTool.current._positions.add(longPosition);
  }

  // Note: We should NOT update the primitiveId in store when loading from store
  // The primitiveId should remain consistent for drag/resize updates to work

  return longPosition;
}
