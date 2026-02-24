import { useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelectedLineStore } from "@store/selectedLine";
import { useSelectedBoxStore } from "@store/selectedBox";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import TimeframeModal from "./components/TimeframeModal";
import TickerModal from "./components/TickerModal";
import { useTimeframeModal } from "./hooks/useTimeframeModal";
import { useTickerModal } from "./hooks/useTickerModal";
import { fitChartToRecentBars } from "@helpers/fitChartToRecentBars";
import { useChartSetup } from "./hooks/useChartSetup";
import { useDrawingTools } from "./hooks/useDrawingTools";
import { useDrawingSync } from "./hooks/useDrawingSync";
import ChartContainer from "./components/ChartContainer";

const TradingChart = ({ drawings }) => {
  const chartContainerRef = useRef();
  const { backtestId } = useParams();

  const { chart, candlestickSeries, candleData, chartDataInfo } =
    useChartSetup(chartContainerRef);

  const drawingTools = useDrawingTools(chart, candlestickSeries, candleData);
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
  });

  useEffect(() => {
    if (backtestId) {
      fitChartToRecentBars(chart, candlestickSeries, candleData);
    }
  }, [backtestId, chart, candlestickSeries, candleData]);

  const selectedLineId = useSelectedLineStore((s) => s.selectedLineId);
  const selectedBoxId = useSelectedBoxStore((s) => s.selectedBoxId);

  const timeframeModal = useTimeframeModal();
  const tickerModal = useTickerModal();

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
    <>
      <div className='h-screen flex flex-col bg-black'>
        <TopBar onOpenTickerModal={tickerModal.openModal} />
        <div className='flex h-full'>
          <Sidebar
            deleteAllLines={lineDrawing.deleteAllLines}
            deleteAllBoxes={boxDrawing.deleteAllBoxes}
            deleteAllLongPositions={longPositionDrawing.deleteAllLongPositions}
            deleteAllShortPositions={
              shortPositionDrawing.deleteAllShortPositions
            }
            deleteAllFibRetracements={
              fibRetracementDrawing.deleteAllFibRetracements
            }
          />
          <ChartContainer
            chartContainerRef={chartContainerRef}
            chart={chart}
            candleData={candleData}
            chartDataInfo={chartDataInfo}
            hasSelectedDrawing={hasSelectedDrawing}
            onDeleteSelected={handleDeleteSelected}
          />
        </div>
      </div>
      <TimeframeModal
        isOpen={timeframeModal.isModalOpen}
        inputValue={timeframeModal.inputValue}
        isValid={timeframeModal.isValid}
        onClose={timeframeModal.closeModal}
        onApply={timeframeModal.applyTimeframe}
        onInputChange={timeframeModal.handleInputChange}
        getPreviewTimeframe={timeframeModal.getPreviewTimeframe}
      />
      <TickerModal
        isOpen={tickerModal.isModalOpen}
        initialLetter={tickerModal.initialLetter}
        onClose={tickerModal.closeModal}
        onSelectTicker={tickerModal.handleTickerSelect}
      />
    </>
  );
};

export default TradingChart;
