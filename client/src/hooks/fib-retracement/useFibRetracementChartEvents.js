// useFibRetracementChartEvents.js - React hook for handling chart click and crosshair move events for fib retracements
import { useEffect } from "react";
import { TOOL_CROSSHAIR } from "../../store/tool";
import { logicalIndexToTime } from "../../helpers/coordinateUtils.js";

/**
 * useFibRetracementChartEvents
 *
 * Handles chart click and crosshair move events for fib retracements:
 * - Chart click: selects hovered retracement or clears selection with hybrid coordinate support
 * - Crosshair move: updates hovered retracement based on proximity with hybrid coordinates
 * - Keeps retracement hover/selection state in sync with chart events
 * - Supports interaction outside candle range using logical coordinates
 *
 * @param {object} chart - Chart instance
 * @param {object} candlestickSeries - Candlestick series instance
 * @param {object} currentToolRef - Ref to current tool
 * @param {object} retracementsDataRef - Ref to array of all retracement data
 * @param {function} setSelectedFibRetracementId - Sets selection
 * @param {function} clearSelectedFibRetracementId - Clears selection
 * @param {function} setHoveredFibRetracementId - Sets hover
 * @param {function} clearHoveredFibRetracementId - Clears hover
 * @param {object} fibRetracementDrawingTool - Ref to drawing tool instance
 * @param {string|null} hoveredFibRetracementId - ID of hovered retracement
 * @param {Array} candleData - Array of candle data for hybrid coordinates
 */
function useFibRetracementChartEvents(
  chart,
  candlestickSeries,
  currentToolRef,
  retracementsDataRef,
  setSelectedFibRetracementId,
  clearSelectedFibRetracementId,
  setHoveredFibRetracementId,
  clearHoveredFibRetracementId,
  fibRetracementDrawingTool,
  hoveredFibRetracementId,
  candleData,
) {
  useEffect(() => {
    if (!chart || !candlestickSeries) return;

    // Convert chart event to logical coordinates with hybrid coordinate support
    const getLogicalPoint = (param) => {
      if (!param.point) return null;

      let time = param.time;
      let price = candlestickSeries.coordinateToPrice(param.point.y);

      // Handle clicks outside candle range
      if (!time && candleData && candleData.length > 0) {
        const timeScale = chart.timeScale();
        const logicalIndex = timeScale.coordinateToLogical(param.point.x);

        if (logicalIndex !== null) {
          time = logicalIndexToTime(logicalIndex, candleData);
        }
      }

      return time && price !== null ? { time, price } : null;
    };

    // Handle chart click: select hovered retracement (level) or clear selection
    const handleChartClick = (param) => {
      if (currentToolRef.current !== TOOL_CROSSHAIR) return;
      if (!param.point || param.hoveredSeries || param.hoveredObject) {
        return;
      }
      if (hoveredFibRetracementId) {
        setSelectedFibRetracementId(hoveredFibRetracementId);
      } else {
        // Check if click is inside any selected fib retracement using hybrid coordinates
        const point = getLogicalPoint(param);
        if (point) {
          const selectedFib = retracementsDataRef.current.find(
            (fib) =>
              fib.id ===
              fibRetracementDrawingTool.current?._selectedFibRetracementId,
          );
          if (
            selectedFib &&
            selectedFib.isPointInsideRetracement &&
            selectedFib.isPointInsideRetracement(point)
          ) {
            // Do not clear selection if click is inside selected retracement area
            return;
          }
        }
        clearSelectedFibRetracementId();
      }
    };

    // Handle crosshair move: update hovered retracement based on proximity
    const handleCrosshairMove = (param) => {
      if (currentToolRef.current !== TOOL_CROSSHAIR) return;
      if (!param.point) {
        clearHoveredFibRetracementId();
        return;
      }

      const fibTool = fibRetracementDrawingTool.current;
      if (!fibTool) {
        clearHoveredFibRetracementId();
        return;
      }

      // Get logical coordinates with hybrid support
      const logicalPoint = getLogicalPoint(param);
      if (!logicalPoint) {
        clearHoveredFibRetracementId();
        return;
      }

      let found = false;
      for (const fib of retracementsDataRef.current) {
        const hovered = fib.isHoveredLogical(logicalPoint);
        if (hovered) {
          setHoveredFibRetracementId(fib.id);
          fib.updateAllViews();
          found = true;
          break;
        } else {
          fib.updateAllViews();
        }
      }

      if (!found) {
        clearHoveredFibRetracementId();
      }
    };

    // Subscribe to chart events
    chart.subscribeClick(handleChartClick);
    chart.subscribeCrosshairMove(handleCrosshairMove);

    // Cleanup on unmount or dependency change
    return () => {
      chart.unsubscribeClick(handleChartClick);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
    };
  }, [
    chart,
    candlestickSeries,
    setSelectedFibRetracementId,
    clearSelectedFibRetracementId,
    setHoveredFibRetracementId,
    clearHoveredFibRetracementId,
    currentToolRef,
    retracementsDataRef,
    fibRetracementDrawingTool,
    hoveredFibRetracementId,
    candleData,
  ]);
}

export default useFibRetracementChartEvents;
