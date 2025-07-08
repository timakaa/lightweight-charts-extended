import { useChartSocket } from "./useChartSocket";
import { getSymbol } from "../helpers/symbol";

export const useRealtimeUpdates = (
  symbol,
  timeframe,
  isLoading,
  setAccumulatedCandles,
) => {
  useChartSocket({
    symbol: getSymbol(symbol),
    interval: timeframe,
    onCandle: (wsKline) => {
      if (isLoading) return; // Don't process real-time updates while loading paginated data

      // Normalize the WebSocket kline to match app's candle format
      const newCandle = {
        time: Math.floor(wsKline.start / 1000), // Convert ms to seconds
        open: parseFloat(wsKline.open),
        high: parseFloat(wsKline.high),
        low: parseFloat(wsKline.low),
        close: parseFloat(wsKline.close),
      };

      setAccumulatedCandles((prev) => {
        // Find the last REAL candle, ignoring any whitespace candles
        const realPrev = prev.filter((c) => c.open !== undefined);
        if (!realPrev.length) {
          return [newCandle];
        }

        const lastCandle = realPrev[realPrev.length - 1];

        // Compare timestamps (both are in seconds)
        if (newCandle.time === lastCandle.time) {
          // Update the last candle
          return [...realPrev.slice(0, -1), newCandle];
        } else if (newCandle.time > lastCandle.time) {
          // Append new candle
          return [...realPrev, newCandle];
        } else {
          // Ignore out-of-order or duplicate candle
          return realPrev;
        }
      });
    },
  });
};
