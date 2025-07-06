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
 * @param {Object} longPositionData.entry - Entry point { time: string|number, price: number }
 * @param {Object} longPositionData.target - Target point { time: string|number, price: number }
 * @param {Object} longPositionData.stop - Stop point { time: string|number, price: number }
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

  // Parse entry data
  const entryTime = toUnixSeconds(longPositionData.entry.time);
  const entryPrice = longPositionData.entry.price;

  // Parse target data
  const targetTime = toUnixSeconds(longPositionData.target.time);
  const targetPrice = longPositionData.target.price;

  // Parse stop data
  const stopTime = toUnixSeconds(longPositionData.stop.time);
  const stopPrice = longPositionData.stop.price;

  // Create position objects
  const entryPoint = { time: entryTime, price: entryPrice };
  const targetPoint = { time: targetTime, price: targetPrice };
  const stopPoint = { time: stopTime, price: stopPrice };

  // Create long position instance with activeResizeHandleRef for handle hiding
  const longPosition = new LongPosition(
    entryPoint,
    targetPoint,
    stopPoint,
    candlestickSeries,
    chart,
    null, // selectedPositionId
    activeResizeHandleRef,
    candleData,
    { showHandles: false }, // Disable handles for programmatic creation
    longPositionData.id, // Pass through the id
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

  // Update store IDs if this position was loaded from store
  if (longPositionData.id) {
    // This position was loaded from store - update the primitive ID in store to match new primitive
    const { updateDrawing } = useDrawingsStore.getState();
    updateDrawing(longPositionData.id, { primitiveId: longPosition.id });
  }

  return longPosition;
}
