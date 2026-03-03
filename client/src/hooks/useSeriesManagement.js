import { useState, useEffect, useRef } from "react";
import { CandlestickSeries } from "lightweight-charts";
import { useChartTheme } from "./useChartTheme";
import { hexToRgba } from "@/utils/colorUtils";

export const useSeriesManagement = (chart, symbol, timeframe) => {
  const [series, setSeries] = useState(null);
  const chartMountedRef = useRef(true);
  const { chartTheme } = useChartTheme();

  // Helper function to get candle colors from chartTheme with opacity
  const getCandleColors = () => {
    const bodyUpOpacity = chartTheme.candles.bodyUpOpacity ?? 100;
    const bodyDownOpacity = chartTheme.candles.bodyDownOpacity ?? 100;
    const borderUpOpacity = chartTheme.candles.borderUpOpacity ?? 100;
    const borderDownOpacity = chartTheme.candles.borderDownOpacity ?? 100;
    const wickUpOpacity = chartTheme.candles.wickUpOpacity ?? 100;
    const wickDownOpacity = chartTheme.candles.wickDownOpacity ?? 100;

    return {
      upColor: hexToRgba(chartTheme.candles.bodyUpColor, bodyUpOpacity),
      downColor: hexToRgba(chartTheme.candles.bodyDownColor, bodyDownOpacity),
      borderUpColor: hexToRgba(
        chartTheme.candles.borderUpColor,
        borderUpOpacity,
      ),
      borderDownColor: hexToRgba(
        chartTheme.candles.borderDownColor,
        borderDownOpacity,
      ),
      wickUpColor: hexToRgba(chartTheme.candles.wickUpColor, wickUpOpacity),
      wickDownColor: hexToRgba(
        chartTheme.candles.wickDownColor,
        wickDownOpacity,
      ),
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
