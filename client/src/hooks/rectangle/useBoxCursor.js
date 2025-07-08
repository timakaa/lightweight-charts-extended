// useBoxCursor.js - React hook for setting the mouse cursor style based on box (rectangle) hover/drag/resize state
import { useEffect } from "react";
import {
  isPointNearRectangleCorner,
  isPointNearRectangleMidpoint,
} from "../../drawing-tools/rectangle/helpers";
import { getXCoordinate } from "../../helpers/coordinateUtils";

/**
 * useBoxCursor
 *
 * This React hook manages the mouse cursor style for box (rectangle) resize handles (corners and midpoints) on the chart.
 * It listens to mousemove events on the chart container and sets the cursor to the appropriate resize style
 * (e.g., 'nwse-resize', 'ew-resize', etc.) when hovering over a handle,
 * 'pointer' when inside the hovered or selected box (but not on a handle),
 * or 'crosshair' otherwise.
 *
 * This keeps all cursor logic in the UI layer, separate from the core drag/resize logic.
 * Now supports hybrid coordinate system for rectangles outside candle range.
 *
 * @param {object} chart - The chart instance (must provide chartElement and timeScale methods)
 * @param {object} candlestickSeries - The candlestick series instance (must provide coordinateToPrice method)
 * @param {string|null} hoveredBoxId - The ID of the currently hovered box, or null if none
 * @param {object} boxesDataRef - React ref object containing the array of all box data
 * @param {string|null} selectedBoxId - The ID of the currently selected box, or null if none
 * @param {object} dragOrResizeStateRef - React ref object containing the drag or resize state
 * @param {array} candleData - Array of candle data for coordinate calculations
 */
export default function useBoxCursor(
  chart,
  candlestickSeries,
  hoveredBoxId,
  boxesDataRef,
  selectedBoxId,
  dragOrResizeStateRef,
  candleData,
) {
  useEffect(() => {
    if (!chart || !candlestickSeries) return;
    const container = chart.chartElement ? chart.chartElement() : null;
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

      return pointX > minX && pointX < maxX && pointY > minY && pointY < maxY;
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

    // Mouse move handler: sets the cursor style based on handle hit-testing and box selection
    const handleMouseMove = (e) => {
      // If dragging or resizing, force the cursor
      if (dragOrResizeStateRef && dragOrResizeStateRef.current.isActive) {
        setGlobalCursor(dragOrResizeStateRef.current.cursor || "pointer");
        return;
      }
      let cursor = "crosshair"; // Default cursor
      const mouse = getMouseLogical(e);
      // 1. Handle logic for hovered box handles (corners/midpoints)
      const targetId = hoveredBoxId || selectedBoxId;
      if (targetId) {
        const targetBox = boxesDataRef.current.find((b) => b.id === targetId);
        if (targetBox) {
          // Check if mouse is near a corner handle
          const corner = isPointNearRectangleCorner(
            mouse,
            targetBox,
            chart,
            candlestickSeries,
          );
          if (corner) {
            // Set diagonal resize cursor for corners
            switch (corner.name) {
              case "topLeft":
              case "bottomRight":
                cursor = "nwse-resize";
                break;
              case "topRight":
              case "bottomLeft":
                cursor = "nesw-resize";
                break;
              default:
                cursor = "pointer";
            }
          } else {
            // Check if mouse is near a midpoint handle
            const midpoint = isPointNearRectangleMidpoint(
              mouse,
              targetBox,
              chart,
              candlestickSeries,
            );
            if (midpoint) {
              // Set straight resize cursor for midpoints
              switch (midpoint) {
                case "left":
                case "right":
                  cursor = "ew-resize";
                  break;
                case "top":
                case "bottom":
                  cursor = "ns-resize";
                  break;
                default:
                  cursor = "pointer";
              }
            } else {
              // 2. If not on a handle, but inside the box, set cursor to pointer
              if (isPointInsideBox(mouse, targetBox)) {
                cursor = "pointer";
              }
            }
          }
        }
      }
      setGlobalCursor(cursor);
    };

    // Attach the mousemove event listener
    container.addEventListener("mousemove", handleMouseMove);

    // Cleanup function to reset the cursor when the component unmounts
    // or when the dependencies of the effect change.
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      resetGlobalCursor();
    };
  }, [
    chart,
    candlestickSeries,
    hoveredBoxId,
    boxesDataRef,
    selectedBoxId,
    dragOrResizeStateRef,
  ]);
}
