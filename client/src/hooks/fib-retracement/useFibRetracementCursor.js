import { useEffect } from "react";
import { logicalIndexToTime } from "../../helpers/coordinateUtils.js";

/**
 * useFibRetracementCursor
 *
 * React hook to manage the mouse cursor style for fib retracement handles and area.
 * - Sets 'nwse-resize' when hovering a handle (resize).
 * - Sets 'pointer' when inside the retracement area (but not on a handle).
 * - Sets 'crosshair' otherwise.
 * - If drag or resize is active, uses the override cursor from dragOrResizeStateRef.
 * - Supports hybrid coordinates for robust cursor detection outside candle range.
 *
 * @param {object} chart - Chart instance
 * @param {object} candlestickSeries - Candlestick series instance
 * @param {string|null} hoveredFibRetracementId - ID of hovered retracement
 * @param {object} retracementsDataRef - Ref to array of all retracement data
 * @param {string|null} selectedFibRetracementId - ID of selected retracement
 * @param {object} dragOrResizeStateRef - Ref with { isActive, cursor } for drag/resize override
 * @param {Array} candleData - Array of candle data for hybrid coordinates
 */
export default function useFibRetracementCursor(
  chart,
  candlestickSeries,
  hoveredFibRetracementId,
  retracementsDataRef,
  selectedFibRetracementId,
  dragOrResizeStateRef,
  candleData,
) {
  useEffect(() => {
    if (!chart || !candlestickSeries) return;
    const container = chart.chartElement ? chart.chartElement() : null;
    if (!container) return;

    // Convert mouse event to logical chart coordinates with hybrid coordinate support
    const getMouseLogical = (event) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      let time = chart.timeScale().coordinateToTime(x);
      let price = candlestickSeries.coordinateToPrice(y);

      // Handle coordinates outside candle range
      if (!time && candleData && candleData.length > 0) {
        const logicalIndex = chart.timeScale().coordinateToLogical(x);
        if (logicalIndex !== null) {
          time = logicalIndexToTime(logicalIndex, candleData);
        }
      }

      return time && price !== null ? { time, price } : null;
    };

    // Set the cursor globally (container, body, html)
    const setGlobalCursor = (cursor) => {
      container.style.cursor = cursor;
      document.body.style.cursor = cursor;
      document.documentElement.style.cursor = cursor;
    };

    // Reset the cursor to default (crosshair)
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

      if (!mouse) {
        setGlobalCursor(cursor);
        return;
      }

      // Use hovered or selected retracement for hit-testing
      const targetId = hoveredFibRetracementId || selectedFibRetracementId;
      if (targetId) {
        const targetFib = retracementsDataRef.current.find(
          (f) => f.id === targetId,
        );
        if (targetFib) {
          // Check if mouse is near a handle (returns 'p1' or 'p2' if so)
          const handle = targetFib.getHandleAtPoint(
            mouse,
            chart,
            candlestickSeries,
          );
          if (handle === "p1" || handle === "p2") {
            // Show resize cursor for handles
            cursor = "nwse-resize";
          } else {
            // If not on a handle, check if inside retracement area
            if (
              targetFib.isPointInsideRetracement &&
              targetFib.isPointInsideRetracement(mouse)
            ) {
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
    hoveredFibRetracementId,
    retracementsDataRef,
    selectedFibRetracementId,
    dragOrResizeStateRef,
  ]);
}
