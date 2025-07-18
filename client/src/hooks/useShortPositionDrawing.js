// useShortPositionDrawing.js - React hook for integrating all short position drawing logic and state management
import { useRef, useEffect } from "react";
import { useToolStore, TOOL_CROSSHAIR } from "../store/tool";
import useShortPositionState from "./short-position/useShortPositionState";
import useShortPositionChartEvents from "./short-position/useShortPositionChartEvents";
import React from "react";
import {
  deleteSelectedPosition,
  deleteAllPositions,
} from "./position/tools/positionDeleteTools";
import usePositionDrag from "./position/usePositionDrag";
import useShortPositionResize from "./short-position/useShortPositionResize";
import { useShortPositionDrawingTool } from "./short-position/useShortPositionDrawingTool";
import usePositionKeyboardShortcuts from "./position/usePositionKeyboardShortcuts";
import useShortPositionCursor from "./short-position/useShortPositionCursor";
import { useChartStore } from "../store/chart";
import {
  useViewportDrawings,
  getPositionTimeRange,
} from "./useViewportDrawings";
import { useOptimizedPositionSelection } from "./useOptimizedSelection";

// Integrates all hooks and logic for short position drawing, selection, drag, resize, and keyboard shortcuts
export const useShortPositionDrawing = (
  chart,
  candlestickSeries,
  candleData,
) => {
  const timeframe = useChartStore((s) => s.timeframe);
  const ticker = useChartStore((s) => s.ticker);
  const timeframeRef = useRef(timeframe);
  const tickerRef = useRef(ticker);

  const {
    positionsData: shortPositionsData,
    setPositionsData: setShortPositionsData,
    selectedPositionId: selectedShortPositionId,
    setSelectedPositionId: setSelectedShortPositionId,
    clearSelectedPositionId: clearSelectedShortPositionId,
    hoveredPositionId: hoveredShortPositionId,
    setHoveredPositionId: setHoveredShortPositionId,
    clearHoveredPositionId: clearHoveredShortPositionId,
  } = useShortPositionState();
  const shortPositionsDataRef = useRef(shortPositionsData);
  shortPositionsDataRef.current = shortPositionsData;

  const { currentTool, setCurrentTool } = useToolStore();
  const currentToolRef = useRef(currentTool);
  currentToolRef.current = currentTool;

  const isResizingRef = useRef(false);
  const activeResizeHandleRef = useRef(null);
  const dragOrResizeStateRef = useRef({ isActive: false, cursor: null });

  // Track if we're in a timeframe/ticker transition to avoid re-attachment during cleanup
  const isTransitioningRef = useRef(false);

  // Main drawing tool instance (manages primitives and drawing mode)
  const shortPositionDrawingTool = useShortPositionDrawingTool(
    chart,
    candlestickSeries,
    setCurrentTool,
    setShortPositionsData,
    setSelectedShortPositionId,
    currentTool,
    candleData,
    activeResizeHandleRef,
  );

  // Subscribe to chart click and crosshair move events for selection/hover
  useShortPositionChartEvents(
    chart,
    candlestickSeries,
    currentToolRef,
    shortPositionsDataRef,
    setSelectedShortPositionId,
    clearSelectedShortPositionId,
    setHoveredShortPositionId,
    clearHoveredShortPositionId,
    shortPositionDrawingTool,
    hoveredShortPositionId,
    selectedShortPositionId,
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
  const { visibleDrawings: visibleShortPositions } = useViewportDrawings(
    chart,
    shortPositionsData,
    getPositionTimeRange,
  );

  // Use optimized selection management
  const { updateSelection, updateEntryTappedLogic, resetSelection } =
    useOptimizedPositionSelection(shortPositionsData);

  // Optimized selection management - only update affected drawings
  React.useEffect(() => {
    if (shortPositionDrawingTool.current) {
      shortPositionDrawingTool.current.setSelectedPositionId(
        selectedShortPositionId,
      );
      shortPositionDrawingTool.current.setHoveredPositionId(
        hoveredShortPositionId,
      );
    }

    // Use optimized selection update (only affects changed drawings)
    updateSelection(selectedShortPositionId, hoveredShortPositionId);
  }, [
    selectedShortPositionId,
    hoveredShortPositionId,
    shortPositionDrawingTool,
    updateSelection,
  ]);

  // Optimized entry tapped logic - only process visible drawings
  React.useEffect(() => {
    updateEntryTappedLogic(visibleShortPositions, candleData);
  }, [visibleShortPositions, candleData, updateEntryTappedLogic]);

  // Reset selection tracking on timeframe/ticker changes
  React.useEffect(() => {
    resetSelection();
  }, [timeframe, ticker, resetSelection]);

  // Track previously attached positions to handle deletions properly
  const previouslyAttachedRef = useRef(new Set());

  // Re-attach only visible short positions to the chart/series when chart or series changes
  // This is needed for real-time animation during resize operations
  useEffect(() => {
    // Skip re-attachment during timeframe/ticker transitions to prevent race conditions
    if (isTransitioningRef.current) {
      return;
    }

    // Skip re-attachment when no chart/series available
    if (!chart || !candlestickSeries) return;

    // Get current position IDs for comparison
    const currentPositionIds = new Set(shortPositionsData.map((pos) => pos.id));
    const visiblePositionIds = new Set(
      visibleShortPositions.map((pos) => pos.id),
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
    shortPositionsData.forEach((pos) => {
      if (pos._series && pos._series.detachPrimitive) {
        pos._series.detachPrimitive(pos);
      }
    });

    // Attach only visible positions
    visibleShortPositions.forEach((pos) => {
      // Attach to the new series
      candlestickSeries.attachPrimitive(pos);
      // Update references
      pos._series = candlestickSeries;
      pos._chart = chart;
    });

    // Update tracking of attached positions
    previouslyAttachedRef.current = new Set(visibleShortPositions);
  }, [chart, candlestickSeries, shortPositionsData, visibleShortPositions]);

  // Enable resizing of short position handles
  useShortPositionResize(
    chart,
    candlestickSeries,
    hoveredShortPositionId,
    selectedShortPositionId,
    shortPositionsDataRef,
    isResizingRef,
    setSelectedShortPositionId,
    candleData,
    dragOrResizeStateRef,
    activeResizeHandleRef,
  );

  // Enable drag-and-drop for short positions
  usePositionDrag(
    chart,
    candlestickSeries,
    hoveredShortPositionId,
    selectedShortPositionId,
    clearSelectedShortPositionId,
    clearHoveredShortPositionId,
    shortPositionsDataRef,
    isResizingRef,
    setSelectedShortPositionId,
    dragOrResizeStateRef,
    "short",
    candleData,
  );

  // Keyboard shortcut for deleting selected short position
  usePositionKeyboardShortcuts(selectedShortPositionId, () =>
    deleteSelectedPosition(
      shortPositionDrawingTool,
      shortPositionsDataRef,
      selectedShortPositionId,
      clearSelectedShortPositionId,
    ),
  );

  // Set mouse cursor style based on hover/drag/resize state
  useShortPositionCursor(
    chart,
    candlestickSeries,
    hoveredShortPositionId,
    shortPositionsDataRef,
    selectedShortPositionId,
    dragOrResizeStateRef,
    activeResizeHandleRef,
    candleData,
  );

  // Expose data and selection functions
  return {
    shortPositionsData,
    selectedShortPositionId,
    setSelectedShortPositionId,
    clearSelectedShortPositionId,
    hoveredShortPositionId,
    setHoveredShortPositionId,
    shortPositionDrawingTool,
    setShortPositionsData,
    clearHoveredShortPositionId,
    activeResizeHandleRef,
    deleteSelectedShortPosition: () =>
      deleteSelectedPosition(
        shortPositionDrawingTool,
        shortPositionsDataRef,
        selectedShortPositionId,
        clearSelectedShortPositionId,
      ),
    deleteAllShortPositions: () =>
      deleteAllPositions(
        shortPositionDrawingTool,
        clearSelectedShortPositionId,
      ),
  };
};
