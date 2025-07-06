// useFibRetracementDrag.js - React hook for enabling drag-and-drop of fib retracements on the chart
import { useEffect, useRef } from "react";
import {
  enhancePointWithLogicalIndex,
  logicalIndexToTime,
} from "../../helpers/coordinateUtils.js";
import { updateDrawingPosition } from "../../helpers/updateDrawingPosition.js";

/**
 * useFibRetracementDrag
 *
 * Enables drag-and-drop for fib retracements:
 * - Mouse down on a retracement (not on a handle) starts drag.
 * - Mouse move updates both endpoints by the mouse delta with hybrid coordinate support.
 * - Mouse up ends drag and re-enables chart scroll/scale.
 * - Updates dragOrResizeStateRef for cursor feedback.
 * - Prevents drag if resizing or on a handle.
 * - Maintains logical coordinates during drag operations.
 *
 * @param {object} chart - Chart instance
 * @param {object} candlestickSeries - Candlestick series instance
 * @param {string|null} hoveredFibRetracementId - ID of hovered retracement
 * @param {string|null} selectedFibRetracementId - ID of selected retracement
 * @param {function} clearSelectedFibRetracementId - Clears selection
 * @param {function} clearHoveredFibRetracementId - Clears hover
 * @param {object} retracementsDataRef - Ref to array of all retracement data
 * @param {function} setSelectedFibRetracementId - Sets selection
 * @param {object} dragOrResizeStateRef - Ref with { isActive, cursor } for drag/resize override
 * @param {Array} candleData - Array of candle data for hybrid coordinates
 */
function useFibRetracementDrag(
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
) {
  // Internal drag state
  const dragState = useRef({
    isDragging: false,
    fibId: null,
    dragStart: null, // { mouse: {time, price}, fib: {p1, p2} }
  });

  useEffect(() => {
    if (!chart) return;
    const container = chart.chartElement ? chart.chartElement() : null;
    if (!container) return;

    // Convert mouse event to logical chart coordinates (time, price) with hybrid support
    const getMouseLogical = (event) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      let time = chart.timeScale().coordinateToTime(x);
      let price = candlestickSeries.coordinateToPrice(y);

      // Handle coordinates outside candle range
      if (!time && candleData && candleData.length > 0) {
        const logicalIndex = chart.timeScale().coordinateToLogical(x);
        if (logicalIndex !== null) {
          time = logicalIndexToTime(logicalIndex, candleData);
        }
      }

      return time && price !== null ? { time, price } : null;
    };

    // Mouse down: start dragging if mouse is on a retracement (not on a handle)
    const handleMouseDown = (e) => {
      if (!chart) return;
      const mouse = getMouseLogical(e);
      if (!mouse) return;

      let dragFib = null;
      let startedDrag = false;
      if (hoveredFibRetracementId) {
        dragFib = retracementsDataRef.current.find(
          (f) => f.id === hoveredFibRetracementId,
        );
        // Block drag if mouse is on a handle
        if (
          dragFib &&
          dragFib.getHandleAtPoint(mouse, chart, candlestickSeries)
        )
          return;
        // Start drag if hovered and mouse is inside retracement
        if (dragFib && dragFib.isHoveredLogical(mouse)) {
          dragState.current = {
            isDragging: true,
            fibId: dragFib.id,
            dragStart: {
              mouse,
              fib: { p1: { ...dragFib._p1 }, p2: { ...dragFib._p2 } },
            },
          };
          chart.applyOptions({ handleScroll: false, handleScale: false });
          if (dragOrResizeStateRef)
            dragOrResizeStateRef.current = {
              isActive: true,
              cursor: "grabbing",
            };
          startedDrag = true;
        }
      } else if (selectedFibRetracementId) {
        dragFib = retracementsDataRef.current.find(
          (f) => f.id === selectedFibRetracementId,
        );
        // Start drag if selected and mouse is inside retracement
        if (dragFib && dragFib.isPointInsideRetracement(mouse)) {
          dragState.current = {
            isDragging: true,
            fibId: dragFib.id,
            dragStart: {
              mouse,
              fib: { p1: { ...dragFib._p1 }, p2: { ...dragFib._p2 } },
            },
          };
          chart.applyOptions({ handleScroll: false, handleScale: false });
          if (dragOrResizeStateRef)
            dragOrResizeStateRef.current = {
              isActive: true,
              cursor: "grabbing",
            };
          startedDrag = true;
        }
      }
      // Set selection if drag started
      if (startedDrag) {
        if (setSelectedFibRetracementId)
          setSelectedFibRetracementId(dragFib.id);
      }
      // If not dragging, clear selection/hover
      if (!startedDrag) {
        clearSelectedFibRetracementId();
        clearHoveredFibRetracementId();
      }
    };

    // Mouse move: update retracement position if dragging with hybrid coordinate support
    const handleMouseMove = (e) => {
      if (!dragState.current.isDragging) return;
      const dragFib = retracementsDataRef.current.find(
        (f) => f.id === dragState.current.fibId,
      );
      if (!dragFib) return;

      const mouse = getMouseLogical(e);
      if (!mouse) return;

      const { mouse: startMouse, fib: startFib } = dragState.current.dragStart;
      const deltaTime = mouse.time - startMouse.time;
      const deltaPrice = mouse.price - startMouse.price;

      // Move both endpoints by the mouse delta and enhance with logical coordinates
      const newP1 = {
        time: startFib.p1.time + deltaTime,
        price: startFib.p1.price + deltaPrice,
      };
      const newP2 = {
        time: startFib.p2.time + deltaTime,
        price: startFib.p2.price + deltaPrice,
      };

      // Enhance points with logical coordinates for hybrid positioning
      dragFib._p1 = enhancePointWithLogicalIndex(newP1, candleData);
      dragFib._p2 = enhancePointWithLogicalIndex(newP2, candleData);

      dragFib.updateAllViews && dragFib.updateAllViews();
      dragFib.applyOptions && dragFib.applyOptions({});
      if (dragFib.requestUpdate) dragFib.requestUpdate();
    };

    // Mouse up: finish dragging and re-enable chart scroll/scale
    const handleMouseUp = () => {
      if (dragState.current.isDragging) {
        const draggedFibId = dragState.current.fibId;

        // Update store with new fib retracement position
        const draggedFib = retracementsDataRef.current.find(
          (f) => f.id === draggedFibId,
        );
        if (draggedFib) {
          updateDrawingPosition(draggedFib.id, draggedFib, "fib_retracement");
        }

        dragState.current = {
          isDragging: false,
          fibId: null,
          dragStart: null,
        };
        chart.applyOptions({ handleScroll: true, handleScale: true });
        if (dragOrResizeStateRef)
          dragOrResizeStateRef.current = { isActive: false, cursor: null };
      }
    };

    // Attach event listeners
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    // Cleanup listeners on unmount or dependency change
    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
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
  ]);
}

export default useFibRetracementDrag;
