import { useEffect, useRef } from "react";
import { isPointOnLongPositionBody } from "../../drawing-tools/long-position/helpers";
import { getHoveredHandle as getLongHoveredHandle } from "../../drawing-tools/long-position/helpers";
import { getHoveredHandle as getShortHoveredHandle } from "../../drawing-tools/short-position/helpers";
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

function usePositionDrag(
  chart,
  candlestickSeries,
  hoveredPositionId,
  selectedPositionId,
  clearSelectedPositionId,
  clearHoveredPositionId,
  positionsDataRef,
  isResizingRef,
  setSelectedPositionId,
  dragOrResizeStateRef,
  positionType,
  candleData,
) {
  const positionDragState = useRef({
    isDragging: false,
    positionId: null,
    dragStart: null, // { mouse: {time, price, logicalIndex}, position: { entryPrice, targetPrice, stopPrice } }
  });

  useEffect(() => {
    if (!chart) return;
    const container = chart.chartElement ? chart.chartElement() : null;
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

    const handleMouseDown = (e) => {
      if (!chart) return;
      if (isResizingRef && isResizingRef.current) return;
      const mouse = getMouseLogical(e);
      let dragPosition = null;
      let startedDragOnPosition = false;
      const targetId = hoveredPositionId || selectedPositionId;

      if (targetId) {
        dragPosition = positionsDataRef.current.find((p) => p.id === targetId);

        // Check if mouse is on a handle first (similar to fib-retracement logic)
        if (dragPosition) {
          const isLongPosition =
            positionType === "long" ||
            dragPosition.constructor.name.includes("Long");
          const handle = isLongPosition
            ? getLongHoveredHandle(
                mouse,
                dragPosition,
                chart,
                candlestickSeries,
              )
            : getShortHoveredHandle(
                mouse,
                dragPosition,
                chart,
                candlestickSeries,
              );

          // If mouse is on a handle, don't start dragging - let resize handle it
          if (handle) {
            return;
          }
        }

        if (
          dragPosition &&
          isPointOnLongPositionBody(
            mouse,
            dragPosition,
            chart,
            candlestickSeries,
          )
        ) {
          positionDragState.current = {
            isDragging: true,
            positionId: dragPosition.id,
            dragStart: {
              mouse,
              position: {
                entryPrice: { ...dragPosition._entryPrice },
                targetPrice: { ...dragPosition._targetPrice },
                stopPrice: { ...dragPosition._stopPrice },
              },
            },
          };
          chart.applyOptions({ handleScroll: false, handleScale: false });
          startedDragOnPosition = true;
          if (dragOrResizeStateRef) {
            dragOrResizeStateRef.current = {
              isActive: true,
              cursor: "pointer",
            };
          }
        }
      }
      if (startedDragOnPosition) {
        if (setSelectedPositionId) setSelectedPositionId(dragPosition.id);
      } else {
        clearSelectedPositionId();
        clearHoveredPositionId();
      }
    };

    const handleMouseMove = (e) => {
      if (!positionDragState.current.isDragging) return;
      const dragPosition = positionsDataRef.current.find(
        (p) => p.id === positionDragState.current.positionId,
      );
      if (!dragPosition) return;
      const mouse = getMouseLogical(e);
      const { mouse: startMouse, position: startPosition } =
        positionDragState.current.dragStart;
      const deltaTime = mouse.time - startMouse.time;
      const deltaPrice = mouse.price - startMouse.price;

      // Update positions with enhanced points for hybrid coordinate system
      dragPosition._entryPrice = enhancePointWithLogicalIndex(
        {
          time: startPosition.entryPrice.time + deltaTime,
          price: startPosition.entryPrice.price + deltaPrice,
          logicalIndex:
            startPosition.entryPrice.logicalIndex +
            (mouse.logicalIndex - startMouse.logicalIndex),
        },
        candleData,
      );
      dragPosition._targetPrice = enhancePointWithLogicalIndex(
        {
          time: startPosition.targetPrice.time + deltaTime,
          price: startPosition.targetPrice.price + deltaPrice,
          logicalIndex:
            startPosition.targetPrice.logicalIndex +
            (mouse.logicalIndex - startMouse.logicalIndex),
        },
        candleData,
      );
      dragPosition._stopPrice = enhancePointWithLogicalIndex(
        {
          time: startPosition.stopPrice.time + deltaTime,
          price: startPosition.stopPrice.price + deltaPrice,
          logicalIndex:
            startPosition.stopPrice.logicalIndex +
            (mouse.logicalIndex - startMouse.logicalIndex),
        },
        candleData,
      );

      // Update the _startTime and _endTime properties that updateDrawingPosition relies on
      dragPosition._startTime = dragPosition._entryPrice.time;
      dragPosition._endTime = dragPosition._targetPrice.time;

      dragPosition.updateAllViews && dragPosition.updateAllViews();
      if (dragPosition.requestUpdate) dragPosition.requestUpdate();
    };

    // Mouse up: finish dragging and re-enable chart scroll/scale
    const handleMouseUp = () => {
      if (positionDragState.current.isDragging) {
        const draggedPositionId = positionDragState.current.positionId;

        // Update store with new position coordinates
        const draggedPosition = positionsDataRef.current.find(
          (p) => p.id === draggedPositionId,
        );
        if (draggedPosition) {
          updateDrawingPosition(
            draggedPosition.id,
            draggedPosition,
            positionType === "long" ? "long_position" : "short_position",
          );
        }

        positionDragState.current = {
          isDragging: false,
          positionId: null,
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
    hoveredPositionId,
    selectedPositionId,
    clearSelectedPositionId,
    clearHoveredPositionId,
    positionsDataRef,
    isResizingRef,
    setSelectedPositionId,
    dragOrResizeStateRef,
    positionType,
    candleData,
  ]);
}

export default usePositionDrag;
