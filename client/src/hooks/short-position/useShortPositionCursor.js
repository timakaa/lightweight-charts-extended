// useShortPositionCursor.js - React hook for setting the mouse cursor style based on short position hover/drag state
import { useEffect } from "react";
import {
  getHoveredHandle,
  isPointOnShortPositionBody,
} from "../../drawing-tools/short-position/helpers";

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

// Sets the mouse cursor style for short position handles and body
function useShortPositionCursor(
  chart,
  candlestickSeries,
  hoveredPositionId,
  positionsDataRef,
  selectedPositionId,
  dragOrResizeStateRef,
  activeResizeHandleRef,
  candleData,
) {
  useEffect(() => {
    if (!chart || !candlestickSeries) return;
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

    // Helper to set cursor on all relevant elements
    const setGlobalCursor = (cursor) => {
      container.style.cursor = cursor;
      document.body.style.cursor = cursor;
      document.documentElement.style.cursor = cursor;
    };
    // Helper to reset cursor on all relevant elements
    const resetGlobalCursor = () => {
      container.style.cursor = "crosshair";
      document.body.style.cursor = "";
      document.documentElement.style.cursor = "";
    };

    // Mouse move handler: sets the cursor style based on handle hit-testing and position selection
    const handleMouseMove = (e) => {
      // If dragging or resizing, force the cursor
      if (dragOrResizeStateRef && dragOrResizeStateRef.current.isActive) {
        setGlobalCursor(dragOrResizeStateRef.current.cursor || "pointer");
        return;
      }
      let cursor = "crosshair";
      const mouse = getMouseLogical(e);

      // 1. Check hovered position
      if (hoveredPositionId) {
        const hovered = positionsDataRef.current.find(
          (p) => p.id === hoveredPositionId,
        );
        if (hovered) {
          const handle = getHoveredHandle(
            mouse,
            hovered,
            chart,
            candlestickSeries,
          );
          if (handle) {
            switch (handle) {
              case "entry-left":
                cursor = "default";
                break;
              case "entry-right":
                cursor = "ew-resize";
                break;
              case "profit-top-left":
              case "loss-bottom-left":
                cursor = "ns-resize";
                break;
              default:
                cursor = "pointer";
            }
            setGlobalCursor(cursor);
            return;
          } else if (
            isPointOnShortPositionBody(mouse, hovered, chart, candlestickSeries)
          ) {
            cursor = "pointer";
            setGlobalCursor(cursor);
            return;
          }
        }
      }

      // 2. If not on hovered, check selected position
      if (selectedPositionId) {
        const selected = positionsDataRef.current.find(
          (p) => p.id === selectedPositionId,
        );
        if (selected) {
          const handle = getHoveredHandle(
            mouse,
            selected,
            chart,
            candlestickSeries,
          );
          if (handle) {
            switch (handle) {
              case "entry-left":
                cursor = "default";
                break;
              case "entry-right":
                cursor = "ew-resize";
                break;
              case "profit-top-left":
              case "loss-bottom-left":
                cursor = "ns-resize";
                break;
              default:
                cursor = "pointer";
            }
            setGlobalCursor(cursor);
            return;
          } else if (
            isPointOnShortPositionBody(
              mouse,
              selected,
              chart,
              candlestickSeries,
            )
          ) {
            cursor = "pointer";
            setGlobalCursor(cursor);
            return;
          }
        }
      }

      // 3. Default
      setGlobalCursor(cursor);
    };

    container.addEventListener("mousemove", handleMouseMove);
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      resetGlobalCursor();
    };
  }, [
    chart,
    candlestickSeries,
    hoveredPositionId,
    selectedPositionId,
    positionsDataRef,
    dragOrResizeStateRef,
    activeResizeHandleRef,
    candleData,
  ]);
}

export default useShortPositionCursor;
