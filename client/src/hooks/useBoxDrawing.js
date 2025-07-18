// useBoxDrawing.js
//
// This custom React hook manages the drawing, selection, hovering, and dragging of rectangle (box) shapes on a trading chart.
// It integrates with the chart and candlestick series, and coordinates user interactions (mouse, keyboard) with the box drawing tool.
// The hook exposes the current boxes data and provides functions to delete selected or all boxes.

import React, { useRef, useCallback, useEffect } from "react";
import { useToolStore, TOOL_BOX, TOOL_CROSSHAIR } from "../store/tool";
import useBoxState from "./rectangle/useBoxState";
import useBoxDrag from "./rectangle/useBoxDrag";
import useRectangleDrawingTool from "./rectangle/useRectangleDrawingTool";
import useBoxChartEvents from "./rectangle/useBoxChartEvents";
import useBoxKeyboardShortcuts from "./rectangle/useBoxKeyboardShortcuts";
import {
  deleteSelectedBox as deleteSelectedBoxUtil,
  deleteAllBoxes as deleteAllBoxesUtil,
} from "./rectangle/tools/boxDeleteTools";
import useBoxResize from "./rectangle/useBoxResize";
import useBoxCursor from "./rectangle/useBoxCursor";
import { useOptimizedBoxSelection } from "./useOptimizedSelection";

export const useBoxDrawing = (chart, candlestickSeries, candleData) => {
  // Use the new box state management hook
  const {
    boxesData,
    setBoxesData,
    selectedBoxId,
    setSelectedBoxId,
    clearSelectedBoxId,
    hoveredBoxId,
    setHoveredBoxId,
    clearHoveredBoxId,
  } = useBoxState();
  // Ref to always have the latest boxesData in event handlers
  const boxesDataRef = useRef(boxesData);
  boxesDataRef.current = boxesData;

  // Tool selection state (box tool, crosshair, etc.)
  const { currentTool, setCurrentTool } = useToolStore();
  const currentToolRef = useRef(currentTool);
  currentToolRef.current = currentTool;

  // Ref to coordinate between resize and drag logic
  const isResizingRef = useRef(false);
  const activeResizeHandleRef = useRef(null);
  const dragOrResizeStateRef = useRef({ isActive: false, cursor: null });

  // Use the new RectangleDrawingTool logic
  const rectangleDrawingTool = useRectangleDrawingTool(
    chart,
    candlestickSeries,
    setCurrentTool,
    setBoxesData,
    setSelectedBoxId,
    currentTool,
    activeResizeHandleRef,
    dragOrResizeStateRef,
    candleData,
  );

  // Ensure rectangles are aware of selection for label/rectangle visibility
  React.useEffect(() => {
    if (rectangleDrawingTool.current) {
      rectangleDrawingTool.current.setSelectedBoxId(selectedBoxId);
    }
  }, [selectedBoxId, rectangleDrawingTool]);

  // Use optimized selection management for boxes
  const { updateSelection, resetSelection } =
    useOptimizedBoxSelection(boxesData);

  // Optimized selection management - only update affected drawings
  useEffect(() => {
    updateSelection(selectedBoxId, hoveredBoxId);
  }, [selectedBoxId, hoveredBoxId, updateSelection]);

  // Use the new resize logic
  useBoxResize(
    chart,
    candlestickSeries,
    hoveredBoxId,
    selectedBoxId,
    boxesDataRef,
    isResizingRef,
    setSelectedBoxId,
    candleData,
    activeResizeHandleRef,
    dragOrResizeStateRef,
  );

  // Use the new drag logic
  useBoxDrag(
    chart,
    candlestickSeries,
    hoveredBoxId,
    selectedBoxId,
    clearSelectedBoxId,
    clearHoveredBoxId,
    boxesDataRef,
    isResizingRef,
    setSelectedBoxId,
    dragOrResizeStateRef,
    candleData,
  );

  // Use the new cursor logic for handles, pointer inside hovered/selected box
  useBoxCursor(
    chart,
    candlestickSeries,
    hoveredBoxId,
    boxesDataRef,
    selectedBoxId,
    dragOrResizeStateRef,
    candleData,
  );

  // Use the new chart event logic
  useBoxChartEvents(
    chart,
    candlestickSeries,
    currentToolRef,
    boxesDataRef,
    setSelectedBoxId,
    clearSelectedBoxId,
    setHoveredBoxId,
    clearHoveredBoxId,
    rectangleDrawingTool,
    hoveredBoxId,
    candleData,
  );

  // Delete the currently selected box (if any)
  const deleteSelectedBox = useCallback(() => {
    deleteSelectedBoxUtil(
      rectangleDrawingTool,
      boxesDataRef,
      selectedBoxId,
      clearSelectedBoxId,
    );
  }, [selectedBoxId, clearSelectedBoxId, rectangleDrawingTool, boxesDataRef]);

  // Use the new keyboard shortcut logic
  useBoxKeyboardShortcuts(selectedBoxId, deleteSelectedBox);

  // Delete all boxes from the chart
  const deleteAllBoxes = useCallback(() => {
    deleteAllBoxesUtil(rectangleDrawingTool);
    setSelectedBoxId(null);
  }, [rectangleDrawingTool, setSelectedBoxId]);

  // Expose boxes data and box deletion functions to consumers of the hook
  return {
    boxesData,
    deleteSelectedBox,
    deleteAllBoxes,
    rectangleDrawingTool,
    setBoxesData,
    activeResizeHandleRef,
  };
};
