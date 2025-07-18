// useLineDrawing.js - React hook for integrating all line drawing logic and state management

import { useRef, useCallback, useEffect } from "react";
import { useToolStore } from "../store/tool";
import useLineState from "./line/useLineState";
import useLineDrawingTool from "./line/useLineDrawingTool";
import {
  deleteSelectedLine as deleteSelectedLineUtil,
  deleteAllLines as deleteAllLinesUtil,
} from "./line/tools/lineDeleteTools";
import useLineKeyboardShortcuts from "./line/useLineKeyboardShortcuts";
import useLineChartEvents from "./line/useLineChartEvents";
import useLineDrag from "./line/useLineDrag";
import useLineResize from "./line/useLineResize";
import useLineCursor from "./line/useLineCursor";
import { useOptimizedLineSelection } from "./useOptimizedSelection";

// useLineDrawing integrates all hooks and logic for line drawing, selection, drag, resize, and keyboard shortcuts
export const useLineDrawing = (chart, candlestickSeries, candleData) => {
  // State and actions for lines (data, selection, hover)
  const {
    linesData,
    setLinesData,
    selectedLineId,
    setSelectedLineId,
    clearSelectedLineId,
    hoveredLineId,
    setHoveredLineId,
    clearHoveredLineId,
  } = useLineState();
  // Ref to always have the latest linesData
  const linesDataRef = useRef(linesData);
  linesDataRef.current = linesData;

  // Tool state (current tool, setter)
  const { currentTool, setCurrentTool } = useToolStore();
  const currentToolRef = useRef(currentTool);
  currentToolRef.current = currentTool;

  // Ref for tracking if a resize is in progress
  const isResizingRef = useRef(false);
  // Ref for which handle is being resized ("p1" or "p2")
  const activeResizeHandleRef = useRef(null);
  // Ref for drag/resize state to coordinate cursor behavior
  const dragOrResizeStateRef = useRef({ isActive: false, cursor: null });

  // Main drawing tool instance (manages primitives and drawing mode)
  const lineDrawingTool = useLineDrawingTool(
    chart,
    candlestickSeries,
    setCurrentTool,
    setLinesData,
    setSelectedLineId,
    currentTool,
    activeResizeHandleRef,
    candleData,
  );

  // Enable resizing of line endpoints
  useLineResize(
    chart,
    candlestickSeries,
    hoveredLineId,
    selectedLineId,
    linesDataRef,
    isResizingRef,
    setSelectedLineId,
    candleData,
    activeResizeHandleRef,
    dragOrResizeStateRef,
  );

  // Set mouse cursor style based on hover/drag state
  useLineCursor(
    chart,
    candlestickSeries,
    hoveredLineId,
    selectedLineId,
    linesDataRef,
    dragOrResizeStateRef,
    candleData,
  );

  // Use optimized selection management for lines
  const { updateSelection, resetSelection } =
    useOptimizedLineSelection(linesData);

  // Optimized selection management - only update affected drawings
  useEffect(() => {
    updateSelection(selectedLineId, hoveredLineId);
  }, [selectedLineId, hoveredLineId, updateSelection]);

  // Subscribe to chart click and crosshair move events for selection/hover
  useLineChartEvents(
    chart,
    candlestickSeries,
    currentToolRef,
    linesDataRef,
    setSelectedLineId,
    clearSelectedLineId,
    setHoveredLineId,
    clearHoveredLineId,
    lineDrawingTool,
    hoveredLineId,
  );

  // Enable drag-and-drop for lines
  useLineDrag(
    chart,
    candlestickSeries,
    hoveredLineId,
    selectedLineId,
    clearSelectedLineId,
    clearHoveredLineId,
    linesDataRef,
    isResizingRef,
    setSelectedLineId,
    dragOrResizeStateRef,
    candleData,
  );

  // Delete the currently selected line
  const deleteSelectedLine = useCallback(() => {
    deleteSelectedLineUtil(
      lineDrawingTool,
      linesDataRef,
      selectedLineId,
      clearSelectedLineId,
    );
  }, [selectedLineId, clearSelectedLineId, lineDrawingTool, linesDataRef]);

  // Keyboard shortcut for deleting selected line
  useLineKeyboardShortcuts(selectedLineId, deleteSelectedLine);

  // Delete all lines
  const deleteAllLines = useCallback(() => {
    deleteAllLinesUtil(lineDrawingTool);
    setSelectedLineId(null);
  }, [lineDrawingTool, setSelectedLineId]);

  // Ensure lines are aware of selection for label/rectangle visibility
  useEffect(() => {
    linesDataRef.current.forEach((line) => {
      if (line.setSelectedLineId) {
        line.setSelectedLineId(selectedLineId);
      }
    });
  }, [selectedLineId, linesDataRef]);

  // Propagate selectedLineId to the drawing tool for axis label visibility
  useEffect(() => {
    if (lineDrawingTool.current) {
      lineDrawingTool.current.setSelectedLineId(selectedLineId);
    }
  }, [selectedLineId, lineDrawingTool]);

  // Expose delete actions for use in UI
  return {
    deleteSelectedLine,
    deleteAllLines,
    lineDrawingTool,
    setLinesData,
    activeResizeHandleRef,
  };
};
