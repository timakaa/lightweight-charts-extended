import { useEffect } from "react";
import { fitChartToRecentBars } from "../helpers/fitChartToRecentBars";

export default function useChartFitHotkey(
  chart,
  series,
  candleData,
  barsToShow = 200,
) {
  useEffect(() => {
    function handleKeyDown(e) {
      // Option+R (Alt+R) or Ctrl+R, but NOT Command (Meta)+R
      const isR = e.key.toLowerCase() === "r" || e.key === "®";
      if ((e.ctrlKey || e.altKey) && !e.metaKey && isR) {
        e.preventDefault();
        fitChartToRecentBars(chart, series, candleData, barsToShow);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chart, series, candleData, barsToShow]);
}
