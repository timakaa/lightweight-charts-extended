// useCreateDrawings.js - Hook for creating drawings from store data
import { useEffect, useRef } from "react";
import { createDrawings } from "../helpers/createDrawings";
import { useChartStore } from "../store/chart";
import { useDrawingsStore } from "../store/drawings";
import { toUnixSeconds } from "../helpers/time";

/**
 * Hook to create drawings from backend data
 * @param {Object} props - Object containing all required props
 * @param {Object} props.chart - The chart instance
 * @param {Object} props.candlestickSeries - The candlestick series instance
 * @param {Array} props.candleData - Array of candle data
 * @param {Function} props.setBoxesData - Function to update boxes state
 * @param {Function} props.setLinesData - Function to update lines state
 * @param {Function} props.setLongPositionsData - Function to update long positions state
 * @param {Function} props.setShortPositionsData - Function to update short positions state
 * @param {Function} props.setFibRetracementsData - Function to update Fibonacci retracements state
 * @param {Object} props.rectangleDrawingTool - Rectangle drawing tool reference
 * @param {Object} props.lineDrawingTool - Line drawing tool reference
 * @param {Object} props.longPositionDrawingTool - Long position drawing tool reference
 * @param {Object} props.shortPositionDrawingTool - Short position drawing tool reference
 * @param {Object} props.fibRetracementDrawingTool - Fibonacci retracement drawing tool reference
 * @param {Array} props.drawingsData - Optional custom drawings data, defaults to example data
 * @param {Object} props.activeResizeHandleRefs - Object mapping drawing types to their activeResizeHandleRef
 */
export function useCreateDrawings({
  chart,
  candlestickSeries,
  candleData,
  setBoxesData,
  setLinesData,
  setLongPositionsData,
  setShortPositionsData,
  setFibRetracementsData,
  rectangleDrawingTool,
  lineDrawingTool,
  longPositionDrawingTool,
  shortPositionDrawingTool,
  fibRetracementDrawingTool,
  drawingsData = null, // Now optional - will use store data by default
  activeResizeHandleRefs = {},
}) {
  const symbol = useChartStore((s) => s.ticker);
  const timeframe = useChartStore((s) => s.timeframe);
  const storeDrawings = useDrawingsStore((s) => s.drawings);
  const lastStateRef = useRef({
    symbol: null,
    timeframe: null,
    drawingsCreated: false,
  });

  // Helper function to extract start times from drawings data
  const getDrawingStartTimes = (drawingsData, currentTicker) => {
    const startTimes = new Set();

    drawingsData
      .filter((drawing) => drawing.ticker === currentTicker.replace("/", ""))
      .forEach((drawing) => {
        switch (drawing.type) {
          case "rectangle":
          case "line":
          case "fib_retracement":
            if (drawing.startTime && drawing.startTime !== "relative") {
              startTimes.add(toUnixSeconds(drawing.startTime));
            }
            break;
          case "long_position":
          case "short_position":
            if (drawing.entry?.time && drawing.entry.time !== "relative") {
              startTimes.add(toUnixSeconds(drawing.entry.time));
            }
            break;
        }
      });

    return startTimes;
  };

  // Effect that only runs on context changes (ticker or timeframe)
  useEffect(() => {
    // Reset flags for new context
    lastStateRef.current.drawingsCreated = false;

    // Clear existing drawings from chart only (don't remove from store for ticker/timeframe changes)
    if (rectangleDrawingTool?.current) {
      // Use removeFromChartOnly if available, fallback to remove
      if (rectangleDrawingTool.current.removeFromChartOnly) {
        rectangleDrawingTool.current.removeFromChartOnly();
      } else {
        rectangleDrawingTool.current.remove();
      }
    }
    if (lineDrawingTool?.current) {
      // Use removeFromChartOnly if available, fallback to remove
      if (lineDrawingTool.current.removeFromChartOnly) {
        lineDrawingTool.current.removeFromChartOnly();
      } else {
        lineDrawingTool.current.remove();
      }
    }
    if (longPositionDrawingTool?.current) {
      // Use removeFromChartOnly if available, fallback to remove
      if (longPositionDrawingTool.current.removeFromChartOnly) {
        longPositionDrawingTool.current.removeFromChartOnly();
      } else {
        longPositionDrawingTool.current.remove();
      }
    }
    if (shortPositionDrawingTool?.current) {
      // Use removeFromChartOnly if available, fallback to remove
      if (shortPositionDrawingTool.current.removeFromChartOnly) {
        shortPositionDrawingTool.current.removeFromChartOnly();
      } else {
        shortPositionDrawingTool.current.remove();
      }
    }
    if (fibRetracementDrawingTool?.current) {
      // Use removeFromChartOnly if available, fallback to remove
      if (fibRetracementDrawingTool.current.removeFromChartOnly) {
        fibRetracementDrawingTool.current.removeFromChartOnly();
      } else {
        fibRetracementDrawingTool.current.remove();
      }
    }

    // Clear state arrays
    setBoxesData([]);
    setLinesData([]);
    setLongPositionsData([]);
    setShortPositionsData([]);
    setFibRetracementsData([]);
  }, [symbol, timeframe]);

  // Effect that runs when candle data changes and creates drawings if needed
  useEffect(() => {
    if (lastStateRef.current.drawingsCreated) {
      return; // Already created for this context
    }

    if (
      !chart ||
      !candlestickSeries ||
      !candleData ||
      candleData.length === 0
    ) {
      return;
    }

    // Get only real candles to check meaningful changes
    const realCandles = candleData.filter((c) => c.open !== undefined);

    // Wait for sufficient candle data
    if (realCandles.length < 10) {
      return;
    }

    const currentEarliestTime =
      realCandles.length > 0 ? realCandles[0].time : null;
    const currentLatestTime =
      realCandles.length > 0 ? realCandles[realCandles.length - 1].time : null;

    // Get current ticker for filtering
    const currentTicker = useChartStore.getState().ticker;
    if (!currentTicker) return;

    // Use store data if no data provided
    const dataToUse = drawingsData || storeDrawings;

    // Track unavailable start times
    const allStartTimes = getDrawingStartTimes(dataToUse, currentTicker);
    const unavailableStartTimes = new Set();
    for (const startTime of allStartTimes) {
      if (startTime < currentEarliestTime || startTime > currentLatestTime) {
        unavailableStartTimes.add(startTime);
      }
    }

    // Create drawings with current candle data
    createDrawings(
      chart,
      candlestickSeries,
      candleData,
      dataToUse,
      setBoxesData,
      setLinesData,
      setLongPositionsData,
      setShortPositionsData,
      setFibRetracementsData,
      rectangleDrawingTool,
      lineDrawingTool,
      longPositionDrawingTool,
      shortPositionDrawingTool,
      fibRetracementDrawingTool,
      activeResizeHandleRefs,
    );

    // Update tracking AFTER drawings are created
    lastStateRef.current = {
      symbol,
      timeframe,
      drawingsCreated: true,
    };
  }, [chart, candlestickSeries, candleData, storeDrawings]);
}
