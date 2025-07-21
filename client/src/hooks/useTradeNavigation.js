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
      console.log("findTradeInData: Missing data", {
        hasCandleData: !!candleData,
        candleDataLength: candleData?.length || 0,
        hasTradeEntryTime: !!tradeEntryTime,
      });
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

    console.log("findTradeInData: Time range check", {
      targetTime,
      firstTime,
      lastTime,
      targetDate: new Date(targetTime * 1000).toISOString(),
      firstDate: new Date(firstTime * 1000).toISOString(),
      lastDate: new Date(lastTime * 1000).toISOString(),
      candleCount: sortedCandles.length,
      isInRange: targetTime >= firstTime && targetTime <= lastTime,
    });

    return targetTime >= firstTime && targetTime <= lastTime;
  }, []);

  const navigateToTrade = useCallback(
    async (trade, onLoadMore) => {
      console.log("navigateToTrade called with:", {
        tradeEntryTime: trade.entry_time,
        candleDataLength: candleData?.length || 0,
        hasPagination: !!chartDataInfo?.pagination,
        hasNext: chartDataInfo?.pagination?.has_next,
      });

      if (!chart || !candleDataRef.current || !trade.entry_time) {
        console.log("Cannot navigate - missing requirements");
        return;
      }

      const tradeId = trade.id || `${trade.entry_time}-${trade.symbol}`;

      // Check if trade is already in current data
      const currentCandleData = candleDataRef.current;
      if (findTradeInData(trade.entry_time, currentCandleData)) {
        console.log("Trade found in current data, navigating...");
        navigateToTradeDate(chart, currentCandleData, trade.entry_time);
        return;
      }

      // If we don't have pagination info or can't load more, just try with current data
      if (!chartDataInfo?.pagination?.has_next || !onLoadMore) {
        console.log("No more data to load, trying with current data...");
        navigateToTradeDate(chart, currentCandleData, trade.entry_time);
        return;
      }

      // Start loading more data
      setIsLoadingForTrade(true);
      setLoadingTradeId(tradeId);

      console.log("Trade not found in current data, loading more...");

      // Load more data and check again
      const checkAndLoad = async (attempts = 0) => {
        const maxAttempts = 10; // Prevent infinite loading

        if (attempts >= maxAttempts) {
          console.log(
            "Max loading attempts reached, navigating with available data...",
          );
          navigateToTradeDate(chart, candleDataRef.current, trade.entry_time);
          setIsLoadingForTrade(false);
          setLoadingTradeId(null);
          return;
        }

        // Check if we can load more data
        if (!chartDataInfo?.pagination?.has_next) {
          console.log(
            "No more data available, navigating with current data...",
          );
          navigateToTradeDate(chart, candleDataRef.current, trade.entry_time);
          setIsLoadingForTrade(false);
          setLoadingTradeId(null);
          return;
        }

        // Trigger loading more data
        console.log(`Loading more data (attempt ${attempts + 1})...`);

        try {
          // If onLoadMore returns a promise, wait for it
          const result = onLoadMore();
          if (result && typeof result.then === "function") {
            await result;
          }

          // Use ref to get the latest candleData after loading
          const currentCandleData = candleDataRef.current;
          console.log(
            `Checking attempt ${attempts + 1} with ${
              currentCandleData?.length || 0
            } candles`,
          );

          // Re-check with potentially updated data
          if (findTradeInData(trade.entry_time, currentCandleData)) {
            console.log(
              `Trade found after ${attempts + 1} attempts, navigating...`,
            );
            navigateToTradeDate(chart, currentCandleData, trade.entry_time);
            setIsLoadingForTrade(false);
            setLoadingTradeId(null);
          } else {
            console.log(`Attempt ${attempts + 1} failed, trying again...`);
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
    [chart, candleData, chartDataInfo, findTradeInData],
  );

  return {
    navigateToTrade,
    isLoadingForTrade,
    loadingTradeId,
  };
};
