import { useChart } from "../../../hooks/useChart";
import { useCandlestickSeries } from "../../../hooks/useCandlestickSeries";
import { useMagnetCrosshair } from "./useMagnetCrosshair";
import { usePriceAxisScroll } from "./usePriceAxisScroll";
import useChartFitHotkey from "./useChartFitHotkey";
import chartDataUrl from "../../../charts/SOLUSDT-1h-bybit.csv?url";

export const useChartSetup = (chartContainerRef) => {
  const chart = useChart(chartContainerRef);
  const [candlestickSeries, candleData, chartDataInfo] = useCandlestickSeries(
    chart,
    chartDataUrl,
  );

  useMagnetCrosshair(chart);
  usePriceAxisScroll(chart, candlestickSeries);
  useChartFitHotkey(chart, candlestickSeries, candleData);

  return { chart, candlestickSeries, candleData, chartDataInfo };
};
