import { createRectangle } from "./createRectangle.js";
import { createLine } from "./createLine.js";
import { createLongPosition } from "./createLongPosition.js";
import { createShortPosition } from "./createShortPosition.js";
import { createFibRetracement } from "./createFibRetracement.js";
import { useChartStore } from "../store/chart.js";
import { useDrawingsStore } from "../store/drawings.js";
import { toUnixSeconds, resolveDrawingTime } from "./time.js";

// Example array of drawing objects from backend using actual times
export const exampleDrawingsData = [
  {
    type: "rectangle",
    ticker: "SOLUSDT",
    startTime: "2025-05-21T16:00:00Z", // Actual time - will find nearest candle
    endTime: "2025-05-21T20:00:00Z", // Changed from relative to actual time for testing
    startPrice: 171.31,
    endPrice: 169.56,
    style: {
      borderColor: "#FF0000",
      borderWidth: 2,
      fillColor: "rgba(255, 0, 0, 0.1)",
    },
  },
  {
    type: "rectangle",
    ticker: "SOLUSDT",
    startTime: "2025-05-23T10:00:00Z", // Actual time - will find nearest candle
    endTime: "relative",
    startPrice: 185.44,
    endPrice: 178.65,
    style: {
      borderColor: "#00FF00",
      borderWidth: 2,
      fillColor: "rgba(0, 255, 0, 0.1)",
    },
  },
  {
    type: "line",
    ticker: "SOLUSDT",
    startTime: "2025-05-21T09:00:00Z", // Actual time - will find nearest candle
    endTime: "2025-05-21T15:00:00Z", // Changed from relative to actual time for testing
    startPrice: 167.33,
    endPrice: 167.33,
    style: {
      color: "#FF0000",
      width: 2,
      style: "solid",
    },
  },
  {
    type: "long_position",
    ticker: "SOLUSDT",
    entry: { time: "2025-05-21T23:00:00Z", price: 171.31 }, // Actual time
    target: { time: "2025-05-23T02:00:00Z", price: 184.93 }, // Actual time
    stop: { time: "2025-05-21T23:00:00Z", price: 168.0 }, // Actual time
  },
  {
    type: "short_position",
    ticker: "SOLUSDT",
    entry: { time: "2025-05-23T14:00:00Z", price: 182.04 }, // Actual time
    target: { time: "2025-05-24T00:00:00Z", price: 173.19 }, // Actual time
    stop: { time: "2025-05-28T10:00:00Z", price: 187.14 }, // Actual time
  },
  {
    type: "fib_retracement",
    ticker: "SOLUSDT",
    startTime: "2025-05-23T09:00:00Z", // Actual time - will find nearest candle
    endTime: "relative", // Extend to latest candle + 10 candles forward
    startPrice: 187.67,
    endPrice: 172.56,
  },
  {
    type: "rectangle",
    ticker: "SOLUSDT",
    startTime: "2025-05-21T22:00:00Z", // Start from historical point
    endTime: "2025-05-22T10:00:00Z", // Extend to latest + 10 candles (test hybrid coordinates)
    startPrice: 172.27,
    endPrice: 173.26,
  },
];

/**
 * Converts drawing data with actual times to timeframe-adapted times
 * Only processes drawings where the start time is within available data
 * @param {Object} drawingData - Drawing data with actual times
 * @param {Array} candleData - Array of candle data for current timeframe
 * @returns {Object|null} Drawing data with timeframe-adapted times, or null if not available
 */
function resolveDrawingPositions(drawingData, candleData) {
  const resolved = { ...drawingData };

  // Helper function to resolve a time value
  const resolveTime = (time) => {
    if (time === "relative") {
      // Handle relative positioning - extend to latest candle + 10 candles further
      return resolveRelativeEndTime(candleData);
    }

    // Convert ISO string to UNIX timestamp if needed
    const unixTime = toUnixSeconds(time);

    // Use hybrid coordinate time resolution instead of limiting to candle range
    return resolveDrawingTime(unixTime, candleData);
  };

  // Helper function to calculate relative end time (latest candle + 10 candles forward)
  const resolveRelativeEndTime = (candleData) => {
    if (!candleData || candleData.length === 0) return null;

    // Find the latest real candle
    const realCandles = candleData.filter((c) => c.open !== undefined);
    if (realCandles.length === 0) return null;

    const latestCandle = realCandles[realCandles.length - 1];
    const latestTime = latestCandle.time;

    // Determine timeframe interval by checking difference between last two candles
    let interval = 3600; // Default to 1 hour
    if (realCandles.length >= 2) {
      interval =
        realCandles[realCandles.length - 1].time -
        realCandles[realCandles.length - 2].time;
    }

    // Calculate time 10 candles beyond the latest candle
    const relativeEndTime = latestTime + interval * 10;

    return relativeEndTime;
  };

  // Check if the drawing can be positioned (start time must be available)
  let startTimeResolved = null;

  // Handle different drawing types to check start time availability
  switch (drawingData.type) {
    case "rectangle":
    case "line":
    case "fib_retracement": {
      if (drawingData.startTime) {
        startTimeResolved = resolveTime(drawingData.startTime);
        if (startTimeResolved === null) {
          return null; // Start time not available, skip this drawing
        }
        resolved.startTime = startTimeResolved;
      }
      if (drawingData.endTime) {
        if (drawingData.endTime === "relative") {
          // Only use resolveTime for relative positioning
          resolved.endTime = resolveTime(drawingData.endTime);
          if (resolved.endTime === null) {
            return null;
          }
        } else {
          // For fixed timestamps, convert directly without hybrid coordinate processing
          resolved.endTime = toUnixSeconds(drawingData.endTime);
        }
      }
      break;
    }
    case "long_position":
    case "short_position": {
      if (drawingData.entry?.time) {
        startTimeResolved = resolveTime(drawingData.entry.time);
        if (startTimeResolved === null) {
          return null; // Entry time not available, skip this drawing
        }
        resolved.entry = {
          ...drawingData.entry,
          time: startTimeResolved,
        };
      }
      if (drawingData.target?.time) {
        let targetTime;
        if (drawingData.target.time === "relative") {
          targetTime = resolveTime(drawingData.target.time);
          if (targetTime === null) {
            return null;
          }
        } else {
          targetTime = toUnixSeconds(drawingData.target.time);
        }
        resolved.target = {
          ...drawingData.target,
          time: targetTime,
        };
      }
      if (drawingData.stop?.time) {
        let stopTime;
        if (drawingData.stop.time === "relative") {
          stopTime = resolveTime(drawingData.stop.time);
          if (stopTime === null) {
            return null;
          }
        } else {
          stopTime = toUnixSeconds(drawingData.stop.time);
        }
        resolved.stop = {
          ...drawingData.stop,
          time: stopTime,
        };
      }
      break;
    }
  }

  return resolved;
}

