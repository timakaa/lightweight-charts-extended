// useShortPositionResize.js - React hook for enabling resizing of short position handles on the chart
import { useEffect, useRef } from "react";
import { getHoveredHandle } from "../../drawing-tools/short-position/helpers";
import { getSnappedPrice } from "../../drawing-tools/helpers";
import { enhancePointWithLogicalIndex } from "../../helpers/coordinateUtils.js";
import { updateDrawingPosition } from "../../helpers/updateDrawingPosition.js";

// Helper to convert logical index to time for hybrid coordinate system
function logicalIndexToTime(logicalIndex, candleData) {
  if (!candleData || !Array.isArray(candleData) || candleData.length === 0) {
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
}

// Handles mouse events and logic for resizing short position handles (entry, target, stop)
function useShortPositionResize(
  chart,
  candlestickSeries,
  hoveredPositionId,
  selectedPositionId,
  positionsDataRef,
  isResizingRef,
  setSelectedPositionId,
  candleData, // for snapping
  dragOrResizeStateRef,
  activeResizeHandleRef,
) {
  const resizeState = useRef({
    isResizing: false,
    positionId: null,
    handle: null, // e.g., 'entry-right', 'profit-top-left', etc.
    initialMouse: null,
    handleHidden: false,
  });

  useEffect(() => {
    if (!chart) return;
    const container = chart.chartElement();
    if (!container) return;

    // Converts a mouse event to logical chart coordinates with hybrid support
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

    // Mouse down: start resizing if mouse is near a handle
    const handleMouseDown = (e) => {
      const targetId = hoveredPositionId || selectedPositionId;
      if (!targetId) return;

      const mouse = getMouseLogical(e);
      const targetPosition = positionsDataRef.current.find(
        (p) => p.id === targetId,
      );

      if (!targetPosition) return;

      const handle = getHoveredHandle(
        mouse,
        targetPosition,
        chart,
        candlestickSeries,
      );

      if (handle) {
        resizeState.current = {
          isResizing: true,
          positionId: targetPosition.id,
          handle: handle,
          initialMouse: { x: mouse.x, y: mouse.y },
          handleHidden: false,
        };
        isResizingRef.current = true;
        setSelectedPositionId(targetPosition.id);
        chart.applyOptions({ handleScroll: false, handleScale: false });
        e.stopPropagation();
        e.preventDefault();
        // Set dragOrResizeStateRef for persistent cursor
        let cursorType = null;
        switch (handle) {
          case "entry-right":
            cursorType = "ew-resize";
            break;
          case "profit-top-left":
          case "loss-bottom-left":
            cursorType = "ns-resize";
            break;
          case "entry-left":
            cursorType = "default";
            break;
          default:
            cursorType = "pointer";
        }
        if (dragOrResizeStateRef) {
          dragOrResizeStateRef.current = { isActive: true, cursor: cursorType };
        }
      }
    };

    // Mouse move: update the position handle being resized
    const handleMouseMove = (e) => {
      if (!resizeState.current.isResizing) return;

      const position = positionsDataRef.current.find(
        (p) => p.id === resizeState.current.positionId,
      );
      if (!position) return;

      const mouse = getMouseLogical(e);
      const handle = resizeState.current.handle;
      const newTime = mouse.time;
      let newPrice = mouse.price;
      const entryPrice = position._entryPrice.price;

      // --- SNAP LOGIC: if meta or ctrl pressed and resizing profit/loss handle ---
      const isSnap = e.metaKey || e.ctrlKey;
      if (
        isSnap &&
        (handle === "profit-top-left" || handle === "loss-bottom-left")
      ) {
        // Find the closest candle by time
        let closestCandle = null;
        let minDiff = Infinity;
        for (const candle of candleData || []) {
          const diff = Math.abs(candle.time - newTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestCandle = candle;
          }
        }
        if (closestCandle) {
          newPrice = getSnappedPrice(newPrice, closestCandle);
        }
      }

      if (
        !resizeState.current.handleHidden &&
        resizeState.current.initialMouse
      ) {
        const dx = mouse.x - resizeState.current.initialMouse.x;
        const dy = mouse.y - resizeState.current.initialMouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 3) {
          // threshold in pixels
          if (activeResizeHandleRef) activeResizeHandleRef.current = handle;
          resizeState.current.handleHidden = true;
        }
      }

      switch (handle) {
        case "entry-right": {
          // Only change the width (time of target/stop), not the price, using hybrid coordinates
          position._targetPrice = enhancePointWithLogicalIndex(
            {
              time: newTime,
              price: position._targetPrice.price,
              logicalIndex: mouse.logicalIndex,
            },
            candleData,
          );
          position._stopPrice = enhancePointWithLogicalIndex(
            {
              time: newTime,
              price: position._stopPrice.price,
              logicalIndex: mouse.logicalIndex,
            },
            candleData,
          );
          break;
        }
        case "profit-top-left":
          // For short: Only change the stop price, and don't allow it to go BELOW the entry price.
          position._stopPrice.price = Math.max(newPrice, entryPrice);
          break;
        case "loss-bottom-left":
          // For short: Only change the target price, and don't allow it to go ABOVE the entry price.
          position._targetPrice.price = Math.min(newPrice, entryPrice);
          break;
        case "entry-left": {
          // Resize by both x (time) and y (price) axes, like a rectangle corner using hybrid coordinates
          let entrySnapPrice = newPrice;
          if (isSnap) {
            // Find the closest candle by time
            let closestCandle = null;
            let minDiff = Infinity;
            for (const candle of candleData || []) {
              const diff = Math.abs(candle.time - newTime);
              if (diff < minDiff) {
                minDiff = diff;
                closestCandle = candle;
              }
            }
            if (closestCandle) {
              entrySnapPrice = getSnappedPrice(newPrice, closestCandle);
            }
          }
          const minPrice = Math.min(
            position._targetPrice.price,
            position._stopPrice.price,
          );
          const maxPrice = Math.max(
            position._targetPrice.price,
            position._stopPrice.price,
          );
          const constrainedPrice = Math.min(
            Math.max(entrySnapPrice, minPrice),
            maxPrice,
          );

          position._entryPrice = enhancePointWithLogicalIndex(
            {
              time: newTime,
              price: constrainedPrice,
              logicalIndex: mouse.logicalIndex,
            },
            candleData,
          );
          break;
        }
      }

      position.updateAllViews();
      if (position.requestUpdate) {
        position.requestUpdate();
      }
    };

    // Mouse up: finish resizing and re-enable chart scroll/scale
    const handleMouseUp = () => {
      if (resizeState.current.isResizing) {
        const resizedPositionId = resizeState.current.positionId;

        // Update store with new position coordinates
        const resizedPosition = positionsDataRef.current.find(
          (p) => p.id === resizedPositionId,
        );
        if (resizedPosition) {
          updateDrawingPosition(
            resizedPosition.id,
            resizedPosition,
            "short_position",
          );
        }

        resizeState.current = {
          isResizing: false,
          positionId: null,
          handle: null,
          initialMouse: null,
          handleHidden: false,
        };
        if (activeResizeHandleRef) activeResizeHandleRef.current = null;
        isResizingRef.current = false;
        chart.applyOptions({ handleScroll: true, handleScale: true });
        if (dragOrResizeStateRef) {
          dragOrResizeStateRef.current = { isActive: false, cursor: null };
        }
      }
    };

    container.addEventListener("mousedown", handleMouseDown, true); // Use capture phase for priority
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown, true); // Match capture flag
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    chart,
    candlestickSeries,
    hoveredPositionId,
    selectedPositionId,
    positionsDataRef,
    isResizingRef,
    setSelectedPositionId,
    candleData,
    dragOrResizeStateRef,
    activeResizeHandleRef,
  ]);
}

export default useShortPositionResize;
