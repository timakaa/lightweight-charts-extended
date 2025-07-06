import { useLayoutEffect, useRef } from "react";
import { fitChartToRecentBars } from "../helpers/fitChartToRecentBars";

export const useChartFitting = (
  series,
  combinedData,
  chart,
  symbol,
  timeframe,
) => {
  const fitDoneRef = useRef({ symbol: null, timeframe: null, done: false });
  const prevSymbolRef = useRef();
  const prevTimeframeRef = useRef();

  useLayoutEffect(() => {
    if (!series || !combinedData.length || !chart) return;

    series.setData(combinedData);
    const barsToShow = 200;
    const realCandles = combinedData.filter((c) => c.open !== undefined);

    if (
      fitDoneRef.current.symbol !== symbol ||
      fitDoneRef.current.timeframe !== timeframe
    ) {
      fitDoneRef.current = { symbol, timeframe, done: false };
    }

    if (!fitDoneRef.current.done && realCandles.length >= barsToShow) {
      requestAnimationFrame(() => {
        fitChartToRecentBars(chart, series, combinedData, barsToShow, 10);
        fitDoneRef.current.done = true;
        prevSymbolRef.current = symbol;
        prevTimeframeRef.current = timeframe;
      });
    }
  }, [series, combinedData, chart, symbol, timeframe]);
};
