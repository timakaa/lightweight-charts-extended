/**
 * Coordinate conversion utilities that support both time and logical coordinates
 * Provides fallback to logical coordinates when time coordinates fail
 */

/**
 * Converts time to logical index using available candle data
 * @param {number} time - UNIX timestamp
 * @param {Array} candleData - Array of candle data
 * @returns {number|null} Logical index or null if not found
 */
export function timeToLogicalIndex(time, candleData) {
  if (!candleData || !Array.isArray(candleData) || candleData.length === 0) {
    return null;
  }

  // Find the exact time match first
  const exactIndex = candleData.findIndex((candle) => candle.time === time);
  if (exactIndex !== -1) {
    return exactIndex;
  }

  // If time is before first candle, extrapolate backwards
  if (time < candleData[0].time && candleData.length >= 2) {
    const interval = candleData[1].time - candleData[0].time;
    const diff = candleData[0].time - time;
    const steps = Math.ceil(diff / interval);
    return -steps;
  }

  // If time is after last candle, extrapolate forwards
  if (time > candleData[candleData.length - 1].time && candleData.length >= 2) {
    const interval =
      candleData[candleData.length - 1].time -
      candleData[candleData.length - 2].time;
    const diff = time - candleData[candleData.length - 1].time;
    const steps = Math.ceil(diff / interval);
    return candleData.length - 1 + steps;
  }

  // If time is within data range, find the closest candle before this time
  let closestIndex = -1;
  for (let i = 0; i < candleData.length; i++) {
    if (candleData[i].time <= time) {
      closestIndex = i;
    } else {
      break;
    }
  }

  return closestIndex >= 0 ? closestIndex : null;
}

/**
 * Converts logical index back to time using candle data
 * @param {number} logicalIndex - Logical index (can be negative)
 * @param {Array} candleData - Array of candle data
 * @returns {number|null} UNIX timestamp or null if cannot convert
 */
export function logicalIndexToTime(logicalIndex, candleData) {
  if (!candleData || !Array.isArray(candleData) || candleData.length === 0) {
    return null;
  }

  // Handle positive indices (within data range)
  if (logicalIndex >= 0 && logicalIndex < candleData.length) {
    return candleData[logicalIndex].time;
  }

  // Handle negative indices (before first candle)
  if (logicalIndex < 0 && candleData.length >= 2) {
    // Calculate interval between candles
    const interval = candleData[1].time - candleData[0].time;
    // Extrapolate backwards
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

/**
 * Enhanced coordinate conversion that tries time first, then logical index
 * @param {Object} point - Point with time and optional logicalIndex
 * @param {Object} timeScale - Chart timeScale instance
 * @param {Array} candleData - Array of candle data for fallback conversion
 * @returns {number|null} X coordinate or null if both methods fail
 */
export function getXCoordinate(point, timeScale, candleData) {
  // Priority 1: Always try time coordinate first (let TradingView handle the conversion)
  if (point.time !== undefined && point.time !== null) {
    try {
      const timeCoord = timeScale.timeToCoordinate(point.time);
      if (timeCoord !== null) {
        return timeCoord;
      }
    } catch {
      // If timeToCoordinate fails, fall through to logical coordinate
      console.warn(
        "Time coordinate failed, trying logical coordinate calculation",
      );
    }
  }

  // Priority 2: Use logical coordinate if available (for outside range positions)
  if (point.logicalIndex !== undefined && point.logicalIndex !== null) {
    try {
      const logicalCoord = timeScale.logicalToCoordinate(point.logicalIndex);
      if (logicalCoord !== null) {
        return logicalCoord;
      }
    } catch {
      console.warn("Failed to convert logical coordinate:", point.logicalIndex);
    }
  }

  // Priority 3: Calculate logical coordinate from time if we have candle data
  if (point.time !== undefined && point.time !== null && candleData) {
    const logicalIndex = timeToLogicalIndex(point.time, candleData);
    if (logicalIndex !== null) {
      try {
        const logicalCoord = timeScale.logicalToCoordinate(logicalIndex);
        if (logicalCoord !== null) {
          // Store the calculated logical index for future use
          point.logicalIndex = logicalIndex;
          return logicalCoord;
        }
      } catch {
        console.warn(
          "Failed to convert calculated logical coordinate:",
          logicalIndex,
        );
      }
    }
  }

  return null;
}

/**
 * Enhances a drawing point with logical index if missing
 * @param {Object} point - Point with time and optional logicalIndex
 * @param {Array} candleData - Array of candle data
 * @returns {Object} Enhanced point with both time and logicalIndex
 */
export function enhancePointWithLogicalIndex(point, candleData) {
  if (!point || point.logicalIndex !== undefined) {
    return point; // Already has logical index
  }

  if (point.time !== undefined && candleData) {
    const logicalIndex = timeToLogicalIndex(point.time, candleData);
    if (logicalIndex !== null) {
      return {
        ...point,
        logicalIndex,
      };
    }
  }

  return point;
}
