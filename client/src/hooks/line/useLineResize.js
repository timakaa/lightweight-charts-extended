import { useEffect, useRef } from "react";
import { isPointNearLine } from "../../drawing-tools/line/helpers";
import { getSnappedPrice } from "../../drawing-tools/helpers";
import { enhancePointWithLogicalIndex } from "../../helpers/coordinateUtils.js";
import { updateDrawingPosition } from "../../helpers/updateDrawingPosition.js";

// useLineResize.js - React hook for enabling resizing of line endpoints on the chart
function useLineResize(
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
) {
  // Ref to track resize state (isResizing, which line, which endpoint)
  const lineResizeState = useRef({
    isResizing: false,
    lineId: null,
    pointIndex: null, // 0 for p1, 1 for p2
    initialMouse: null, // { x, y } screen coordinates
    handleHidden: false, // whether handles have been hidden due to movement
  });

  // Ref to track key state (snapping, constraint)
  const keyStateRef = useRef({
    isSnapping: false,
    isConstrained: false,
  });

  // Ref to store the last mouse event for reprocessing on key changes
  const lastMouseEventRef = useRef(null);

  useEffect(() => {
    if (!chart) return;
    const container = chart.chartElement();
    if (!container) return;

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

    // Handle key down: update snapping/constraint state and reprocess mouse move
    const handleKeyDown = (e) => {
      const wasSnapping = keyStateRef.current.isSnapping;
      const wasConstrained = keyStateRef.current.isConstrained;
      if (e.key === "Control" || e.key === "Meta") {
        keyStateRef.current.isSnapping = true;
      }
      if (e.key === "Shift") {
        keyStateRef.current.isConstrained = true;
      }
      const stateChanged =
        keyStateRef.current.isSnapping !== wasSnapping ||
        keyStateRef.current.isConstrained !== wasConstrained;
      if (lineResizeState.current.isResizing && stateChanged) {
        handleMouseMove(lastMouseEventRef.current);
      }
    };

    // Handle key up: update snapping/constraint state and reprocess mouse move
    const handleKeyUp = (e) => {
      const wasSnapping = keyStateRef.current.isSnapping;
      const wasConstrained = keyStateRef.current.isConstrained;
      if (e.key === "Control" || e.key === "Meta") {
        keyStateRef.current.isSnapping = false;
      }
      if (e.key === "Shift") {
        keyStateRef.current.isConstrained = false;
      }
      const stateChanged =
        keyStateRef.current.isSnapping !== wasSnapping ||
        keyStateRef.current.isConstrained !== wasConstrained;
      if (lineResizeState.current.isResizing && stateChanged) {
        handleMouseMove(lastMouseEventRef.current);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

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

    // Handle mouse down: start resizing if mouse is near a line endpoint
    const handleMouseDown = (e) => {
      const mouse = getMouseLogical(e);
      if (!mouse.price || (mouse.logicalIndex === null && !mouse.time)) return;

      // Only check hovered or selected line, not all lines
      const targetId = hoveredLineId || selectedLineId;
      if (!targetId) return;

      const targetLine = linesDataRef.current.find((l) => l.id === targetId);
      if (!targetLine) return;

      const { near, onPoint } = isPointNearLine(
        mouse,
        targetLine,
        chart,
        candlestickSeries,
      );

      if (near && onPoint !== null) {
        if (setSelectedLineId) setSelectedLineId(targetLine.id); // Select immediately

        const rect = container.getBoundingClientRect();
        const initialMouseScreen = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        lineResizeState.current = {
          isResizing: true,
          lineId: targetLine.id,
          pointIndex: onPoint,
          initialMouse: initialMouseScreen,
          handleHidden: false,
        };
        isResizingRef.current = true;
        chart.applyOptions({ handleScroll: false, handleScale: false });

        // Set dragOrResizeStateRef for cursor feedback
        if (dragOrResizeStateRef) {
          dragOrResizeStateRef.current = {
            isActive: true,
            cursor: "nwse-resize",
          };
        }

        // Don't set activeResizeHandleRef immediately - wait for movement
        e.stopPropagation();
        e.preventDefault();
      }
    };

    // Handle mouse move: update endpoint position if resizing
    const handleMouseMove = (e) => {
      if (!e) return;
      lastMouseEventRef.current = e;
      if (!lineResizeState.current.isResizing) return;

      const resizeLine = linesDataRef.current.find(
        (l) => l.id === lineResizeState.current.lineId,
      );
      if (!resizeLine) return;

      const mouse = getMouseLogical(e);
      if (!mouse.price || (mouse.logicalIndex === null && !mouse.time)) return;

      // Check if we should hide handles based on movement threshold
      if (
        !lineResizeState.current.handleHidden &&
        lineResizeState.current.initialMouse
      ) {
        const rect = container.getBoundingClientRect();
        const currentMouseScreen = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        const dx =
          currentMouseScreen.x - lineResizeState.current.initialMouse.x;
        const dy =
          currentMouseScreen.y - lineResizeState.current.initialMouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 3) {
          // threshold in pixels
          // Now hide handles and set active handle
          if (activeResizeHandleRef) {
            activeResizeHandleRef.current =
              lineResizeState.current.pointIndex === 0 ? "p1" : "p2";
          }
          lineResizeState.current.handleHidden = true;
        }
      }

      let finalPrice = mouse.price;

      // If snapping, snap to candle price (only if we have valid time)
      if (keyStateRef.current.isSnapping && mouse.time) {
        const candle = candleData.find((c) => c.time === mouse.time);
        if (candle) {
          finalPrice = getSnappedPrice(mouse.price, candle);
        }
      }

      const { pointIndex } = lineResizeState.current;
      // If constrained, lock price to the other endpoint
      if (keyStateRef.current.isConstrained) {
        const otherPointIndex = 1 - pointIndex;
        const otherPoint =
          otherPointIndex === 0 ? resizeLine._p1 : resizeLine._p2;
        finalPrice = otherPoint.price;
      }

      // Create new point with both time and logical coordinates
      const newPoint = {
        time: mouse.time,
        price: finalPrice,
        logicalIndex: mouse.logicalIndex,
      };

      // Update the appropriate endpoint and enhance with logical indices
      if (pointIndex === 0) {
        resizeLine._p1 = enhancePointWithLogicalIndex(newPoint, candleData);
        if (activeResizeHandleRef) activeResizeHandleRef.current = "p1";
      } else if (pointIndex === 1) {
        resizeLine._p2 = enhancePointWithLogicalIndex(newPoint, candleData);
        if (activeResizeHandleRef) activeResizeHandleRef.current = "p2";
      }

      resizeLine.updateAllViews();
      resizeLine.applyOptions({}); // Force redraw
    };

    // Handle mouse up: finish resizing and re-enable chart scroll/scale
    const handleMouseUp = () => {
      if (lineResizeState.current.isResizing) {
        const lineId = lineResizeState.current.lineId;

        // Update store with new line position
        const resizedLine = linesDataRef.current.find((l) => l.id === lineId);
        if (resizedLine) {
          updateDrawingPosition(resizedLine.id, resizedLine, "line");
        }

        lineResizeState.current = {
          isResizing: false,
          lineId: null,
          pointIndex: null,
          initialMouse: null,
          handleHidden: false,
        };
        isResizingRef.current = false;
        chart.applyOptions({ handleScroll: true, handleScale: true });
        lastMouseEventRef.current = null;
        if (activeResizeHandleRef) activeResizeHandleRef.current = null;
        if (dragOrResizeStateRef) {
          dragOrResizeStateRef.current = { isActive: false, cursor: null };
        }
        if (lineId && setSelectedLineId) setSelectedLineId(lineId);
      }
    };

    // Subscribe to mouse and keyboard events
    container.addEventListener("mousedown", handleMouseDown, true); // Use capture phase for priority
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      container.removeEventListener("mousedown", handleMouseDown, true); // Match capture flag
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [
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
  ]);
}

export default useLineResize;
