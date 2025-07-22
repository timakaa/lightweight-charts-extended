import { useState, useEffect, useRef } from "react";
import { useCandlestickData } from "./useCandlestickData";
import { useChartStore } from "../store/chart";
import { useSeriesManagement } from "./useSeriesManagement";
import { useDataAccumulation } from "./useDataAccumulation";
import { useRealtimeUpdates } from "./useRealtimeUpdates";
import { useDataProcessing } from "./useDataProcessing";
import { useChartFitting } from "./useChartFitting";
import { usePagination } from "./usePagination";
import { useParams } from "react-router-dom";

// Main hook that orchestrates everything
export const useCandlestickSeries = (chart) => {
  const symbol = useChartStore((s) => s.ticker);
  const timeframe = useChartStore((s) => s.timeframe);
  const { backtestId } = useParams();
  const pageSize = 1000;
  const [page, setPage] = useState(1);

  const loadMorePromiseRef = useRef(null);
  const prevDataLengthRef = useRef(0);
  const isLoadingMoreRef = useRef(false);

  const { data, isLoading, error } = useCandlestickData(symbol, {
    timeframe,
    page,
    pageSize,
    backtestId,
    enabled: !!chart && !!symbol,
  });

  // Initialize series management
  const series = useSeriesManagement(chart, symbol, timeframe);

  // Handle data accumulation
  const [accumulatedCandles, setAccumulatedCandles] = useDataAccumulation(
    data,
    symbol,
    timeframe,
    page,
    backtestId,
  );

  // Handle real-time updates
  useRealtimeUpdates(symbol, timeframe, isLoading, setAccumulatedCandles);

  // Process data (combine real candles with whitespace)
  const combinedData = useDataProcessing(accumulatedCandles);

  // Handle chart fitting
  useChartFitting(series, combinedData, chart, symbol, timeframe);

  // Resolve loadMore promise when data is loaded, processed, and chart is updated
  useEffect(() => {
    if (
      !isLoading &&
      loadMorePromiseRef.current &&
      combinedData?.length > 0 &&
      series &&
      combinedData.length > prevDataLengthRef.current
    ) {
      // Use double requestAnimationFrame to ensure chart has been fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (loadMorePromiseRef.current) {
            loadMorePromiseRef.current.resolve();
            loadMorePromiseRef.current = null;
            isLoadingMoreRef.current = false;
            prevDataLengthRef.current = combinedData.length;
          }
        });
      });
    } else if (combinedData?.length > 0) {
      // Update the previous length even if we're not resolving a promise
      prevDataLengthRef.current = combinedData.length;
    }
  }, [isLoading, combinedData, series]);

  // Handle pagination
  usePagination(chart, series, isLoading, data, setPage);

  // Reset page on symbol/timeframe/backtestId change
  useEffect(() => {
    setPage(1);
    prevDataLengthRef.current = 0;
    isLoadingMoreRef.current = false;
    // Clear any pending loadMore promise
    if (loadMorePromiseRef.current) {
      loadMorePromiseRef.current.resolve();
      loadMorePromiseRef.current = null;
    }
  }, [symbol, timeframe, backtestId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isLoadingMoreRef.current = false;
      if (loadMorePromiseRef.current) {
        loadMorePromiseRef.current.resolve();
        loadMorePromiseRef.current = null;
      }
    };
  }, []);

  return [
    series,
    combinedData,
    {
      isLoading,
      error,
      pagination: data?.pagination,
      loadMore: () => {
        return new Promise((resolve, reject) => {
          // If there's already a pending request, resolve immediately
          if (isLoadingMoreRef.current || isLoading) {
            resolve();
            return;
          }

          if (data?.pagination?.has_next) {
            isLoadingMoreRef.current = true;

            // Store the promise resolver to be called when data loads
            loadMorePromiseRef.current = { resolve, reject };

            // Trigger the page increment
            setPage((p) => p + 1);
          } else {
            // Can't load more data, resolve immediately
            resolve();
          }
        });
      },
    },
  ];
};