/**
 * Load drawings from the store and recreate them on the chart
 * @param {Object} chart - Chart instance
 * @param {Object} candlestickSeries - Candlestick series instance
 * @param {Array} candleData - Candle data array
 * @param {Object} drawingTools - Object containing all drawing tools
 * @param {Object} setters - Object containing all state setters
 * @param {Object} activeResizeHandleRefs - Object containing resize handle refs
 */
export const loadDrawingsFromStore = (
  chart,
  candlestickSeries,
  candleData,
  drawingTools,
  setters,
  activeResizeHandleRefs,
) => {
  // Load drawings from store and recreate them
  createDrawings(
    chart,
    candlestickSeries,
    candleData,
    null, // Use store data
    setters.setBoxesData,
    setters.setLinesData,
    setters.setLongPositionsData,
    setters.setShortPositionsData,
    setters.setFibRetracementsData,
    drawingTools.rectangleDrawingTool,
    drawingTools.lineDrawingTool,
    drawingTools.longPositionDrawingTool,
    drawingTools.shortPositionDrawingTool,
    drawingTools.fibRetracementDrawingTool,
    activeResizeHandleRefs,
  );
};

export const createDrawings = (
  chart,
  candlestickSeries,
  candleData,
  drawingsData = null, // Now optional - will use store data by default
  setBoxesData = null,
  setLinesData = null,
  setLongPositionsData = null,
  setShortPositionsData = null,
  setFibRetracementsData = null,
  rectangleDrawingTool = null,
  lineDrawingTool = null,
  longPositionDrawingTool = null,
  shortPositionDrawingTool = null,
  fibRetracementDrawingTool = null,
  activeResizeHandleRefs = {},
) => {
  if (!chart || !candlestickSeries || !candleData || candleData.length === 0)
    return;

  // Get current ticker from Zustand store
  const currentTicker = useChartStore.getState().ticker;

  if (!currentTicker) return;

  // Get drawings data from store if not provided
  const dataToUse =
    drawingsData ||
    useDrawingsStore.getState().getDrawingsByTicker(currentTicker);

  // Filter drawings to only include those for the current ticker
  const tickerDrawings = dataToUse.filter(
    (drawing) => drawing.ticker === currentTicker.replace("/", ""),
  );

  // Map over the filtered drawings and create each shape based on its type
  tickerDrawings.forEach((drawingData) => {
    // Resolve position objects to actual times based on current timeframe candle data
    const resolvedDrawingData = resolveDrawingPositions(
      drawingData,
      candleData,
    );

    // Skip drawing if resolution failed (candle data not available)
    if (resolvedDrawingData === null) {
      return;
    }

    // Pass through the server-provided id if it exists
    if (drawingData.id) {
      resolvedDrawingData.id = drawingData.id;
    }

    const basicProps = [
      chart,
      candlestickSeries,
      candleData,
      resolvedDrawingData,
    ];
    switch (drawingData.type) {
      case "rectangle":
        createRectangle(
          ...basicProps,
          setBoxesData,
          rectangleDrawingTool,
          activeResizeHandleRefs.rectangle,
        );
        break;
      case "line":
        createLine(
          ...basicProps,
          setLinesData,
          lineDrawingTool,
          activeResizeHandleRefs.line,
        );
        break;
      case "long_position":
        createLongPosition(
          ...basicProps,
          setLongPositionsData,
          longPositionDrawingTool,
          activeResizeHandleRefs.long_position,
        );
        break;
      case "short_position":
        createShortPosition(
          ...basicProps,
          setShortPositionsData,
          shortPositionDrawingTool,
          activeResizeHandleRefs.short_position,
        );
        break;
      case "fib_retracement":
        createFibRetracement(
          ...basicProps,
          setFibRetracementsData,
          fibRetracementDrawingTool,
          activeResizeHandleRefs.fib_retracement,
        );
        break;
      default:
        console.warn(`Unknown drawing type: ${drawingData.type}`);
    }
  });
};
