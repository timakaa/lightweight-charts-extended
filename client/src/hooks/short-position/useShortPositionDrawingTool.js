// useShortPositionDrawingTool.js - React hook for managing the lifecycle of the ShortPositionDrawingTool
import { useEffect, useRef } from "react";
import { ShortPositionDrawingTool } from "../../drawing-tools/short-position";
import { TOOL_SHORT_POSITION, TOOL_CROSSHAIR } from "../../store/tool";

// Handles creation, initialization, cleanup, and drawing mode switching for short positions
function useShortPositionDrawingTool(
  chart,
  candlestickSeries,
  setCurrentTool,
  setShortPositionsData,
  setSelectedShortPositionId,
  currentTool,
  candleData,
  activeResizeHandleRef,
) {
  const shortPositionDrawingTool = useRef(null);

  // Create the short position tool (without candleData dependency to prevent recreation on data updates)
  useEffect(() => {
    if (!chart || !candlestickSeries) return;
    shortPositionDrawingTool.current = new ShortPositionDrawingTool(
      chart,
      candlestickSeries,
      () => setCurrentTool(TOOL_CROSSHAIR),
      {},
      setShortPositionsData,
      (pos) => setSelectedShortPositionId(pos.id),
      candleData,
      activeResizeHandleRef,
    );
    return () => {
      shortPositionDrawingTool.current?.remove();
      shortPositionDrawingTool.current = null;
    };
  }, [
    chart,
    candlestickSeries,
    setCurrentTool,
    setShortPositionsData,
    setSelectedShortPositionId,
    activeResizeHandleRef,
  ]);

  // Update candleData on the existing tool when data changes
  useEffect(() => {
    if (shortPositionDrawingTool.current && candleData) {
      shortPositionDrawingTool.current.updateCandleData(candleData);
    }
  }, [candleData]);

  useEffect(() => {
    if (!shortPositionDrawingTool.current) return;
    if (currentTool === TOOL_SHORT_POSITION) {
      // Custom: Only one click to create a 1:1 RR short position
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
        // Use drawing tool's _getPoint method for enhanced point creation with hybrid coordinates
        const entryPoint = shortPositionDrawingTool.current._getPoint(param);
        if (!entryPoint) return;

        // Calculate target position using logical indices for reliable positioning
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

        // Get entry price from the enhanced point
        const entryPrice = entryPoint.price;
        if (entryPrice == null) return;

        // Get visible price range in price units
        const visibleRange = candlestickSeries.priceScale().getVisibleRange();
        if (!visibleRange) return;
        const priceRange = visibleRange.to - visibleRange.from;
        const percent = 0.15; // 15% of window for risk (can adjust)
        const risk = priceRange * percent;
        const stopPrice = entryPrice + risk;
        const targetPrice = entryPrice - risk;

        // Create enhanced points with logical indices
        const entry = {
          time: entryPoint.time,
          price: entryPrice,
          logicalIndex: entryPoint.logicalIndex,
        };
        const target = {
          time: targetTime,
          price: targetPrice,
          logicalIndex: targetLogicalIndex,
        };
        const stop = {
          time: targetTime,
          price: stopPrice,
          logicalIndex: targetLogicalIndex,
        };
        const newPosition = shortPositionDrawingTool.current._createPosition(
          entry,
          target,
          stop,
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
        shortPositionDrawingTool.current._positions.add(newPosition);
        setShortPositionsData((prev) => [...prev, newPosition]);
        setSelectedShortPositionId(newPosition.id);
        setCurrentTool(TOOL_CROSSHAIR);
      };
      chart.subscribeClick(handleClick);
      return () => chart.unsubscribeClick(handleClick);
    } else {
      shortPositionDrawingTool.current.stopDrawing();
    }
  }, [
    currentTool,
    chart,
    candlestickSeries,
    setShortPositionsData,
    setSelectedShortPositionId,
    setCurrentTool,
    candleData,
  ]);

  return shortPositionDrawingTool;
}

export { useShortPositionDrawingTool };
