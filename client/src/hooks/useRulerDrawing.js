import { useRef } from "react";
import { useToolStore } from "../store/tool";
import useRulerState from "./ruler/useRulerState";
import useRulerDrawingTool from "./ruler/useRulerDrawingTool";
import useRulerChartEvents from "./ruler/useRulerChartEvents";

// useRulerDrawing.js - React hook for integrating all ruler drawing logic and state management
// useRulerDrawing integrates all hooks and logic for ruler drawing and state management
export function useRulerDrawing(chart, candlestickSeries, candleData) {
  // Tool state (current tool, setter)
  const currentTool = useToolStore((s) => s.currentTool);
  const { setCurrentTool } = useToolStore();
  const currentToolRef = useRef(currentTool);
  currentToolRef.current = currentTool;

  // State and actions for rulers (data)
  const { rulersData, setRulersData } = useRulerState();
  // Ref to always have the latest rulersData in event handlers
  const rulersDataRef = useRef(rulersData);
  rulersDataRef.current = rulersData;

  // Main drawing tool instance (manages primitives and drawing mode)
  const rulerDrawingTool = useRulerDrawingTool(
    chart,
    candlestickSeries,
    setCurrentTool,
    setRulersData,
    currentTool,
    candleData,
  );

  // Subscribe to chart click and crosshair move events for ruler logic
  useRulerChartEvents(
    chart,
    candlestickSeries,
    currentToolRef,
    rulersDataRef,
    rulerDrawingTool,
  );

  // Expose the drawing tool for use in UI or other hooks
  return { rulerDrawingTool };
}
