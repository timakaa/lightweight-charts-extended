// useFibRetracementResize.js - React hook for enabling resize of fib retracements by dragging handles
import { useEffect, useRef } from "react";
import { getSnappedPrice } from "../../drawing-tools/helpers";
import {
  enhancePointWithLogicalIndex,
  logicalIndexToTime,
} from "../../helpers/coordinateUtils.js";
import { updateDrawingPosition } from "../../helpers/updateDrawingPosition.js";

/**
 * useFibRetracementResize
 *
 * Enables resizing of fib retracements by dragging handles:
 * - Mouse down on a handle starts resize with hybrid coordinate support.
 * - Mouse move updates the corresponding endpoint with logical coordinates.
 * - Mouse up ends resize and re-enables chart scroll/scale.
 * - Supports magnet snapping to candle OHLC with Ctrl/Meta.
 * - Updates dragOrResizeStateRef for cursor feedback.
 * - Maintains coordinate stability outside candle range.
 *
 * @param {object} chart - Chart instance
 * @param {object} candlestickSeries - Candlestick series instance
 * @param {string|null} hoveredFibRetracementId - ID of hovered retracement
 * @param {object} retracementsDataRef - Ref to array of all retracement data
 * @param {function} setSelectedFibRetracementId - Sets selection
 * @param {array} candleData - Array of candle data for snapping and hybrid coordinates
 * @param {object} dragOrResizeStateRef - Ref with { isActive, cursor } for drag/resize override
 */
