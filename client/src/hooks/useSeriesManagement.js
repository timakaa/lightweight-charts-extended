import { useState, useEffect, useRef } from "react";
import { CandlestickSeries } from "lightweight-charts";
import { useTheme } from "./useTheme";

export const useSeriesManagement = (chart, symbol, timeframe) => {
  const [series, setSeries] = useState(null);
  const chartMountedRef = useRef(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Helper function to get theme-based colors
  const getColors = (isDark) => {
    return isDark
      ? {
          // Dark theme - white/gray
          upColor: "#fff",
          downColor: "#ffffff00",
          borderDownColor: "#5E606B",
          borderUpColor: "#fff",
          wickDownColor: "#5E606B",
          wickUpColor: "#fff",
        }
      : {
          // Light theme - green/red
          upColor: "#26a69a",
          downColor: "#ef5350",
          borderDownColor: "#ef5350",
          borderUpColor: "#26a69a",
          wickDownColor: "#ef5350",
          wickUpColor: "#26a69a",
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
      getColors(isDark),
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

  // Effect 2: Update colors when theme changes (without recreating series)
  useEffect(() => {
    if (!series) return;

    try {
      series.applyOptions(getColors(isDark));
    } catch {
      // Ignore if series was removed
    }
  }, [isDark, series]);

  return series;
};
