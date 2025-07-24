// useFibRetracementDrawingTool.js - React hook for managing the lifecycle of the FibRetracementDrawingTool
import { useEffect, useRef } from "react";
import { FibRetracementDrawingTool } from "../../drawing-tools/fib-retracement";
import { TOOL_FIB_RETRACEMENT, TOOL_CROSSHAIR } from "../../store/tool";

/**
 * useFibRetracementDrawingTool
 *
 * Handles creation, initialization, cleanup, and drawing mode switching for fib retracements:
 * - Instantiates the drawing tool and attaches it to the chart/series.
 * - Cleans up the tool on unmount or dependency change.
 * - Switches between drawing and non-drawing mode based on currentTool.
 * - Propagates candle data for hybrid coordinate system support.
 *
 * @param {object} chart - Chart instance
 * @param {object} candlestickSeries - Candlestick series instance
 * @param {function} setCurrentTool - Sets the current tool
 * @param {function} setRetracementsData - Sets retracement data array
 * @param {function} setSelectedFibRetracementId - Sets selected retracement
 * @param {string} currentTool - Current tool name
 * @param {Array} candleData - Array of candle data for hybrid coordinates
 * @returns {object} fibRetracementDrawingTool ref
 */
function useFibRetracementDrawingTool(
  chart,
  candlestickSeries,
  setCurrentTool,
  setRetracementsData,
  setSelectedFibRetracementId,
  currentTool,
  candleData,
) {
  // Ref to the drawing tool instance
  const fibRetracementDrawingTool = useRef(null);

  useEffect(() => {
    if (!chart || !candlestickSeries) return;
    // Create the drawing tool (without candleData dependency to prevent recreation on data updates)
    fibRetracementDrawingTool.current = new FibRetracementDrawingTool(
      chart,
      candlestickSeries,
      () => setCurrentTool(TOOL_CROSSHAIR),
      {},
      setRetracementsData,
      (fib) => setSelectedFibRetracementId(fib.id),
    );
    // Cleanup on unmount or dependency change
    return () => {
      fibRetracementDrawingTool.current = null;
    };
  }, [
    chart,
    candlestickSeries,
    setCurrentTool,
    setRetracementsData,
    setSelectedFibRetracementId,
  ]);

  // Update candle data on the existing tool when data changes
  useEffect(() => {
    if (fibRetracementDrawingTool.current && candleData) {
      fibRetracementDrawingTool.current.updateCandleData(candleData);
    }
  }, [candleData]);

  useEffect(() => {
    if (!fibRetracementDrawingTool.current) return;
    // Switch between drawing and non-drawing mode
    if (currentTool === TOOL_FIB_RETRACEMENT) {
      fibRetracementDrawingTool.current.startDrawing();
    } else {
      fibRetracementDrawingTool.current.stopDrawing();
    }
  }, [currentTool]);

  return fibRetracementDrawingTool;
}

export default useFibRetracementDrawingTool;
