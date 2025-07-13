// useLongPositionDrawingTool.js - React hook for managing the lifecycle of the LongPositionDrawingTool
import { useEffect, useRef } from "react";
import { LongPositionDrawingTool } from "../../drawing-tools/long-position";
import { TOOL_LONG_POSITION, TOOL_CROSSHAIR } from "../../store/tool";

// Handles creation, initialization, cleanup, and drawing mode switching for long positions
function useLongPositionDrawingTool(
  chart,
  candlestickSeries,
  setCurrentTool,
  setLongPositionsData,
  setSelectedLongPositionId,
  currentTool,
  candleData,
  activeResizeHandleRef,
) {
  const longPositionDrawingTool = useRef(null);

  // Create the long position tool (without candleData dependency to prevent recreation on data updates)
  useEffect(() => {
    if (!chart || !candlestickSeries) return;
    longPositionDrawingTool.current = new LongPositionDrawingTool(
      chart,
      candlestickSeries,
      () => setCurrentTool(TOOL_CROSSHAIR),
      {},
      setLongPositionsData,
      (pos) => setSelectedLongPositionId(pos.id),
      candleData,
      activeResizeHandleRef,
    );
    return () => {
      longPositionDrawingTool.current = null;
    };
  }, [
    chart,
    candlestickSeries,
    setCurrentTool,
    setLongPositionsData,
    setSelectedLongPositionId,
    activeResizeHandleRef,
  ]);

  // Update candleData on the existing tool when data changes
  useEffect(() => {
    if (longPositionDrawingTool.current && candleData) {
      // Update candle data on the tool itself
      longPositionDrawingTool.current._candleData = candleData;

      // Use the updateCandleData method to update all existing positions and trigger re-render
      if (longPositionDrawingTool.current.updateCandleData) {
        longPositionDrawingTool.current.updateCandleData(candleData);
      }
    }
  }, [candleData]);

  useEffect(() => {
    if (!longPositionDrawingTool.current) return;
    if (currentTool === TOOL_LONG_POSITION) {
      // Custom: Only one click to create a 1:1 RR long position with hybrid coordinate support
      const handleClick = (param) => {
        if (!param.point) {
          return;
        }
        if (
          !candleData ||
          !Array.isArray(candleData) ||
          candleData.length === 0
        ) {
          return;
        }

        // Use the drawing tool's _getPoint method to get hybrid coordinate point
        const entryPoint = longPositionDrawingTool.current._getPoint(param);
        if (!entryPoint) return;

        // Get entry price from the point
        const entryPrice = entryPoint.price;
        if (entryPrice == null) return;

        // Calculate width as a percentage of visible bars instead of a fixed offset
        const logicalRange = chart.timeScale().getVisibleLogicalRange();
        if (!logicalRange) return;
        const visibleBars = logicalRange.to - logicalRange.from;
        const timeOffset = Math.max(1, Math.round(visibleBars * 0.02)); // 2% of visible bars

        // Calculate target position using logical coordinates
        let targetTime, targetLogicalIndex;

        if (
          entryPoint.logicalIndex !== undefined &&
          entryPoint.logicalIndex !== null
        ) {
          // Use logical index for positioning (works outside data range)
          targetLogicalIndex = entryPoint.logicalIndex + timeOffset;

          // Try to calculate target time from logical index
          if (
            targetLogicalIndex >= 0 &&
            targetLogicalIndex < candleData.length
          ) {
            // Within data range - use actual candle time
            targetTime = candleData[Math.floor(targetLogicalIndex)].time;
          } else if (candleData.length >= 2) {
            // Outside data range - calculate time using interval
            const interval =
              candleData[candleData.length - 1].time -
              candleData[candleData.length - 2].time;
            if (targetLogicalIndex >= candleData.length) {
              // After last candle
              const extraSteps = targetLogicalIndex - (candleData.length - 1);
              targetTime =
                candleData[candleData.length - 1].time + extraSteps * interval;
            } else if (targetLogicalIndex < 0) {
              // Before first candle
              const interval = candleData[1].time - candleData[0].time;
              targetTime = candleData[0].time + targetLogicalIndex * interval;
            }
          }
        } else if (entryPoint.time) {
          // Fallback to time-based calculation
          const entryIndex = candleData.findIndex(
            (c) => c.time === entryPoint.time,
          );
          if (entryIndex !== -1) {
            const targetIndex = entryIndex + timeOffset;
            if (targetIndex < candleData.length) {
              targetTime = candleData[targetIndex].time;
              targetLogicalIndex = targetIndex;
            } else {
              // Calculate time beyond data range
              const interval =
                candleData[candleData.length - 1].time -
                candleData[candleData.length - 2].time;
              const extraSteps = targetIndex - (candleData.length - 1);
              targetTime =
                candleData[candleData.length - 1].time + extraSteps * interval;
              targetLogicalIndex = targetIndex;
            }
          }
        }

        // If we couldn't calculate target time, fallback to a simple offset
        if (!targetTime && entryPoint.time) {
          // Use a time-based fallback for positions within data range
          const avgInterval =
            candleData.length >= 2
              ? (candleData[candleData.length - 1].time - candleData[0].time) /
                (candleData.length - 1)
              : 3600; // 1 hour fallback
          targetTime = entryPoint.time + timeOffset * avgInterval;
        }

        if (!targetTime) return; // Still no target time, can't create position

        // Get visible price range in price units
        const visibleRange = candlestickSeries.priceScale().getVisibleRange();
        if (!visibleRange) return;
        const priceRange = visibleRange.to - visibleRange.from;
        const percent = 0.15; // 15% of window for risk (can adjust)
        const risk = priceRange * percent;
        const stopPrice = entryPrice - risk;
        const targetPrice = entryPrice + risk;

        const newPosition = longPositionDrawingTool.current._createPosition(
          entryPrice,
          targetPrice,
          stopPrice,
          entryPoint.time,
          targetTime,
        );

        // Attach the position to the series
        candlestickSeries.attachPrimitive(newPosition);
        if (typeof newPosition.attached === "function") {
          newPosition.attached({
            chart: chart,
            series: candlestickSeries,
          });
        }

        // Add to positions set and update state
        longPositionDrawingTool.current._positions.add(newPosition);
        setLongPositionsData((prev) => [...prev, newPosition]);
        setSelectedLongPositionId(newPosition.id);
        setCurrentTool(TOOL_CROSSHAIR);
      };
      chart.subscribeClick(handleClick);
      return () => chart.unsubscribeClick(handleClick);
    } else {
      longPositionDrawingTool.current.stopDrawing();
    }
  }, [
    currentTool,
    chart,
    candlestickSeries,
    setLongPositionsData,
    setSelectedLongPositionId,
    setCurrentTool,
    candleData,
  ]);

  return longPositionDrawingTool;
}

export default useLongPositionDrawingTool;
