import { useMemo } from "react";

export const useDataProcessing = (accumulatedCandles) => {
  const combinedData = useMemo(() => {
    const allRealCandles = accumulatedCandles;
    let combined = allRealCandles;

    // Only add whitespace if we have at least 2 candles to determine the interval
    if (allRealCandles.length > 1) {
      const lastTimestamp = allRealCandles[allRealCandles.length - 1].time;
      let interval = allRealCandles[1].time - allRealCandles[0].time;

      // Only add whitespace for timeframes less than a week (to avoid adding too much space for larger timeframes)
      if (interval > 0 && interval < 60 * 60 * 24 * 7) {
        // Add just enough whitespace for about 20% of the visible chart area
        const whitespacePoints = Math.ceil(allRealCandles.length * 0.2);
        const maxPoints = 100; // Cap the maximum number of whitespace points
        const pointsToAdd = Math.min(whitespacePoints, maxPoints);

        const whitespaceData = Array.from({ length: pointsToAdd }, (_, i) => ({
          time: lastTimestamp + (i + 1) * interval,
        }));

        combined = [...allRealCandles, ...whitespaceData];
      }
    }

    return combined;
  }, [accumulatedCandles]);

  return combinedData;
};
