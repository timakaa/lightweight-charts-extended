import { useState, useCallback, useRef } from "react";
import { navigateToTradeDate } from "../helpers/navigateToTradeDate";

export const useTradeNavigation = (chart, candleData, chartDataInfo) => {
  // Create a ref to always get the latest candleData
  const candleDataRef = useRef(candleData);
  candleDataRef.current = candleData;
  const [isLoadingForTrade, setIsLoadingForTrade] = useState(false);
  const [loadingTradeId, setLoadingTradeId] = useState(null);

  const findTradeInData = useCallback((tradeEntryTime, candleData) => {
    if (!candleData || !candleData.length || !tradeEntryTime) {
      return false;
    }

    const targetTime =
      typeof tradeEntryTime === "string"
        ? new Date(tradeEntryTime).getTime() / 1000
        : tradeEntryTime;

    // Sort candles by time ascending
    const sortedCandles = [...candleData].sort((a, b) => a.time - b.time);

    // Check if we have data that covers the trade time
    const firstTime = sortedCandles[0]?.time;
    const lastTime = sortedCandles[sortedCandles.length - 1]?.time;

    return targetTime >= firstTime && targetTime <= lastTime;
  }, []);

  const navigateToTrade = useCallback(
    async (trade, onLoadMore) => {
      if (!chart || !candleDataRef.current || !trade.entry_time) {
        return;
      }

      const tradeId = trade.id || `${trade.entry_time}-${trade.symbol}`;

      // Check if trade is already in current data
      const currentCandleData = candleDataRef.current;
      if (findTradeInData(trade.entry_time, currentCandleData)) {
        navigateToTradeDate(chart, currentCandleData, trade.entry_time);
        return;
      }

      // If we don't have pagination info or can't load more, just try with current data
      if (!chartDataInfo?.pagination?.has_next || !onLoadMore) {
        navigateToTradeDate(chart, currentCandleData, trade.entry_time);
        return;
      }

      // Start loading more data
      setIsLoadingForTrade(true);
      setLoadingTradeId(tradeId);

      // Load more data and check again
      const checkAndLoad = async (attempts = 0) => {
        const maxAttempts = 20; // Prevent infinite loading

        if (attempts >= maxAttempts) {
          navigateToTradeDate(chart, candleDataRef.current, trade.entry_time);
          setIsLoadingForTrade(false);
          setLoadingTradeId(null);
          return;
        }

        // Check if we can load more data
        if (!chartDataInfo?.pagination?.has_next) {
          navigateToTradeDate(chart, candleDataRef.current, trade.entry_time);
          setIsLoadingForTrade(false);
          setLoadingTradeId(null);
          return;
        }

        try {
          // If onLoadMore returns a promise, wait for it
          const result = onLoadMore();
          if (result && typeof result.then === "function") {
            await result;
          }

          // Use ref to get the latest candleData after loading
          const currentCandleData = candleDataRef.current;

          // Re-check with potentially updated data
          if (findTradeInData(trade.entry_time, currentCandleData)) {
            navigateToTradeDate(chart, currentCandleData, trade.entry_time);
            setIsLoadingForTrade(false);
            setLoadingTradeId(null);
          } else {
            checkAndLoad(attempts + 1);
          }
        } catch (error) {
          console.error(
            `Error loading data on attempt ${attempts + 1}:`,
            error,
          );
          // Continue trying or fallback to current data
          navigateToTradeDate(chart, candleDataRef.current, trade.entry_time);
          setIsLoadingForTrade(false);
          setLoadingTradeId(null);
        }
      };

      checkAndLoad();
    },
    [chart, chartDataInfo, findTradeInData],
  );

  return {
    navigateToTrade,
    isLoadingForTrade,
    loadingTradeId,
  };
};
