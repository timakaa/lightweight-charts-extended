// useFibRetracementDrawing.js - React hook for managing the lifecycle of the FibRetracementDrawingTool
import React, { useRef, useCallback } from "react";
import { FibRetracementDrawingTool } from "../drawing-tools/fib-retracement";
import { TOOL_FIB_RETRACEMENT, TOOL_CROSSHAIR } from "../store/tool";
import useFibRetracementState from "./fib-retracement/useFibRetracementState";
import useFibRetracementChartEvents from "./fib-retracement/useFibRetracementChartEvents";
import {
  deleteSelectedFibRetracement as deleteSelectedFibRetracementUtil,
  deleteAllFibRetracements as deleteAllFibRetracementsUtil,
} from "./fib-retracement/tools/fibRetracementDeleteTools";
import useFibRetracementDrag from "./fib-retracement/useFibRetracementDrag";
import useFibRetracementKeyboardShortcuts from "./fib-retracement/useFibRetracementKeyboardShortcuts";
import useFibRetracementDrawingTool from "./fib-retracement/useFibRetracementDrawingTool";
import useFibRetracementResize from "./fib-retracement/useFibRetracementResize";
import useFibRetracementCursor from "./fib-retracement/useFibRetracementCursor";

function useFibRetracementDrawing(
  chart,
  candlestickSeries,
  setCurrentTool,
  currentTool,
  candleData,
) {
  const {
    retracementsData,
    setRetracementsData,
    selectedFibRetracementId,
    setSelectedFibRetracementId,
    clearSelectedFibRetracementId,
    hoveredFibRetracementId,
    setHoveredFibRetracementId,
    clearHoveredFibRetracementId,
  } = useFibRetracementState();

  const retracementsDataRef = useRef(retracementsData);
  retracementsDataRef.current = retracementsData;
  const currentToolRef = useRef(currentTool);
  currentToolRef.current = currentTool;

  // Add activeResizeHandleRef for consistency with other tools
  const activeResizeHandleRef = useRef(null);

  // Use the new drawing tool hook (must be before any effect that uses it)
  const fibRetracementDrawingTool = useFibRetracementDrawingTool(
    chart,
    candlestickSeries,
    setCurrentTool,
    setRetracementsData,
    setSelectedFibRetracementId,
    currentTool,
    candleData,
  );

  useFibRetracementChartEvents(
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
  );

  // Ref for resize state
  const dragOrResizeStateRef = React.useRef({ isActive: false, cursor: null });

  useFibRetracementDrag(
    chart,
    candlestickSeries,
    hoveredFibRetracementId,
    selectedFibRetracementId,
    clearSelectedFibRetracementId,
    clearHoveredFibRetracementId,
    retracementsDataRef,
    setSelectedFibRetracementId,
    dragOrResizeStateRef,
    candleData,
  );

  React.useEffect(() => {
    if (fibRetracementDrawingTool.current) {
      fibRetracementDrawingTool.current.setSelectedFibRetracementId(
        selectedFibRetracementId,
      );
    }
  }, [selectedFibRetracementId, fibRetracementDrawingTool]);

  // Track previous selection/hover state to update fib handle visibility
  const prevFibState = React.useRef({
    selectedFibRetracementId: null,
    hoveredFibRetracementId: null,
  });
  React.useEffect(() => {
    const prev = prevFibState.current;
    const curr = { selectedFibRetracementId, hoveredFibRetracementId };
    retracementsDataRef.current.forEach((fib) => {
      const shouldShow =
        fib.id === curr.selectedFibRetracementId ||
        fib.id === curr.hoveredFibRetracementId;
      const wasShown =
        fib.id === prev.selectedFibRetracementId ||
        fib.id === prev.hoveredFibRetracementId;
      if (shouldShow && !wasShown) fib.applyOptions({ showHandles: true });
      if (!shouldShow && wasShown) fib.applyOptions({ showHandles: false });
    });
    prevFibState.current = curr;
  }, [selectedFibRetracementId, hoveredFibRetracementId]);

  // Delete the currently selected fib retracement (if any)
  const deleteSelectedFibRetracement = useCallback(() => {
    deleteSelectedFibRetracementUtil(
      fibRetracementDrawingTool,
      retracementsDataRef,
      selectedFibRetracementId,
      clearSelectedFibRetracementId,
    );
  }, [
    selectedFibRetracementId,
    clearSelectedFibRetracementId,
    fibRetracementDrawingTool,
  ]);

  // Use keyboard shortcut hook for Backspace delete
  useFibRetracementKeyboardShortcuts(
    selectedFibRetracementId,
    deleteSelectedFibRetracement,
  );

  // Delete all fib retracements from the chart
  const deleteAllFibRetracements = useCallback(() => {
    deleteAllFibRetracementsUtil(fibRetracementDrawingTool);
    setSelectedFibRetracementId(null);
  }, [fibRetracementDrawingTool, setSelectedFibRetracementId]);

  useFibRetracementResize(
    chart,
    candlestickSeries,
    hoveredFibRetracementId,
    retracementsDataRef,
    setSelectedFibRetracementId,
    candleData,
    dragOrResizeStateRef,
    activeResizeHandleRef,
  );

  useFibRetracementCursor(
    chart,
    candlestickSeries,
    hoveredFibRetracementId,
    retracementsDataRef,
    selectedFibRetracementId,
    dragOrResizeStateRef,
    candleData,
  );

  return {
    selectedFibRetracementId,
    deleteSelectedFibRetracement,
    deleteAllFibRetracements,
    fibRetracementDrawingTool,
    setFibRetracementsData: setRetracementsData,
    activeResizeHandleRef,
  };
}

export default useFibRetracementDrawing;
