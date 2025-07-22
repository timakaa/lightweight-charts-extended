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
      .reverse();

    // Merge and deduplicate by time
    setAccumulatedCandles((prev) => {
      const merged = [...newCandles, ...prev];

      // Remove duplicates by time and sort by time ascending
      const uniqueCandles = new Map();
      merged.forEach((candle) => {
        uniqueCandles.set(candle.time, candle);
      });

      return Array.from(uniqueCandles.values()).sort((a, b) => a.time - b.time);
    });
  }, [data, symbol, timeframe, page, backtestId]);

  return [accumulatedCandles, setAccumulatedCandles];
};
