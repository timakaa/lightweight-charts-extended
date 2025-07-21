import { useState, useEffect, useRef } from "react";

export const useDataAccumulation = (
  data,
  symbol,
  timeframe,
  page,
  backtestId,
) => {
  const [accumulatedCandles, setAccumulatedCandles] = useState([]);
  const lastAccumKeyRef = useRef({
    symbol: null,
    timeframe: null,
    backtestId: null,
  });

  useEffect(() => {
    // Reset on symbol/timeframe/backtestId change
    if (
      lastAccumKeyRef.current.symbol !== symbol ||
      lastAccumKeyRef.current.timeframe !== timeframe ||
      lastAccumKeyRef.current.backtestId !== backtestId
    ) {
      setAccumulatedCandles([]);
      lastAccumKeyRef.current = { symbol, timeframe, backtestId };
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

      // Only add new candles if we actually have new data
      if (newUniqueCandles.length === 0) {
        return prev;
      }

      const merged = [...prev, ...newUniqueCandles];
      const sorted = merged.sort((a, b) => a.time - b.time);

      return sorted;
    });
  }, [data, symbol, timeframe, page, backtestId]);

  return [accumulatedCandles, setAccumulatedCandles];
};
