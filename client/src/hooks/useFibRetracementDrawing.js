// useFibRetracementDrawing.js - React hook for managing the lifecycle of the FibRetracementDrawingTool
import React, { useRef, useCallback, useEffect } from "react";
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
import { useOptimizedFibSelection } from "./useOptimizedSelection";
import { useViewportDrawings, getLineTimeRange } from "./useViewportDrawings";

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

  // Use viewport-based drawing management for performance
  const { visibleDrawings: visibleFibRetracements } = useViewportDrawings(
    chart,
    retracementsData,
    getLineTimeRange, // Fib retracements use same time range logic as lines
  );

  // Track previously attached fib retracements to handle deletions properly
  const previouslyAttachedRef = useRef(new Set());

  // Use optimized selection management for fibonacci retracements
  const { updateSelection, resetSelection } =
    useOptimizedFibSelection(retracementsData);

  // Optimized selection management - only update affected drawings
  useEffect(() => {
    updateSelection(selectedFibRetracementId, hoveredFibRetracementId);
  }, [selectedFibRetracementId, hoveredFibRetracementId, updateSelection]);

  // Re-attach only visible fib retracements to the chart/series when chart or series changes
  useEffect(() => {
    // Skip re-attachment when no chart/series available
    if (!chart || !candlestickSeries) return;

    // Get current fib IDs for comparison
    const currentFibIds = new Set(retracementsData.map((fib) => fib.id));

    // Detach fibs that are no longer in the data (deleted fibs)
    previouslyAttachedRef.current.forEach((attachedFib) => {
      if (!currentFibIds.has(attachedFib.id)) {
        // Fib was deleted - force detach it
        if (attachedFib._series && attachedFib._series.detachPrimitive) {
          attachedFib._series.detachPrimitive(attachedFib);
        }
      }
    });

    // Detach all current fibs first (clean slate)
    retracementsData.forEach((fib) => {
      if (fib._series && fib._series.detachPrimitive) {
        fib._series.detachPrimitive(fib);
      }
    });

    // Attach only visible fibs
    visibleFibRetracements.forEach((fib) => {
      // Attach to the new series
      candlestickSeries.attachPrimitive(fib);
      // Update references
      fib._series = candlestickSeries;
      fib._chart = chart;
    });

    // Update tracking of attached fibs
    previouslyAttachedRef.current = new Set(visibleFibRetracements);
  }, [chart, candlestickSeries, retracementsData, visibleFibRetracements]);

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
