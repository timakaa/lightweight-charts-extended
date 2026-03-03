import { useState, useEffect, useRef } from "react";
import { CandlestickSeries } from "lightweight-charts";
import { useChartTheme } from "./useChartTheme";
import { hexToRgba } from "@/utils/colorUtils";

export const useSeriesManagement = (chart, symbol, timeframe) => {
  const [series, setSeries] = useState(null);
  const chartMountedRef = useRef(true);
  const { chartTheme } = useChartTheme();

  // Helper function to get opacity (0 if disabled, otherwise the set value)
  const getOpacity = (enabled, opacity) => {
    return enabled ? (opacity ?? 100) : 0;
  };

  // Helper function to get candle colors from chartTheme with opacity
  const getCandleColors = () => {
    const { candles } = chartTheme;

    return {
      upColor: hexToRgba(
        candles.bodyUpColor,
        getOpacity(candles.bodyEnabled, candles.bodyUpOpacity),
      ),
      downColor: hexToRgba(
        candles.bodyDownColor,
        getOpacity(candles.bodyEnabled, candles.bodyDownOpacity),
      ),
      borderUpColor: hexToRgba(
        candles.borderUpColor,
        getOpacity(candles.borderEnabled, candles.borderUpOpacity),
      ),
      borderDownColor: hexToRgba(
        candles.borderDownColor,
        getOpacity(candles.borderEnabled, candles.borderDownOpacity),
      ),
      wickUpColor: hexToRgba(
        candles.wickUpColor,
        getOpacity(candles.wickEnabled, candles.wickUpOpacity),
      ),
      wickDownColor: hexToRgba(
        candles.wickDownColor,
        getOpacity(candles.wickEnabled, candles.wickDownOpacity),
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