function useFibRetracementResize(
  chart,
  candlestickSeries,
  hoveredFibRetracementId,
  retracementsDataRef,
  setSelectedFibRetracementId,
  candleData,
  dragOrResizeStateRef,
  activeResizeHandleRef,
) {
  // Internal resize state
  const resizeState = useRef({
    isResizing: false,
    fibId: null,
    handle: null, // 'p1' or 'p2'
    startMouse: null,
    startFib: null, // { p1, p2 }
    handleHidden: false, // whether handles have been hidden due to movement
  });

  // Key state for magnet snapping
  const keyStateRef = useRef({
    isMagnet: false,
  });
  const lastMouseEventRef = useRef(null);

  useEffect(() => {
    if (!chart) return;
    const container = chart.chartElement ? chart.chartElement() : null;
    if (!container) return;

    // Convert mouse event to logical chart coordinates with hybrid coordinate support
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

      return { time, price, x, y };
    };

    // Mouse down: start resizing if mouse is on a handle
    const handleMouseDown = (e) => {
      if (!chart) return;
      if (!hoveredFibRetracementId) return;
      const mouse = getMouseLogical(e);
      const fib = retracementsDataRef.current.find(
        (f) => f.id === hoveredFibRetracementId,
      );
      if (!fib) return;
      const handle = fib.getHandleAtPoint(mouse, chart, candlestickSeries);
      if (handle !== "p1" && handle !== "p2") return; // Only start resize if exactly on a handle
      resizeState.current = {
        isResizing: true,
        fibId: fib.id,
        handle,
        startMouse: mouse,
        startFib: { p1: { ...fib._p1 }, p2: { ...fib._p2 } },
        handleHidden: false,
      };
      if (setSelectedFibRetracementId) setSelectedFibRetracementId(fib.id);
      if (dragOrResizeStateRef)
        dragOrResizeStateRef.current = {
          isActive: true,
          cursor: "nwse-resize",
        };
      chart.applyOptions({ handleScroll: false, handleScale: false });
      e.stopPropagation();
      e.preventDefault();
    };

    // Mouse move: update endpoint if resizing
    const handleMouseMove = (e) => {
      if (!resizeState.current.isResizing) return;
      if (e) lastMouseEventRef.current = e;
      const fib = retracementsDataRef.current.find(
        (f) => f.id === resizeState.current.fibId,
      );
      if (!fib) return;
      const mouse = getMouseLogical(e || lastMouseEventRef.current);
      const { handle } = resizeState.current;

      // Check if we should hide handles based on movement threshold
      if (
        !resizeState.current.handleHidden &&
        resizeState.current.startMouse &&
        e
      ) {
        const dx = mouse.x - resizeState.current.startMouse.x;
        const dy = mouse.y - resizeState.current.startMouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 3) {
          // threshold in pixels
          // Now hide handles and set active handle
          if (activeResizeHandleRef) {
            activeResizeHandleRef.current = handle; // handle is already 'p1' or 'p2'
          }
          // Also set the handle on the fib retracement instance
          if (fib.setActiveResizeHandle) {
            fib.setActiveResizeHandle(activeResizeHandleRef);
          }
          resizeState.current.handleHidden = true;
        }
      }

      // Use keyStateRef for magnet logic
      const isMagnet = keyStateRef.current.isMagnet;

      let snappedTime = mouse.time;
      let snappedPrice = mouse.price;

      // Apply snapping logic when magnet is active
      if (isMagnet && chart && mouse.x !== undefined) {
        const x = mouse.x;
        const y = mouse.y;
        const mouseTime = chart.timeScale().coordinateToTime(x);
        const mousePrice = candlestickSeries.coordinateToPrice(y);

        // Find the closest candle in your series data
        const data = candleData || [];
        let closestCandle = null;
        let minDiff = Infinity;
        for (const candle of data) {
          const diff = Math.abs(candle.time - mouseTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestCandle = candle;
          }
        }
        if (closestCandle) {
          snappedTime = closestCandle.time;
          snappedPrice = getSnappedPrice(mousePrice, closestCandle);
        }
      }

      // Update the correct endpoint with hybrid coordinate support
      if (handle === "p1") {
        const newPoint = {
          time: snappedTime,
          price: snappedPrice,
        };
        fib._p1 = enhancePointWithLogicalIndex(newPoint, candleData);
      } else if (handle === "p2") {
        const newPoint = {
          time: snappedTime,
          price: snappedPrice,
        };
        fib._p2 = enhancePointWithLogicalIndex(newPoint, candleData);
      }
      fib.updateAllViews && fib.updateAllViews();
      fib.applyOptions && fib.applyOptions({});
      if (fib.requestUpdate) fib.requestUpdate();
    };

    // Mouse up: finish resizing
    const handleMouseUp = () => {
      if (resizeState.current.isResizing) {
        const resizedFibId = resizeState.current.fibId;

        // Update store with new fib retracement position
        const resizedFib = retracementsDataRef.current.find(
          (f) => f.id === resizedFibId,
        );
        if (resizedFib) {
          updateDrawingPosition(resizedFib.id, resizedFib, "fib_retracement");
        }

        // Clear active resize handle
        if (activeResizeHandleRef) {
          activeResizeHandleRef.current = null;
        }

        resizeState.current = {
          isResizing: false,
          fibId: null,
          handle: null,
          startMouse: null,
          startFib: null,
          handleHidden: false,
        };
        if (dragOrResizeStateRef)
          dragOrResizeStateRef.current = { isActive: false, cursor: null };
        chart.applyOptions({ handleScroll: true, handleScale: true });
      }
    };

    // Keydown/keyup listeners for instant snapping (magnet)
    const handleKeyDown = (e) => {
      const wasMagnet = keyStateRef.current.isMagnet;
      if (e.key === "Control" || e.key === "Meta") {
        keyStateRef.current.isMagnet = true;
      }
      const stateChanged = keyStateRef.current.isMagnet !== wasMagnet;
      if (resizeState.current.isResizing && stateChanged) {
        handleMouseMove(lastMouseEventRef.current);
      }
    };

    const handleKeyUp = (e) => {
      const wasMagnet = keyStateRef.current.isMagnet;
      if (e.key === "Control" || e.key === "Meta") {
        keyStateRef.current.isMagnet = false;
      }
      const stateChanged = keyStateRef.current.isMagnet !== wasMagnet;
      if (resizeState.current.isResizing && stateChanged) {
        handleMouseMove(lastMouseEventRef.current);
      }
    };

    // Attach event listeners
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    // Cleanup listeners on unmount or dependency change
    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    chart,
    candlestickSeries,
    hoveredFibRetracementId,
    retracementsDataRef,
    setSelectedFibRetracementId,
    candleData,
    dragOrResizeStateRef,
  ]);
}

export default useFibRetracementResize;
