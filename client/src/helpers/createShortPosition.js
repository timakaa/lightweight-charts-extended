// createShortPosition.js - Function to create a short position drawing object from backend data
import { ShortPosition } from "../drawing-tools/short-position/ShortPosition.js";
import { toUnixSeconds } from "./time.js";
import { useDrawingsStore } from "../store/drawings.js";

/**
 * Creates a short position drawing object from backend data
 * @param {Object} chart - The chart instance
 * @param {Object} candlestickSeries - The candlestick series instance
 * @param {Array} candleData - Array of candle data for calculations
 * @param {Object} shortPositionData - The short position data from backend
 * @param {Object} shortPositionData.entry - Entry point { time: string|number, price: number }
 * @param {Object} shortPositionData.target - Target point { time: string|number, price: number }
 * @param {Object} shortPositionData.stop - Stop point { time: string|number, price: number }
 * @param {Function} setShortPositionsData - Function to update short positions state
 * @param {Object} shortPositionDrawingTool - The short position drawing tool instance
 * @param {Object} activeResizeHandleRef - Reference to the active resize handle
 * @returns {ShortPosition} The created short position drawing object
 */
export function createShortPosition(
  chart,
  candlestickSeries,
  candleData,
  shortPositionData,
  setShortPositionsData = null,
  shortPositionDrawingTool = null,
  activeResizeHandleRef = null,
) {
  if (!chart || !candlestickSeries || !candleData || candleData.length === 0)
    return;

  // Parse entry data
  const entryTime = toUnixSeconds(shortPositionData.entry.time);
  const entryPrice = shortPositionData.entry.price;

  // Parse target data
  const targetTime = toUnixSeconds(shortPositionData.target.time);
  const targetPrice = shortPositionData.target.price;

  // Parse stop data
  const stopTime = toUnixSeconds(shortPositionData.stop.time);
  const stopPrice = shortPositionData.stop.price;

  // Create position objects
  const entryPoint = { time: entryTime, price: entryPrice };
  const targetPoint = { time: targetTime, price: targetPrice };
  const stopPoint = { time: stopTime, price: stopPrice };

  // Create short position instance with activeResizeHandleRef for handle hiding
  const shortPosition = new ShortPosition(
    entryPoint,
    targetPoint,
    stopPoint,
    candlestickSeries,
    chart,
    null, // selectedPositionId
    activeResizeHandleRef,
    candleData,
    { showHandles: false }, // Disable handles for programmatic creation
    shortPositionData.id, // Pass through the id
  );

  // Attach to the series
  candlestickSeries.attachPrimitive(shortPosition);

  // Add to state if setter is provided
  if (setShortPositionsData) {
    setShortPositionsData((prev) => [...prev, shortPosition]);
  }

  // Add to drawing tool's internal tracking if provided
  if (shortPositionDrawingTool && shortPositionDrawingTool.current) {
    shortPositionDrawingTool.current._positions.add(shortPosition);
  }

  // Update store IDs if this position was loaded from store
  if (shortPositionData.id) {
    // This position was loaded from store - update the primitive ID in store to match new primitive
    const { updateDrawing } = useDrawingsStore.getState();
    updateDrawing(shortPositionData.id, { primitiveId: shortPosition.id });
  }

  return shortPosition;
}
