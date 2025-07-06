// useShortPositionChartEvents.js - React hook for handling chart click and crosshair move events for short positions
import { useEffect } from "react";
import { TOOL_CROSSHAIR } from "../../store/tool";
import { isPointOnShortPosition } from "../../drawing-tools/short-position/helpers";

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

// Handles subscribing/unsubscribing to chart click and crosshair move events for short positions
function useShortPositionChartEvents(
  chart,
  candlestickSeries,
  currentToolRef,
  positionsDataRef,
  setSelectedPositionId,
  clearSelectedPositionId,
  setHoveredPositionId,
  clearHoveredPositionId,
  positionDrawingTool,
  hoveredPositionId,
  selectedPositionId,
  candleData,
) {
  useEffect(() => {
    if (!chart || !candlestickSeries) return;

    // Helper to convert chart event to logical point with hybrid coordinate support
    const getLogicalPoint = (param) => {
      const price = positionDrawingTool.current?._getPriceFromEvent(param);
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
            calculatedTime = logicalIndexToTime(logicalIndex, candleData);
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

    // Handle chart click: select hovered position or clear selection
    const handleChartClick = (param) => {
      if (currentToolRef.current !== TOOL_CROSSHAIR) return;
      if (!param.point || param.hoveredSeries || param.hoveredObject) {
        return;
      }
      if (hoveredPositionId) {
        setSelectedPositionId(hoveredPositionId);
        clearHoveredPositionId();
      } else {
        clearSelectedPositionId();
        clearHoveredPositionId();
      }
    };

    // Handle crosshair move: update hovered position based on proximity
    const handleCrosshairMove = (param) => {
      if (currentToolRef.current !== TOOL_CROSSHAIR) return;
      if (!param.point) {
        clearHoveredPositionId();
        return;
      }

      const logicalPoint = getLogicalPoint(param);
      if (!logicalPoint) {
        clearHoveredPositionId();
        return;
      }

      let hoveredPosition = null;
      for (const pos of positionsDataRef.current) {
        if (
          isPointOnShortPosition(logicalPoint, pos, chart, candlestickSeries)
        ) {
          hoveredPosition = pos;
          break;
        }
      }

      if (hoveredPosition) {
        setHoveredPositionId(hoveredPosition.id);
        hoveredPosition.requestUpdate && hoveredPosition.requestUpdate();
      } else {
        clearHoveredPositionId();
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
    setSelectedPositionId,
    clearSelectedPositionId,
    setHoveredPositionId,
    clearHoveredPositionId,
    currentToolRef,
    positionsDataRef,
    positionDrawingTool,
    hoveredPositionId,
    selectedPositionId,
    candleData,
  ]);
}

export default useShortPositionChartEvents;
