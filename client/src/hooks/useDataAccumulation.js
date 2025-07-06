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
      const merged = [
        ...newCandles.filter((c) => !prevTimes.has(c.time)),
        ...prev,
      ];
      return merged.sort((a, b) => a.time - b.time);
    });
  }, [data, symbol, timeframe, page]);

  return [accumulatedCandles, setAccumulatedCandles];
};
