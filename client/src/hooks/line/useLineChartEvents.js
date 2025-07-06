import { useEffect } from "react";
import { isPointNearLine } from "../../drawing-tools/line/helpers";
import { TOOL_CROSSHAIR } from "../../store/tool";

const HOVER_THRESHOLD = 5; // pixels

// useLineChartEvents.js - React hook for handling chart click and crosshair move events for lines
// Handles subscribing/unsubscribing to chart click and crosshair move events
function useLineChartEvents(
  chart,
  candlestickSeries,
  currentToolRef,
  linesDataRef,
  setSelectedLineId,
  clearSelectedLineId,
  setHoveredLineId,
  clearHoveredLineId,
  lineDrawingTool,
  hoveredLineId,
) {
  useEffect(() => {
    if (!chart || !candlestickSeries) return;
    const container = chart.chartElement();
    if (!container) return;

    // Handle chart click: select hovered line or clear selection
    const handleChartClick = (param) => {
      if (currentToolRef.current !== TOOL_CROSSHAIR) return;
      if (!param.point || param.hoveredSeries || param.hoveredObject) {
        return;
      }
      if (hoveredLineId) {
        setSelectedLineId(hoveredLineId);
      } else {
        clearSelectedLineId();
      }
    };

    // Handle crosshair move: update hovered line based on proximity
    const handleCrosshairMove = (param) => {
      if (currentToolRef.current !== TOOL_CROSSHAIR) return;
      if (!param.point) {
        clearHoveredLineId();
        return;
      }

      const price = candlestickSeries.coordinateToPrice(param.point.y);
      if (price === null) {
        clearHoveredLineId();
        return;
      }

      // Create a point object for coordinate conversion
      let pointToCheck;

      if (param.time) {
        // Normal case: we have time from the param
        pointToCheck = { time: param.time, price };
      } else {
        // Mouse is outside data range: calculate logical index from mouse position
        const timeScale = chart.timeScale();
        const logicalIndex = timeScale.coordinateToLogical(param.point.x);
        pointToCheck = {
          time: null,
          price,
          logicalIndex: logicalIndex,
        };
      }

      // Find the first line near the crosshair
      const hoveredLine = linesDataRef.current.find((line) => {
        const { near } = isPointNearLine(
          pointToCheck,
          line,
          chart,
          candlestickSeries,
          HOVER_THRESHOLD,
        );
        return near;
      });

      if (hoveredLine) {
        setHoveredLineId(hoveredLine.id);
      } else {
        clearHoveredLineId();
      }
    };

    // Subscribe to chart events
    chart.subscribeClick(handleChartClick);
    chart.subscribeCrosshairMove(handleCrosshairMove);

    // Cleanup on unmount
    return () => {
      chart.unsubscribeClick(handleChartClick);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
    };
  }, [
    chart,
    candlestickSeries,
    setSelectedLineId,
    clearSelectedLineId,
    setHoveredLineId,
    clearHoveredLineId,
    currentToolRef,
    linesDataRef,
    lineDrawingTool,
    hoveredLineId,
  ]);
}

export default useLineChartEvents;
