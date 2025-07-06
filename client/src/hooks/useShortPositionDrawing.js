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

  // Ensure short positions are aware of selection/hover for label/handle visibility
  React.useEffect(() => {
    if (shortPositionDrawingTool.current) {
      shortPositionDrawingTool.current.setSelectedPositionId(
        selectedShortPositionId,
      );
      shortPositionDrawingTool.current.setHoveredPositionId(
        hoveredShortPositionId,
      );
    }
    // Toggle showHandles for hovered/selected positions (crucial for cursor logic)
    shortPositionsDataRef.current.forEach((pos) => {
      const shouldShow =
        pos.id === selectedShortPositionId || pos.id === hoveredShortPositionId;
      pos.applyOptions({ showHandles: shouldShow });
    });

    // ENTRY TAPPED LOGIC
    shortPositionsDataRef.current.forEach((pos) => {
      if (!pos._entryPrice || !candleData || !Array.isArray(candleData)) {
        pos.setEntryTapped(false);
        return;
      }
      const entryTime = pos._entryPrice.time;
      const entryPrice = pos._entryPrice.price;
      // Find the index of the entry candle
      const entryIdx = candleData.findIndex((c) => c.time === entryTime);
      if (entryIdx === -1) {
        pos.setEntryTapped(false);
        return;
      }
      // Check all candles after entry (including entry candle)
      let tapped = false;
      for (let i = entryIdx; i < candleData.length; ++i) {
        const c = candleData[i];
        if (c.low <= entryPrice && entryPrice <= c.high) {
          tapped = true;
          break;
        }
      }
      pos.setEntryTapped(tapped);
    });
  }, [
    selectedShortPositionId,
    hoveredShortPositionId,
    shortPositionDrawingTool,
    shortPositionsDataRef,
    candleData,
  ]);

  // Re-attach all short positions to the chart/series when chart or series changes
  // This is needed for real-time animation during resize operations
  useEffect(() => {
    // Skip re-attachment during timeframe/ticker transitions to prevent race conditions
    if (isTransitioningRef.current) {
      return;
    }

    // Skip re-attachment when no positions exist
    if (!chart || !candlestickSeries || shortPositionsData.length === 0) return;

    shortPositionsData.forEach((pos) => {
      // Detach from any previous series
      if (pos._series && pos._series.detachPrimitive) {
        pos._series.detachPrimitive(pos);
      }
      // Attach to the new series
      candlestickSeries.attachPrimitive(pos);
      // Update references
      pos._series = candlestickSeries;
      pos._chart = chart;
    });
  }, [chart, candlestickSeries, shortPositionsData]);

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
