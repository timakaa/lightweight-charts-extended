import { useChart } from "@hooks/useChart";
import { useCandlestickSeries } from "@hooks/useCandlestickSeries";
import { useSymbolPrecision } from "@hooks/useSymbolPrecision";
import { useChartStore } from "@store/chart";
import { getPrecisionDecimals } from "@/utils/precisionUtils";
import { useMagnetCrosshair } from "./useMagnetCrosshair";
import { usePriceAxisScroll } from "./usePriceAxisScroll";
import useChartFitHotkey from "./useChartFitHotkey";

export const useChartSetup = (chartContainerRef) => {
  const symbol = useChartStore((s) => s.ticker);

  // Fetch precision data for the symbol (cached, only fetched once)
  const { data: precisionData } = useSymbolPrecision(symbol, {
    enabled: !!symbol,
  });

  const precision = getPrecisionDecimals(precisionData?.price_precision);

  const chart = useChart(chartContainerRef, precision);
  const [candlestickSeries, candleData, chartDataInfo] =
    useCandlestickSeries(chart);

  useMagnetCrosshair(chart);
  usePriceAxisScroll(chart, candlestickSeries);
  useChartFitHotkey(chart, candlestickSeries, candleData);

  return { chart, candlestickSeries, candleData, chartDataInfo };
};
