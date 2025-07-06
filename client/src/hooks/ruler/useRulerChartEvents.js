// useRulerChartEvents.js - React hook for handling chart click and mouse move events for ruler tool
import { useEffect } from "react";
import { TOOL_RULER } from "../../store/tool";

// Handles subscribing/unsubscribing to chart click and crosshair move events for the ruler tool
function useRulerChartEvents(
  chart,
  candlestickSeries,
  currentToolRef,
  rulersDataRef,
  rulerDrawingTool,
) {
  useEffect(() => {
    if (!chart || !candlestickSeries) return;

    // Handle chart click: clear all rulers if not in ruler tool
    const handleChartClick = () => {
      if (currentToolRef.current !== TOOL_RULER) {
        rulerDrawingTool.current?.deleteAll();
      }
    };

    // Handle mouse move: clear all rulers if dragging (left mouse button pressed)
    const handleMouseMove = (e) => {
      if (e.buttons === 1) {
        // Left mouse button is pressed
        rulerDrawingTool.current?.deleteAll();
      }
    };

    chart.subscribeClick(handleChartClick);
    chart.chartElement().addEventListener("mousemove", handleMouseMove);

    return () => {
      chart.unsubscribeClick(handleChartClick);
      chart.chartElement().removeEventListener("mousemove", handleMouseMove);
    };
  }, [
    chart,
    candlestickSeries,
    currentToolRef,
    rulersDataRef,
    rulerDrawingTool,
  ]);
}

export default useRulerChartEvents;
