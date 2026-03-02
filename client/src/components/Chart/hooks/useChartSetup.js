import { useChart } from "@hooks/useChart";
import { useCandlestickSeries } from "@hooks/useCandlestickSeries";
import { useMagnetCrosshair } from "./useMagnetCrosshair";
import { usePriceAxisScroll } from "./usePriceAxisScroll";
import useChartFitHotkey from "./useChartFitHotkey";

export const useChartSetup = (chartContainerRef) => {
  const chart = useChart(chartContainerRef);
  const [candlestickSeries, candleData, chartDataInfo] =
    useCandlestickSeries(chart);

  useMagnetCrosshair(chart);
  usePriceAxisScroll(chart, candlestickSeries);
  useChartFitHotkey(chart, candlestickSeries, candleData);

  return { chart, candlestickSeries, candleData, chartDataInfo };
};
