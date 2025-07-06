// useBoxDrag.js - React hook for enabling drag-and-drop of rectangles (boxes) on the chart
import { useEffect, useRef } from "react";
import {
  isPointNearRectangleBorder,
  isPointNearRectangleCorner,
  isPointNearRectangleMidpoint,
} from "../../drawing-tools/rectangle/helpers";
import { getXCoordinate } from "../../helpers/coordinateUtils";
import { updateDrawingPosition } from "../../helpers/updateDrawingPosition.js";

// Handles drag state, mouse events, and box position updates with hybrid coordinate support
function useBoxDrag(
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
) {
  const boxDragState = useRef({
    isDragging: false,
    boxId: null,
    dragStart: null, // { mouse: {time, price}, box: {p1, p2} }
  });

  useEffect(() => {
    if (!chart) return;
    const container = chart.chartElement ? chart.chartElement() : null;
    if (!container) return;

    // Helper to convert mouse event to logical coordinates with hybrid support
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

    // Helper to check if point is inside rectangle using hybrid coordinates
    const isPointInsideBox = (point, box) => {
      const { price } = point;
      if (!price) return false;

      // Convert to screen coordinates for accurate calculation
      const timeScale = chart.timeScale();
      const candleData = box._candleData;

      const pointX = getXCoordinate(point, timeScale, candleData);
      const p1X = getXCoordinate(box._p1, timeScale, candleData);
      const p2X = getXCoordinate(box._p2, timeScale, candleData);

      if (pointX === null || p1X === null || p2X === null) {
        return false;
      }

      const pointY = candlestickSeries.priceToCoordinate(price);
      const p1Y = candlestickSeries.priceToCoordinate(box._p1.price);
      const p2Y = candlestickSeries.priceToCoordinate(box._p2.price);

      const minX = Math.min(p1X, p2X);
      const maxX = Math.max(p1X, p2X);
      const minY = Math.min(p1Y, p2Y);
      const maxY = Math.max(p1Y, p2Y);

      return (
        pointX >= minX && pointX <= maxX && pointY >= minY && pointY <= maxY
      );
    };

    // Mouse down: start dragging if mouse is near a box border or inside selected box
    const handleMouseDown = (e) => {
      if (!chart) return;
      if (isResizingRef && isResizingRef.current) return;
      const mouse = getMouseLogical(e);
      let dragBox = null;
      let startedDragOnBox = false;

      const targetId = hoveredBoxId || selectedBoxId;
      if (targetId) {
        dragBox = boxesDataRef.current.find((b) => b.id === targetId);

        // Check if mouse is on a handle first - if so, don't start dragging
        if (dragBox) {
          const corner = isPointNearRectangleCorner(
            mouse,
            dragBox,
            chart,
            candlestickSeries,
          );
          const midpoint = isPointNearRectangleMidpoint(
            mouse,
            dragBox,
            chart,
            candlestickSeries,
          );

          // If mouse is on a handle, don't start dragging - let resize handle it
          if (corner || midpoint) {
            return;
          }
        }
      }

      if (hoveredBoxId) {
        dragBox = boxesDataRef.current.find((b) => b.id === hoveredBoxId);
        if (
          dragBox &&
          isPointNearRectangleBorder(mouse, dragBox, chart, candlestickSeries)
        ) {
          boxDragState.current = {
            isDragging: true,
            boxId: dragBox.id,
            dragStart: {
              mouse,
              box: { p1: { ...dragBox._p1 }, p2: { ...dragBox._p2 } },
            },
          };
          chart.applyOptions({ handleScroll: false, handleScale: false });
          startedDragOnBox = true;
          if (dragOrResizeStateRef) {
            dragOrResizeStateRef.current = {
              isActive: true,
              cursor: "grabbing",
            };
          }
        }
      } else if (selectedBoxId) {
        dragBox = boxesDataRef.current.find((b) => b.id === selectedBoxId);
        if (dragBox && isPointInsideBox(mouse, dragBox)) {
          boxDragState.current = {
            isDragging: true,
            boxId: dragBox.id,
            dragStart: {
              mouse,
              box: { p1: { ...dragBox._p1 }, p2: { ...dragBox._p2 } },
            },
          };
          chart.applyOptions({ handleScroll: false, handleScale: false });
          startedDragOnBox = true;
          if (dragOrResizeStateRef) {
            dragOrResizeStateRef.current = {
              isActive: true,
              cursor: "grabbing",
            };
          }
        }
      }
      if (startedDragOnBox) {
        if (setSelectedBoxId) setSelectedBoxId(dragBox.id);
      }
      if (!startedDragOnBox) {
        clearSelectedBoxId();
        clearHoveredBoxId();
      }
    };

    // Mouse move: update box position if dragging
    const handleMouseMove = (e) => {
      if (!boxDragState.current.isDragging) return;
      const dragBox = boxesDataRef.current.find(
        (b) => b.id === boxDragState.current.boxId,
      );
      if (!dragBox) return;
      const mouse = getMouseLogical(e);
      const { mouse: startMouse, box: startBox } =
        boxDragState.current.dragStart;
      const deltaTime = mouse.time - startMouse.time;
      const deltaPrice = mouse.price - startMouse.price;

      // Update both time and logical coordinates if available
      dragBox._p1 = {
        time: startBox.p1.time + deltaTime,
        price: startBox.p1.price + deltaPrice,
      };
      dragBox._p2 = {
        time: startBox.p2.time + deltaTime,
        price: startBox.p2.price + deltaPrice,
      };

      // Update logical indices if available
      if (
        mouse.logicalIndex !== undefined &&
        startMouse.logicalIndex !== undefined
      ) {
        const deltaLogicalIndex = mouse.logicalIndex - startMouse.logicalIndex;
        if (startBox.p1.logicalIndex !== undefined) {
          dragBox._p1.logicalIndex =
            startBox.p1.logicalIndex + deltaLogicalIndex;
        }
        if (startBox.p2.logicalIndex !== undefined) {
          dragBox._p2.logicalIndex =
            startBox.p2.logicalIndex + deltaLogicalIndex;
        }
      }

      dragBox.updateAllViews && dragBox.updateAllViews();
      dragBox.applyOptions && dragBox.applyOptions({});
      if (dragBox.requestUpdate) dragBox.requestUpdate();
    };

    // Mouse up: finish dragging and re-enable chart scroll/scale
    const handleMouseUp = () => {
      if (boxDragState.current.isDragging) {
        const draggedBoxId = boxDragState.current.boxId;

        // Update store with new rectangle position
        const draggedBox = boxesDataRef.current.find(
          (b) => b.id === draggedBoxId,
        );
        if (draggedBox) {
          updateDrawingPosition(draggedBox.id, draggedBox, "rectangle");
        }

        boxDragState.current = {
          isDragging: false,
          boxId: null,
          dragStart: null,
        };
        chart.applyOptions({ handleScroll: true, handleScale: true });
        if (dragOrResizeStateRef) {
          dragOrResizeStateRef.current = { isActive: false, cursor: null };
        }
      }
    };

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
    hoveredBoxId,
    selectedBoxId,
    clearSelectedBoxId,
    clearHoveredBoxId,
    boxesDataRef,
    isResizingRef,
    setSelectedBoxId,
    dragOrResizeStateRef,
    candleData,
  ]);
}

export default useBoxDrag;
