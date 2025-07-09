// time.js - Shared time conversion helper

/**
 * Converts an ISO string or UNIX timestamp to UNIX seconds (number),
 * or returns 'relative' if the input is the string 'relative'.
 * @param {string|number} time - ISO string, UNIX timestamp (seconds), or 'relative'
 * @returns {number|string} UNIX timestamp in seconds or 'relative'
 */
export function toUnixSeconds(time) {
  if (time === "relative") return "relative";
  if (typeof time === "string") {
    return Math.floor(new Date(time).getTime() / 1000);
  }
  return time;
}

/**
 * Checks if a specific time exists as an actual candle in the data
 * @param {number} targetTime - Target time in UNIX seconds
 * @param {Array} candleData - Array of candle data
 * @returns {boolean} True if the exact time exists as a real candle
 */
export function isCandleAvailable(targetTime, candleData) {
  if (!candleData || candleData.length === 0) return false;

  // Check if there's an exact match for a real candle (has open property)
  return candleData.some(
    (candle) => candle.time === targetTime && candle.open !== undefined,
  );
}

/**
 * Finds the nearest available candle for a given time, only within available data range
 * Returns null if target time is outside the available data range
 * @param {number} targetTime - Target time in UNIX seconds
 * @param {Array} candleData - Array of candle data sorted by time
 * @returns {number|null} The time of the nearest candle or null if not available
 */
export function findNearestCandleTime(targetTime, candleData) {
  if (!candleData || candleData.length === 0) return null;

  // Filter to only real candles (with open property) and sort by time
  const realCandles = candleData
    .filter((candle) => candle.open !== undefined)
    .sort((a, b) => a.time - b.time);

  if (realCandles.length === 0) return null;

  const earliestCandle = realCandles[0];
  const latestCandle = realCandles[realCandles.length - 1];

  // If target time is outside available data range, return null
  if (targetTime < earliestCandle.time || targetTime > latestCandle.time) {
    return null;
  }

  // Find the candle at or before the target time (Math.floor behavior)
  let nearestCandle = null;
  for (let i = 0; i < realCandles.length; i++) {
    if (realCandles[i].time <= targetTime) {
      nearestCandle = realCandles[i];
    } else {
      break;
    }
  }

  return nearestCandle ? nearestCandle.time : null;
}

/**
 * Resolves a target time using hybrid coordinate system - works anywhere on timeline
 * Uses extrapolation for positions outside candle range, similar to drawing tools
 * @param {number} targetTime - Target time in UNIX seconds
 * @param {Array} candleData - Array of candle data sorted by time
 * @returns {number|null} The resolved time or null if insufficient data
 */
export function resolveTimeWithHybridCoordinates(targetTime, candleData) {
  if (!candleData || candleData.length === 0) return null;

  // Filter to only real candles (with open property) and sort by time
  const realCandles = candleData
    .filter((candle) => candle.open !== undefined)
    .sort((a, b) => a.time - b.time);

  if (realCandles.length < 2) return null; // Need at least 2 candles for extrapolation

  const earliestCandle = realCandles[0];
  const latestCandle = realCandles[realCandles.length - 1];

  // Case 1: Exact match within candle data
  const exactMatch = realCandles.find((candle) => candle.time === targetTime);
  if (exactMatch) {
    return targetTime;
  }

  // Case 2: Within candle data range - find nearest
  if (targetTime >= earliestCandle.time && targetTime <= latestCandle.time) {
    // Find the candle at or before the target time
    let nearestCandle = null;
    for (let i = 0; i < realCandles.length; i++) {
      if (realCandles[i].time <= targetTime) {
        nearestCandle = realCandles[i];
      } else {
        break;
      }
    }
    return nearestCandle ? nearestCandle.time : targetTime;
  }

  // Case 3: Outside candle data range - use hybrid coordinate extrapolation
  // The hybrid coordinate system will handle the positioning automatically
  if (targetTime < earliestCandle.time) {
    // Before first candle - return the target time, hybrid coordinates will extrapolate
    return targetTime;
  } else {
    // After last candle - return the target time, hybrid coordinates will extrapolate
    return targetTime;
  }
}

/**
 * Enhanced time resolution function that uses hybrid coordinates for drawings
 * Replaces findNearestCandleTime for drawing creation to support positions outside candle range
 * @param {number} targetTime - Target time in UNIX seconds
 * @param {Array} candleData - Array of candle data sorted by time
 * @returns {number|null} The resolved time for drawing placement
 */
export function resolveDrawingTime(targetTime, candleData) {
  // Use hybrid coordinate resolution instead of limiting to candle range
  return resolveTimeWithHybridCoordinates(targetTime, candleData);
}

/**
 * Calculates a relative end time (latest candle + 10 candles forward)
 * @param {Array} candleData - Array of candle data sorted by time
 * @returns {number|null} The resolved time or null if insufficient data
 */
export const resolveRelativeEndTime = (candleData) => {
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
