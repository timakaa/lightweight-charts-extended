// createFibRetracement.js - Function to create a Fibonacci retracement drawing object from backend data
import { FibRetracement } from "../drawing-tools/fib-retracement/FibRetracement.js";
import { toUnixSeconds } from "./time.js";
import { useDrawingsStore } from "../store/drawings.js";
import { useChartStore } from "../store/chart.js";

/**
 * Creates a Fibonacci retracement drawing object from backend data
 * @param {Object} chart - The chart instance
 * @param {Object} candlestickSeries - The candlestick series instance
 * @param {Array} candleData - Array of candle data for calculations
 * @param {Object} fibRetracementData - The Fibonacci retracement data from backend
 * @param {Object} fibRetracementData.startTime - Start time { time: string|number, price: number }
 * @param {Object} fibRetracementData.endTime - End time { time: string|number, price: number }
 * @param {Function} setFibRetracementsData - Function to update Fibonacci retracements state
 * @param {Object} fibRetracementDrawingTool - The Fibonacci retracement drawing tool instance
 * @param {Object} activeResizeHandleRef - Reference to the active resize handle
 * @returns {FibRetracement} The created Fibonacci retracement drawing object
 */
export function createFibRetracement(
  chart,
  candlestickSeries,
  candleData,
  fibRetracementData,
  setFibRetracementsData = null,
  fibRetracementDrawingTool = null,
  activeResizeHandleRef = null,
) {
  if (!chart || !candlestickSeries || !candleData || candleData.length === 0)
    return;

  // Parse start and end times from the resolved data object
  // (relative positioning is already handled by resolveDrawingPositions)
  const startTime = toUnixSeconds(fibRetracementData.startTime);
  const endTime = fibRetracementData.endTime; // Already resolved as unix timestamp

  const p1 = {
    time: startTime,
    price: fibRetracementData.startPrice,
  };
  const p2 = {
    time: endTime,
    price: fibRetracementData.endPrice,
  };

  // Create the Fibonacci retracement instance with handles disabled for programmatic creation
  const fibRetracement = new FibRetracement(
    p1,
    p2,
    candlestickSeries,
    chart,
    null, // selectedFibRetracementId
    activeResizeHandleRef,
    candleData,
    fibRetracementData.id, // Pass through the id
  );

  // Apply custom options if provided
  if (fibRetracementData.style) {
    fibRetracement.applyOptions(fibRetracementData.style);
  }

  // Ensure handles are disabled for programmatic creation
  fibRetracement.applyOptions({ showHandles: false });

  // Attach to the series
  candlestickSeries.attachPrimitive(fibRetracement);

  // Add to state if setter is provided
  if (setFibRetracementsData) {
    setFibRetracementsData((prev) => [...prev, fibRetracement]);
  }

  // Add to drawing tool's internal tracking if provided
  if (fibRetracementDrawingTool && fibRetracementDrawingTool.current) {
    fibRetracementDrawingTool.current._retracements.add(fibRetracement);
  }

  // Handle store persistence
  if (!fibRetracementData.id && !fibRetracementData.primitiveId) {
    // This is a completely new fib retracement (drawn by user) - save to store
    const { addDrawing } = useDrawingsStore.getState();
    const { ticker } = useChartStore.getState();

    if (ticker) {
      const drawingData = {
        type: "fib_retracement",
        ticker: ticker.replace("/", ""),
        startTime: fibRetracementData.startTime,
        endTime: fibRetracementData.endTime,
        startPrice: fibRetracementData.startPrice,
        endPrice: fibRetracementData.endPrice,
        primitiveId: fibRetracement.id,
        style: fibRetracementData.style,
      };

      addDrawing(drawingData);
    }
  } else if (fibRetracementData.id) {
    // This fib retracement was loaded from store - update the primitive ID in store to match new primitive
    const { updateDrawing } = useDrawingsStore.getState();
    updateDrawing(fibRetracementData.id, { primitiveId: fibRetracement.id });
  }

  return fibRetracement;
}
