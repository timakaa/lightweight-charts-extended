// useLongPositionDrawing.js - React hook for integrating all long position drawing logic and state management
import { useRef, useEffect } from "react";
import React from "react";
import { useChartStore } from "../store/chart";
import useLongPositionState from "./long-position/useLongPositionState";
import { useToolStore } from "../store/tool";
import useLongPositionDrawingTool from "./long-position/useLongPositionDrawingTool";
import useLongPositionChartEvents from "./long-position/useLongPositionChartEvents";
import useLongPositionResize from "./long-position/useLongPositionResize";
import usePositionDrag from "./position/usePositionDrag";
import usePositionKeyboardShortcuts from "./position/usePositionKeyboardShortcuts";
import {
  deleteSelectedPosition,
  deleteAllPositions,
} from "./position/tools/positionDeleteTools";
import useLongPositionCursor from "./long-position/useLongPositionCursor";
import {
  useViewportDrawings,
  getPositionTimeRange,
} from "./useViewportDrawings";
import { useOptimizedPositionSelection } from "./useOptimizedSelection";

// Integrates all hooks and logic for long position drawing, selection, drag, resize, and keyboard shortcuts
export const useLongPositionDrawing = (
  chart,
  candlestickSeries,
  candleData,
) => {
  const timeframe = useChartStore((s) => s.timeframe);
  const ticker = useChartStore((s) => s.ticker);
  const timeframeRef = useRef(timeframe);
  const tickerRef = useRef(ticker);

  const {
    positionsData: longPositionsData,
    setPositionsData: setLongPositionsData,
    selectedPositionId: selectedLongPositionId,
    setSelectedPositionId: setSelectedLongPositionId,
    clearSelectedPositionId: clearSelectedLongPositionId,
    hoveredPositionId: hoveredLongPositionId,
    setHoveredPositionId: setHoveredLongPositionId,
    clearHoveredPositionId: clearHoveredLongPositionId,
  } = useLongPositionState();
  const longPositionsDataRef = useRef(longPositionsData);
  longPositionsDataRef.current = longPositionsData;

  const { currentTool, setCurrentTool } = useToolStore();
  const currentToolRef = useRef(currentTool);
  currentToolRef.current = currentTool;

  const isResizingRef = useRef(false);
  const activeResizeHandleRef = useRef(null);
  const dragOrResizeStateRef = useRef({ isActive: false, cursor: null });

  // Track if we're in a timeframe/ticker transition to avoid re-attachment during cleanup
  const isTransitioningRef = useRef(false);

  // Main drawing tool instance (manages primitives and drawing mode)
  const longPositionDrawingTool = useLongPositionDrawingTool(
    chart,
    candlestickSeries,
    setCurrentTool,
    setLongPositionsData,
    setSelectedLongPositionId,
    currentTool,
    candleData,
    activeResizeHandleRef,
  );

  // Subscribe to chart click and crosshair move events for selection/hover
  useLongPositionChartEvents(
    chart,
    candlestickSeries,
    currentToolRef,
    longPositionsDataRef,
    setSelectedLongPositionId,
    clearSelectedLongPositionId,
    setHoveredLongPositionId,
    clearHoveredLongPositionId,
    longPositionDrawingTool,
    hoveredLongPositionId,
    selectedLongPositionId,
    candleData,
  );

  // Detect timeframe/ticker changes and set flag to prevent re-attachment during cleanup
  useEffect(() => {
    const timeframeChanged = timeframeRef.current !== timeframe;
    const tickerChanged = tickerRef.current !== ticker;

    if (timeframeChanged || tickerChanged) {
      isTransitioningRef.current = true;
      timeframeRef.current = timeframe;
      tickerRef.current = ticker;

      // Reset the flag after a short delay to allow cleanup to complete
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 100);
    }
  }, [timeframe, ticker]);

  // Use viewport-based drawing management for performance
  const { visibleDrawings: visibleLongPositions } = useViewportDrawings(
    chart,
    longPositionsData,
    getPositionTimeRange,
  );

  // Use optimized selection management
  const { updateSelection, updateEntryTappedLogic, resetSelection } =
    useOptimizedPositionSelection(longPositionsData);

  // Optimized selection management - only update affected drawings
  React.useEffect(() => {
    if (longPositionDrawingTool.current) {
      longPositionDrawingTool.current.setSelectedPositionId(
        selectedLongPositionId,
      );
      longPositionDrawingTool.current.setHoveredPositionId(
        hoveredLongPositionId,
      );
    }

    // Use optimized selection update (only affects changed drawings)
    updateSelection(selectedLongPositionId, hoveredLongPositionId);
  }, [
    selectedLongPositionId,
    hoveredLongPositionId,
    longPositionDrawingTool,
    updateSelection,
  ]);

  // Optimized entry tapped logic - only process visible drawings
  React.useEffect(() => {
    updateEntryTappedLogic(visibleLongPositions, candleData);
  }, [visibleLongPositions, candleData, updateEntryTappedLogic]);

  // Reset selection tracking on timeframe/ticker changes
  React.useEffect(() => {
    resetSelection();
  }, [timeframe, ticker, resetSelection]);

  // Track previously attached positions to handle deletions properly
  const previouslyAttachedRef = useRef(new Set());

  // Re-attach only visible long positions to the chart/series when chart or series changes
  // This is needed for real-time animation during resize operations
  useEffect(() => {
    // Skip re-attachment during timeframe/ticker transitions to prevent race conditions
    if (isTransitioningRef.current) {
      return;
    }

    // Skip re-attachment when no chart/series available
    if (!chart || !candlestickSeries) return;

    // Get current position IDs for comparison
    const currentPositionIds = new Set(longPositionsData.map((pos) => pos.id));
    const visiblePositionIds = new Set(
      visibleLongPositions.map((pos) => pos.id),
    );

    // Detach positions that are no longer in the data (deleted positions)
    previouslyAttachedRef.current.forEach((attachedPos) => {
      if (!currentPositionIds.has(attachedPos.id)) {
        // Position was deleted - force detach it
        if (attachedPos._series && attachedPos._series.detachPrimitive) {
          attachedPos._series.detachPrimitive(attachedPos);
        }
      }
    });

    // Detach all current positions first (clean slate)
    longPositionsData.forEach((pos) => {
      if (pos._series && pos._series.detachPrimitive) {
        pos._series.detachPrimitive(pos);
      }
    });

    // Attach only visible positions
    visibleLongPositions.forEach((pos) => {
      // Attach to the new series
      candlestickSeries.attachPrimitive(pos);
      // Update references
      pos._series = candlestickSeries;
      pos._chart = chart;
    });

    // Update tracking of attached positions
    previouslyAttachedRef.current = new Set(visibleLongPositions);
  }, [chart, candlestickSeries, longPositionsData, visibleLongPositions]);

  // Enable resizing of long position handles
  useLongPositionResize(
    chart,
    candlestickSeries,
    hoveredLongPositionId,
    selectedLongPositionId,
    longPositionsDataRef,
    isResizingRef,
    setSelectedLongPositionId,
    candleData,
    dragOrResizeStateRef,
    activeResizeHandleRef,
  );

  // Enable drag-and-drop for long positions
  usePositionDrag(
    chart,
    candlestickSeries,
    hoveredLongPositionId,
    selectedLongPositionId,
    clearSelectedLongPositionId,
    clearHoveredLongPositionId,
    longPositionsDataRef,
    isResizingRef,
    setSelectedLongPositionId,
    dragOrResizeStateRef,
    "long",
    candleData,
  );

  // Keyboard shortcut for deleting selected long position
  usePositionKeyboardShortcuts(selectedLongPositionId, () =>
    deleteSelectedPosition(
      longPositionDrawingTool,
      longPositionsDataRef,
      selectedLongPositionId,
      clearSelectedLongPositionId,
    ),
  );

  // Set mouse cursor style based on hover/drag/resize state
  useLongPositionCursor(
    chart,
    candlestickSeries,
    hoveredLongPositionId,
    longPositionsDataRef,
    selectedLongPositionId,
    dragOrResizeStateRef,
    activeResizeHandleRef,
    candleData,
  );

  // Expose data and selection functions
  return {
    longPositionsData,
    setLongPositionsData,
    selectedLongPositionId,
    setSelectedLongPositionId,
    clearSelectedLongPositionId,
    hoveredLongPositionId,
    setHoveredLongPositionId,
    clearHoveredLongPositionId,
    longPositionDrawingTool,
    activeResizeHandleRef,
    deleteSelectedLongPosition: () =>
      deleteSelectedPosition(
        longPositionDrawingTool,
        longPositionsDataRef,
        selectedLongPositionId,
        clearSelectedLongPositionId,
      ),
    deleteAllLongPositions: () =>
      deleteAllPositions(longPositionDrawingTool, clearSelectedLongPositionId),
  };
};
