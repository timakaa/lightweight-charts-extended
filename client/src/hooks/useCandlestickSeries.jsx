import { useState, useEffect } from "react";
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
  );

  // Handle real-time updates
  useRealtimeUpdates(symbol, timeframe, isLoading, setAccumulatedCandles);

  // Process data (combine real candles with whitespace)
  const combinedData = useDataProcessing(accumulatedCandles);

  // Handle chart fitting
  useChartFitting(series, combinedData, chart, symbol, timeframe);

  // Handle pagination
  usePagination(chart, series, isLoading, data, setPage);

  // Reset page on symbol/timeframe change
  useEffect(() => {
    setPage(1);
  }, [symbol, timeframe]);

  return [
    series,
    combinedData,
    { isLoading, error, pagination: data?.pagination },
  ];
};
