import { useState, useEffect, useRef } from "react";
import { CandlestickSeries } from "lightweight-charts";

export const useSeriesManagement = (chart, symbol, timeframe) => {
  const [series, setSeries] = useState(null);
  const chartMountedRef = useRef(true);

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

    // Create new series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#fff",
      downColor: "#ffffff00",
      borderDownColor: "#5E606B",
      borderUpColor: "#fff",
      wickDownColor: "#5E606B",
      wickUpColor: "#fff",
    });

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

  return series;
};
