// useBoxChartEvents.js - React hook for handling chart click and crosshair move events for rectangles (boxes)
import { useEffect } from "react";
import {
  isPointNearRectangleBorder,
  isPointNearRectangleCorner,
} from "../../drawing-tools/rectangle/helpers";
import { TOOL_CROSSHAIR } from "../../store/tool";
import { getXCoordinate } from "../../helpers/coordinateUtils";

// Helper: check if a point is inside a rectangle using hybrid coordinate system
function isPointInsideRectangle(point, box, chart, series) {
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

  const pointY = series.priceToCoordinate(price);
  const p1Y = series.priceToCoordinate(box._p1.price);
  const p2Y = series.priceToCoordinate(box._p2.price);

  const minX = Math.min(p1X, p2X);
  const maxX = Math.max(p1X, p2X);
  const minY = Math.min(p1Y, p2Y);
  const maxY = Math.max(p1Y, p2Y);

  return pointX > minX && pointX < maxX && pointY > minY && pointY < maxY;
}

// Handles subscribing/unsubscribing to chart click and crosshair move events, and updates selection/hover state
function useBoxChartEvents(
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
) {
  useEffect(() => {
    if (!chart || !candlestickSeries) return;

    // Helper to convert chart event to logical point with hybrid coordinate support
    const getLogicalPoint = (param) => {
      const price = rectangleDrawingTool.current?._getPriceFromEvent(param);
      if (!price) return null;

      // If we have a time from the param, use it (normal case)
      if (param.time) {
        return { time: param.time, price };
      }

      // If no time (outside data range), use logical coordinate
      if (param.point && candleData && candleData.length > 0) {
        const timeScale = chart.timeScale();
        const logicalIndex = timeScale.coordinateToLogical(param.point.x);

        if (logicalIndex !== null) {
          // Calculate time from logical index for hybrid system
          let calculatedTime = null;
          if (logicalIndex >= -100 && logicalIndex < candleData.length + 100) {
            // Handle positive indices (within data range)
            if (logicalIndex >= 0 && logicalIndex < candleData.length) {
              calculatedTime = candleData[Math.floor(logicalIndex)].time;
            }
            // Handle negative indices (before first candle)
            else if (logicalIndex < 0 && candleData.length >= 2) {
              const interval = candleData[1].time - candleData[0].time;
              calculatedTime = candleData[0].time + logicalIndex * interval;
            }
            // Handle indices after last candle
            else if (
              logicalIndex >= candleData.length &&
              candleData.length >= 2
            ) {
              const interval =
                candleData[candleData.length - 1].time -
                candleData[candleData.length - 2].time;
              const extraSteps = logicalIndex - (candleData.length - 1);
              calculatedTime =
                candleData[candleData.length - 1].time + extraSteps * interval;
            }
          }

          return {
            time: calculatedTime,
            price,
            logicalIndex: logicalIndex,
          };
        }
      }

      return null;
    };

    // Handle chart click: select hovered box or clear selection
    const handleChartClick = (param) => {
      if (currentToolRef.current !== TOOL_CROSSHAIR) return;
      if (!param.point || param.hoveredSeries || param.hoveredObject) {
        return;
      }
      if (hoveredBoxId) {
        setSelectedBoxId(hoveredBoxId);
      } else {
        // Check if click is inside any selected box using hybrid coordinates
        const point = getLogicalPoint(param);
        if (point) {
          const selectedBox = boxesDataRef.current.find(
            (box) => box.id === rectangleDrawingTool.current?._selectedBoxId,
          );
          if (
            selectedBox &&
            isPointInsideRectangle(point, selectedBox, chart, candlestickSeries)
          ) {
            // Do not clear selection if click is inside selected box
            return;
          }
        }
        clearSelectedBoxId();
      }
    };

    // Handle crosshair move: update hovered box based on proximity
    const handleCrosshairMove = (param) => {
      if (currentToolRef.current !== TOOL_CROSSHAIR) return;
      if (!param.point) {
        clearHoveredBoxId();
        return;
      }

      const point = getLogicalPoint(param);
      if (!point) {
        clearHoveredBoxId();
        return;
      }

      // First, check if mouse is near any box corner
      let found = false;
      for (const box of boxesDataRef.current) {
        const corner = isPointNearRectangleCorner(
          point,
          box,
          chart,
          candlestickSeries,
        );
        if (corner) {
          setHoveredBoxId(box.id);
          found = true;
          break;
        }
      }
      if (!found) {
        // If not near a corner, check if near the border
        const hoveredBox = boxesDataRef.current.find((box) =>
          isPointNearRectangleBorder(point, box, chart, candlestickSeries),
        );
        if (hoveredBox) {
          setHoveredBoxId(hoveredBox.id);
        } else {
          clearHoveredBoxId();
        }
      }
    };

    chart.subscribeClick(handleChartClick);
    chart.subscribeCrosshairMove(handleCrosshairMove);
    return () => {
      chart.unsubscribeClick(handleChartClick);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
    };
  }, [
    chart,
    candlestickSeries,
    setSelectedBoxId,
    clearSelectedBoxId,
    setHoveredBoxId,
    clearHoveredBoxId,
    currentToolRef,
    boxesDataRef,
    rectangleDrawingTool,
    hoveredBoxId,
    candleData,
  ]);
}

export default useBoxChartEvents;
