import { useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useChartStore } from "@store/chart";
import { useSelectedLineStore } from "@store/selectedLine";
import { useSelectedBoxStore } from "@store/selectedBox";
import { fitChartToRecentBars } from "@helpers/fitChartToRecentBars";
import { useChartSetup } from "./hooks/useChartSetup";
import { useDrawingTools } from "./hooks/useDrawingTools";
import { useDrawingSync } from "./hooks/useDrawingSync";
import ChartContainer from "./components/ChartContainer";

const Chart = ({ drawings, onChartReady, symbol }) => {
  const chartContainerRef = useRef();
  const { backtestId } = useParams();
  const setTicker = useChartStore((s) => s.setTicker);

  // Set the symbol in the store when it changes
  useEffect(() => {
    if (symbol) {
      setTicker(symbol);
    }
  }, [symbol, setTicker]);

  const { chart, candlestickSeries, candleData, chartDataInfo, precision } =
    useChartSetup(chartContainerRef);

  const drawingTools = useDrawingTools(
    chart,
    candlestickSeries,
    candleData,
    precision,
  );
  const {
    lineDrawing,
    boxDrawing,
    longPositionDrawing,
    shortPositionDrawing,
    fibRetracementDrawing,
    activeResizeHandleRefs,
  } = drawingTools;

  useDrawingSync({
    chart,
    candlestickSeries,
    candleData,
    drawings,
    drawingTools,
    activeResizeHandleRefs,
    precision,
  });

  useEffect(() => {
    if (backtestId && chart && candlestickSeries && candleData?.length > 0) {
      fitChartToRecentBars(chart, candlestickSeries, candleData);
    }
    // Only run on mount or when backtestId changes, not when candleData updates
  }, [backtestId]);

  // Notify parent when chart is ready (only once)
  const hasNotifiedRef = useRef(false);
  useEffect(() => {
    if (
      chart &&
      candlestickSeries &&
      candleData &&
      onChartReady &&
      !hasNotifiedRef.current
    ) {
      hasNotifiedRef.current = true;
      onChartReady({
        chart,
        candleData,
        chartDataInfo,
        drawingTools: {
          deleteAllLines: lineDrawing.deleteAllLines,
          deleteAllBoxes: boxDrawing.deleteAllBoxes,
          deleteAllLongPositions: longPositionDrawing.deleteAllLongPositions,
          deleteAllShortPositions: shortPositionDrawing.deleteAllShortPositions,
          deleteAllFibRetracements:
            fibRetracementDrawing.deleteAllFibRetracements,
        },
      });
    }
  }, [chart, candlestickSeries, candleData]);

  const selectedLineId = useSelectedLineStore((s) => s.selectedLineId);
  const selectedBoxId = useSelectedBoxStore((s) => s.selectedBoxId);

  const handleDeleteSelected = () => {
    if (selectedLineId) lineDrawing.deleteSelectedLine();
    if (selectedBoxId) boxDrawing.deleteSelectedBox();
    if (longPositionDrawing.selectedLongPositionId)
      longPositionDrawing.deleteSelectedLongPosition();
    if (shortPositionDrawing.selectedShortPositionId)
      shortPositionDrawing.deleteSelectedShortPosition();
    if (fibRetracementDrawing.selectedFibRetracementId)
      fibRetracementDrawing.deleteSelectedFibRetracement();
  };

  const hasSelectedDrawing =
    selectedLineId ||
    selectedBoxId ||
    longPositionDrawing.selectedLongPositionId ||
    shortPositionDrawing.selectedShortPositionId ||
    fibRetracementDrawing.selectedFibRetracementId;

  return (
    <ChartContainer
      chartContainerRef={chartContainerRef}
      hasSelectedDrawing={hasSelectedDrawing}
      onDeleteSelected={handleDeleteSelected}
    />
  );
};

export default Chart;
