import { useEffect, useRef } from "react";
import { isPointNearLine } from "../../drawing-tools/line/helpers";
import { updateDrawingPosition } from "../../helpers/updateDrawingPosition.js";

// useLineDrag.js - React hook for enabling drag-and-drop of lines on the chart
function useLineDrag(
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
) {
  // Ref to track drag state (isDragging, which line, drag start positions)
  const lineDragState = useRef({
    isDragging: false,
    lineId: null,
    dragStart: null, // { mouse: {time, price}, line: {p1, p2} }
  });

  useEffect(() => {
    if (!chart) return;
    const container = chart.chartElement ? chart.chartElement() : null;
    if (!container) return;

    // Convert mouse event to logical chart coordinates
    const getMouseLogical = (event) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const timeScale = chart.timeScale();

      // Get logical coordinate (always available)
      const logicalIndex = timeScale.coordinateToLogical(x);

      // Try to get time using coordinateToTime first
      let time = timeScale.coordinateToTime(x);

      // If time is null (outside data range), calculate from logical coordinate
      if (time === null && candleData && candleData.length > 0) {
        time = logicalIndexToTime(logicalIndex, candleData);
      }

      const price = candlestickSeries.coordinateToPrice(y);

      // Return point with both time and logical coordinates
      return {
        time,
        price,
        logicalIndex: logicalIndex,
      };
    };

    // Helper to convert logical index to time
    const logicalIndexToTime = (logicalIndex, candleData) => {
      if (
        !candleData ||
        !Array.isArray(candleData) ||
        candleData.length === 0
      ) {
        return null;
      }

      // Handle positive indices (within data range)
      if (logicalIndex >= 0 && logicalIndex < candleData.length) {
        return candleData[Math.floor(logicalIndex)].time;
      }

      // Handle negative indices (before first candle)
      if (logicalIndex < 0 && candleData.length >= 2) {
        const interval = candleData[1].time - candleData[0].time;
        return candleData[0].time + logicalIndex * interval;
      }

      // Handle indices after last candle
      if (logicalIndex >= candleData.length && candleData.length >= 2) {
        const interval =
          candleData[candleData.length - 1].time -
          candleData[candleData.length - 2].time;
        const extraSteps = logicalIndex - (candleData.length - 1);
        return candleData[candleData.length - 1].time + extraSteps * interval;
      }

      return null;
    };

    // Handle mouse down: start dragging if mouse is near a line body
    const handleMouseDown = (e) => {
      if (!chart || (isResizingRef && isResizingRef.current)) return;

      const mouse = getMouseLogical(e);
      if (!mouse.price || (mouse.logicalIndex === null && !mouse.time)) return;

      let dragLine = null;
      let startedDragOnLine = false;

      // Prefer hovered line, else selected line
      const targetLineId = hoveredLineId || selectedLineId;
      if (targetLineId) {
        dragLine = linesDataRef.current.find((l) => l.id === targetLineId);
        if (dragLine) {
          const { near, onPoint } = isPointNearLine(
            mouse,
            dragLine,
            chart,
            candlestickSeries,
          );
          // Only start drag if mouse is near the line body (not endpoints)
          if (near && onPoint === null) {
            lineDragState.current = {
              isDragging: true,
              lineId: dragLine.id,
              dragStart: {
                mouse,
                line: { p1: { ...dragLine._p1 }, p2: { ...dragLine._p2 } },
              },
            };
            // Disable chart scroll/scale while dragging
            chart.applyOptions({ handleScroll: false, handleScale: false });

            // Set dragOrResizeStateRef for cursor feedback
            if (dragOrResizeStateRef) {
              dragOrResizeStateRef.current = {
                isActive: true,
                cursor: "grabbing",
              };
            }

            startedDragOnLine = true;
          }
        }
      }

      if (startedDragOnLine) {
        setSelectedLineId(dragLine.id);
      } else {
        clearSelectedLineId();
        clearHoveredLineId();
      }
    };

    // Handle mouse move: update line position if dragging
    const handleMouseMove = (e) => {
      if (!lineDragState.current.isDragging) return;

      const dragLine = linesDataRef.current.find(
        (l) => l.id === lineDragState.current.lineId,
      );
      if (!dragLine) return;

      const mouse = getMouseLogical(e);
      if (!mouse.price || (mouse.logicalIndex === null && !mouse.time)) return;

      const { mouse: startMouse, line: startLine } =
        lineDragState.current.dragStart;

      const deltaTime = mouse.time - startMouse.time;
      const deltaPrice = mouse.price - startMouse.price;

      // Update both time and logical coordinates if available
      dragLine._p1 = {
        time: startLine.p1.time + deltaTime,
        price: startLine.p1.price + deltaPrice,
      };
      dragLine._p2 = {
        time: startLine.p2.time + deltaTime,
        price: startLine.p2.price + deltaPrice,
      };

      // Update logical indices if available
      if (
        mouse.logicalIndex !== undefined &&
        startMouse.logicalIndex !== undefined
      ) {
        const deltaLogicalIndex = mouse.logicalIndex - startMouse.logicalIndex;
        if (startLine.p1.logicalIndex !== undefined) {
          dragLine._p1.logicalIndex =
            startLine.p1.logicalIndex + deltaLogicalIndex;
        }
        if (startLine.p2.logicalIndex !== undefined) {
          dragLine._p2.logicalIndex =
            startLine.p2.logicalIndex + deltaLogicalIndex;
        }
      }

      dragLine.updateAllViews();
      dragLine.applyOptions({}); // Force redraw
    };

    // Handle mouse up: finish dragging and re-enable chart scroll/scale
    const handleMouseUp = () => {
      if (lineDragState.current.isDragging) {
        const draggedLineId = lineDragState.current.lineId;

        // Update store with new line position
        const draggedLine = linesDataRef.current.find(
          (l) => l.id === draggedLineId,
        );
        if (draggedLine) {
          updateDrawingPosition(draggedLine.id, draggedLine, "line");
        }

        lineDragState.current = {
          isDragging: false,
          lineId: null,
          dragStart: null,
        };
        chart.applyOptions({ handleScroll: true, handleScale: true });

        // Reset dragOrResizeStateRef
        if (dragOrResizeStateRef) {
          dragOrResizeStateRef.current = { isActive: false, cursor: null };
        }
      }
    };

    // Subscribe to mouse events
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    chart,
    candlestickSeries,
    hoveredLineId,
    selectedLineId,
    linesDataRef,
    isResizingRef,
    setSelectedLineId,
    clearSelectedLineId,
    clearHoveredLineId,
    dragOrResizeStateRef,
    candleData,
  ]);
}

export default useLineDrag;
