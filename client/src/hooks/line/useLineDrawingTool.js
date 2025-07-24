import { useEffect, useRef } from "react";
import { LineDrawingTool } from "../../drawing-tools/line";
import { TOOL_LINE, TOOL_CROSSHAIR } from "../../store/tool";

// useLineDrawingTool.js - React hook for managing the lifecycle of the LineDrawingTool
// Handles creation, initialization, cleanup, and drawing mode switching for lines
function useLineDrawingTool(
  chart,
  candlestickSeries,
  setCurrentTool,
  setLinesData,
  setSelectedLineId,
  currentTool,
  activeResizeHandleRef,
  candleData = null,
) {
  // Ref to the LineDrawingTool instance
  const lineDrawingTool = useRef(null);

  // Create the line tool (without candleData dependency to prevent recreation on data updates)
  useEffect(() => {
    if (!chart || !candlestickSeries) return;
    // Create a new LineDrawingTool instance when chart/series change
    lineDrawingTool.current = new LineDrawingTool(
      chart,
      candlestickSeries,
      () => setCurrentTool(TOOL_CROSSHAIR),
      {},
      setLinesData,
      (line) => setSelectedLineId(line.id),
      activeResizeHandleRef,
      candleData,
    );
    // Cleanup: remove tool on unmount or dependency change
    return () => {
      lineDrawingTool.current = null;
    };
  }, [
    chart,
    candlestickSeries,
    setCurrentTool,
    setLinesData,
    setSelectedLineId,
    activeResizeHandleRef,
  ]);

  // Update candleData on the existing tool when data changes
  useEffect(() => {
    if (lineDrawingTool.current && candleData) {
      lineDrawingTool.current.updateCandleData(candleData);
    }
  }, [candleData]);

  useEffect(() => {
    // Update active resize handle ref in the tool
    if (lineDrawingTool.current) {
      lineDrawingTool.current.setActiveResizeHandle(activeResizeHandleRef);
    }
  }, [activeResizeHandleRef]);
  useEffect(() => {
    if (!lineDrawingTool.current) return;
    // Start or stop drawing mode based on current tool
    if (currentTool === TOOL_LINE) {
      lineDrawingTool.current.startDrawing();
    } else {
      lineDrawingTool.current.stopDrawing();
    }
  }, [currentTool]);
  return lineDrawingTool;
}

export default useLineDrawingTool;
