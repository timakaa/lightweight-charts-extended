import { useEffect } from "react";
import { isPointNearLine } from "../../drawing-tools/line/helpers";

/**
 * useLineCursor
 *
 * React hook to manage the mouse cursor style for line endpoints and body.
 * - Sets 'nwse-resize' when hovering an endpoint (resize).
 * - Sets 'pointer' when hovering the line body (but not on an endpoint).
 * - Sets 'crosshair' otherwise.
 * - If drag or resize is active, uses the override cursor from dragOrResizeStateRef.
 *
 * @param {object} chart - Chart instance
 * @param {object} candlestickSeries - Candlestick series instance
 * @param {string|null} hoveredLineId - ID of hovered line
 * @param {string|null} selectedLineId - ID of selected line
 * @param {object} linesDataRef - Ref to array of all line data
 * @param {object} dragOrResizeStateRef - Ref with { isActive, cursor } for drag/resize override
 * @param {Array} candleData - Array of candle data for logical coordinate conversion
 */
function useLineCursor(
  chart,
  candlestickSeries,
  hoveredLineId,
  selectedLineId,
  linesDataRef,
  dragOrResizeStateRef,
  candleData,
) {
  useEffect(() => {
    if (!chart || !candlestickSeries) return;
    const container = chart.chartElement();
    if (!container) return;

    // Helper to convert logical index to time
    const logicalIndexToTime = (logicalIndex, candleData) => {
      if (
        !candleData ||
        !Array.isArray(candleData) ||
        candleData.length === 0
      ) {
        return null;
      }

      // Handle positive indices (within data range)
      if (logicalIndex >= 0 && logicalIndex < candleData.length) {
        return candleData[Math.floor(logicalIndex)].time;
      }

      // Handle negative indices (before first candle)
      if (logicalIndex < 0 && candleData.length >= 2) {
        const interval = candleData[1].time - candleData[0].time;
        return candleData[0].time + logicalIndex * interval;
      }

      // Handle indices after last candle
      if (logicalIndex >= candleData.length && candleData.length >= 2) {
        const interval =
          candleData[candleData.length - 1].time -
          candleData[candleData.length - 2].time;
        const extraSteps = logicalIndex - (candleData.length - 1);
        return candleData[candleData.length - 1].time + extraSteps * interval;
      }

      return null;
    };

    // Convert mouse event to logical chart coordinates
    const getMouseLogical = (event) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const timeScale = chart.timeScale();

      // Get logical coordinate (always available)
      const logicalIndex = timeScale.coordinateToLogical(x);

      // Try to get time using coordinateToTime first
      let time = timeScale.coordinateToTime(x);

      // If time is null (outside data range), calculate from logical coordinate
      if (time === null && candleData && candleData.length > 0) {
        time = logicalIndexToTime(logicalIndex, candleData);
      }

      const price = candlestickSeries.coordinateToPrice(y);

      // Return point with both time and logical coordinates
      return {
        time,
        price,
        logicalIndex: logicalIndex,
      };
    };

    // Helper to set cursor on all relevant elements
    const setGlobalCursor = (cursor) => {
      container.style.cursor = cursor;
      document.body.style.cursor = cursor;
      document.documentElement.style.cursor = cursor;
    };

    // Helper to reset cursor on all relevant elements
    const resetGlobalCursor = () => {
      container.style.cursor = "crosshair";
      document.body.style.cursor = "";
      document.documentElement.style.cursor = "";
    };

    // Main mousemove handler for cursor logic
    const handleMouseMove = (e) => {
      // If dragging or resizing, use the override cursor
      if (dragOrResizeStateRef && dragOrResizeStateRef.current.isActive) {
        setGlobalCursor(dragOrResizeStateRef.current.cursor || "pointer");
        return;
      }

      let cursor = "crosshair"; // Default cursor
      const mouse = getMouseLogical(e);

      // Use hovered or selected line for hit-testing
      const targetId = hoveredLineId || selectedLineId;
      if (targetId && mouse.price !== null) {
        // Only require valid price (time can be null for positions outside data range)
        const targetLine = linesDataRef.current.find((l) => l.id === targetId);
        if (targetLine) {
          const { near, onPoint } = isPointNearLine(
            mouse,
            targetLine,
            chart,
            candlestickSeries,
          );

          if (near) {
            if (onPoint !== null) {
              // Show resize cursor for endpoints
              cursor = "nwse-resize";
            } else {
              // Show pointer cursor for line body
              cursor = "pointer";
            }
          }
        }
      }

      setGlobalCursor(cursor);
    };

    // Attach mousemove event
    container.addEventListener("mousemove", handleMouseMove);

    // Cleanup on unmount or dependency change
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      resetGlobalCursor();
    };
  }, [
    chart,
    candlestickSeries,
    hoveredLineId,
    selectedLineId,
    linesDataRef,
    dragOrResizeStateRef,
    candleData,
  ]);
}

export default useLineCursor;
