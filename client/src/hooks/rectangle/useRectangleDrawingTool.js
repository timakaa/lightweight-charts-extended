// useRectangleDrawingTool.js - React hook for managing the lifecycle of the RectangleDrawingTool
import { useEffect, useRef } from "react";
import { RectangleDrawingTool } from "../../drawing-tools/rectangle";
import { TOOL_BOX, TOOL_CROSSHAIR } from "../../store/tool";

// Handles creation, initialization, cleanup, and drawing mode switching for rectangles (boxes)
function useRectangleDrawingTool(
  chart,
  candlestickSeries,
  setCurrentTool,
  setBoxesData,
  setSelectedBoxId,
  currentTool,
  activeResizeHandleRef,
  dragOrResizeStateRef,
  candleData = null,
) {
  const rectangleDrawingTool = useRef(null);

  // Create the rectangle tool (without candleData dependency to prevent recreation on data updates)
  useEffect(() => {
    if (!chart || !candlestickSeries) return;
    rectangleDrawingTool.current = new RectangleDrawingTool(
      chart,
      candlestickSeries,
      () => setCurrentTool(TOOL_CROSSHAIR),
      {},
      setBoxesData,
      (box) => setSelectedBoxId(box.id),
      activeResizeHandleRef,
      candleData,
    );
    return () => {
      rectangleDrawingTool.current = null;
    };
  }, [
    chart,
    candlestickSeries,
    setCurrentTool,
    setBoxesData,
    setSelectedBoxId,
    activeResizeHandleRef,
  ]);

  // Update candleData on the existing tool when data changes
  useEffect(() => {
    if (rectangleDrawingTool.current && candleData) {
      rectangleDrawingTool.current.updateCandleData(candleData);
    }
  }, [candleData]);

  useEffect(() => {
    if (rectangleDrawingTool.current) {
      rectangleDrawingTool.current.setActiveResizeHandle(activeResizeHandleRef);
    }
  }, [activeResizeHandleRef]);
  useEffect(() => {
    if (!rectangleDrawingTool.current) return;
    if (currentTool === TOOL_BOX) {
      rectangleDrawingTool.current.startDrawing();
    } else {
      rectangleDrawingTool.current.stopDrawing();
    }
  }, [currentTool]);
  return rectangleDrawingTool;
}

export default useRectangleDrawingTool;
