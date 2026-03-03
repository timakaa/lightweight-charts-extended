import { useState, useEffect, useRef } from "react";
import { CandlestickSeries } from "lightweight-charts";
import { useChartTheme } from "./useChartTheme";

export const useSeriesManagement = (chart, symbol, timeframe) => {
  const [series, setSeries] = useState(null);
  const chartMountedRef = useRef(true);
  const { chartTheme } = useChartTheme();

  // Helper function to get candle colors from chartTheme
  const getCandleColors = () => {
    return {
      upColor: chartTheme.candles.bodyUpColor,
      downColor: chartTheme.candles.bodyDownColor,
      borderUpColor: chartTheme.candles.borderUpColor,
      borderDownColor: chartTheme.candles.borderDownColor,
      wickUpColor: chartTheme.candles.wickUpColor,
      wickDownColor: chartTheme.candles.wickDownColor,
    };
  };

  // Effect 1: Create/recreate series only when chart, symbol, or timeframe changes
  useEffect(() => {
    chartMountedRef.current = true;
    if (!chart) return;

    // Remove existing series
    if (series) {
      try {
        chart.removeSeries(series);
      } catch {
        // Ignore errors if already removed
      }
      setSeries(null);
    }

    // Create new series with current theme colors
    const candlestickSeries = chart.addSeries(
      CandlestickSeries,
      getCandleColors(),
    );

    setSeries(candlestickSeries);

    return () => {
      chartMountedRef.current = false;
      if (chart && candlestickSeries) {
        try {
          chart.removeSeries(candlestickSeries);
        } catch {
          // Ignore errors if already removed
        }
      }
    };
  }, [chart, symbol, timeframe]);

  // Effect 2: Update colors when chartTheme changes (without recreating series)
  useEffect(() => {
    if (!series) return;

    try {
      series.applyOptions(getCandleColors());
    } catch {
      // Ignore if series was removed
    }
  }, [chartTheme.candles, series]);

  return series;
};
