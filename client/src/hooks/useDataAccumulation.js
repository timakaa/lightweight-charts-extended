import { useState, useEffect, useRef } from "react";

export const useDataAccumulation = (data, symbol, timeframe, page) => {
  const [accumulatedCandles, setAccumulatedCandles] = useState([]);
  const lastAccumKeyRef = useRef({ symbol: null, timeframe: null });

  useEffect(() => {
    // Reset on symbol/timeframe change
    if (
      lastAccumKeyRef.current.symbol !== symbol ||
      lastAccumKeyRef.current.timeframe !== timeframe
    ) {
      setAccumulatedCandles([]);
      lastAccumKeyRef.current = { symbol, timeframe };
    }

    if (!data || !data.candles) return;

    // Map new candles
    const newCandles = data.candles
      .map((candle) => ({
        time: Math.floor(candle[0] / 1000),
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
      }))
      .sort((a, b) => a.time - b.time);

    // Merge and deduplicate by time
    setAccumulatedCandles((prev) => {
      const prevTimes = new Set(prev.map((c) => c.time));
      const newUniqueCandles = newCandles.filter((c) => !prevTimes.has(c.time));
      const merged = [...newUniqueCandles, ...prev];
      const sorted = merged.sort((a, b) => a.time - b.time);

      console.log("Data accumulation:", {
        page,
        newCandlesCount: newCandles.length,
        newUniqueCandlesCount: newUniqueCandles.length,
        previousCount: prev.length,
        totalCount: sorted.length,
        newCandlesTimeRange:
          newCandles.length > 0
            ? {
                from: new Date(newCandles[0].time * 1000).toISOString(),
                to: new Date(
                  newCandles[newCandles.length - 1].time * 1000,
                ).toISOString(),
              }
            : null,
      });

      return sorted;
    });
  }, [data, symbol, timeframe, page]);

  return [accumulatedCandles, setAccumulatedCandles];
};
