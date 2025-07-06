// useRulerDrawingTool.js - React hook for managing the lifecycle of the RulerTool
import { useEffect, useRef } from "react";
import { RulerTool } from "../../drawing-tools/ruler";
import { TOOL_RULER, TOOL_CROSSHAIR } from "../../store/tool";

// Handles creation, initialization, cleanup, and drawing mode switching for the ruler tool
function useRulerDrawingTool(
  chart,
  candlestickSeries,
  setCurrentTool,
  setRulersData,
  currentTool,
  candleData,
) {
  const rulerDrawingTool = useRef(null);

  // Create the ruler tool (without candleData dependency to prevent recreation on data updates)
  useEffect(() => {
    if (!chart || !candlestickSeries) return;
    rulerDrawingTool.current = new RulerTool(
      chart,
      candlestickSeries,
      () => setCurrentTool(TOOL_CROSSHAIR),
      setRulersData,
    );
    return () => {
      rulerDrawingTool.current?.remove();
      rulerDrawingTool.current = null;
    };
  }, [chart, candlestickSeries, setCurrentTool, setRulersData]);

  // Update candleData on the existing tool when data changes
  useEffect(() => {
    if (rulerDrawingTool.current && candleData) {
      rulerDrawingTool.current.candleData = candleData;
    }
  }, [candleData]);

  useEffect(() => {
    if (!rulerDrawingTool.current) return;
    if (currentTool === TOOL_RULER) {
      rulerDrawingTool.current.startDrawing();
    } else {
      rulerDrawingTool.current.stopDrawing();
    }
  }, [currentTool]);

  return rulerDrawingTool;
}

export default useRulerDrawingTool;
