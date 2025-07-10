import { useRef, useMemo } from "react";
import chartDataUrl from "../charts/SOLUSDT-1h-bybit.csv?url";
import { useChart } from "../hooks/useChart";
import { useCandlestickSeries } from "../hooks/useCandlestickSeries";
import { useLineDrawing } from "../hooks/useLineDrawing";
import { useBoxDrawing } from "../hooks/useBoxDrawing";
import { useSelectedLineStore } from "../store/selectedLine";
import { useSelectedBoxStore } from "../store/selectedBox";
import Sidebar from "./Sidebar";
import { useMagnetCrosshair } from "../hooks/useMagnetCrosshair";
import { useRulerDrawing } from "../hooks/useRulerDrawing";
import useCrosshairToRuler from "../hooks/useCrosshairToRuler";
import { useToolStore } from "../store/tool";
import { useLongPositionDrawing } from "../hooks/useLongPositionDrawing";
import { useShortPositionDrawing } from "../hooks/useShortPositionDrawing";
import useFibRetracementDrawing from "../hooks/useFibRetracementDrawing";
import { useCreateDrawings } from "../hooks/useCreateDrawings";
import { usePriceAxisScroll } from "../hooks/usePriceAxisScroll";
import TopBar from "./TopBar";
import Trash from "./icons/Trash";
import useChartFitHotkey from "../hooks/useChartFitHotkey";
import { useTimeframeModal } from "../hooks/useTimeframeModal";
import TimeframeModal from "./TimeframeModal";
import { useTickerModal } from "../hooks/useTickerModal";
import { useChartDrawingSocket } from "../hooks/chart-drawing-socket";
import { useChartStore } from "../store/chart";
import { useUndeliveredDrawings } from "../hooks/useUndeliveredDrawings";
import { getSymbol } from "../helpers/symbol";
import TickerModal from "./TickerModal";
import Trades from "./Trades";
import { useLocation } from "react-router-dom";

const TradingChart = () => {
  const chartContainerRef = useRef();
  const { pathname } = useLocation();

  const chart = useChart(chartContainerRef);
  const [candlestickSeries, candleData] = useCandlestickSeries(
    chart,
    chartDataUrl,
  );

  const {
    deleteSelectedLine,
    deleteAllLines,
    lineDrawingTool,
    setLinesData,
    activeResizeHandleRef: lineActiveResizeHandleRef,
  } = useLineDrawing(chart, candlestickSeries, candleData);
  const {
    deleteSelectedBox,
    deleteAllBoxes,
    rectangleDrawingTool,
    setBoxesData,
    activeResizeHandleRef: rectangleActiveResizeHandleRef,
  } = useBoxDrawing(chart, candlestickSeries, candleData);
  const {
    deleteSelectedLongPosition,
    deleteAllLongPositions,
    selectedLongPositionId,
    longPositionDrawingTool,
    setLongPositionsData,
    activeResizeHandleRef: longPositionActiveResizeHandleRef,
  } = useLongPositionDrawing(chart, candlestickSeries, candleData);

  const {
    deleteSelectedShortPosition,
    deleteAllShortPositions,
    selectedShortPositionId,
    shortPositionDrawingTool,
    setShortPositionsData,
    activeResizeHandleRef: shortPositionActiveResizeHandleRef,
  } = useShortPositionDrawing(chart, candlestickSeries, candleData);

  const { rulerDrawingTool } = useRulerDrawing(
    chart,
    candlestickSeries,
    candleData,
  );
  const { setCurrentTool, currentTool } = useToolStore();
  useCrosshairToRuler(
    chart,
    candlestickSeries,
    rulerDrawingTool,
    setCurrentTool,
    currentTool,
    candleData,
  );

  const selectedLineId = useSelectedLineStore((s) => s.selectedLineId);
  const selectedBoxId = useSelectedBoxStore((s) => s.selectedBoxId);

  useMagnetCrosshair(chart);

  // Enable price axis scrolling
  usePriceAxisScroll(chart, candlestickSeries);

  const {
    selectedFibRetracementId,
    deleteAllFibRetracements,
    deleteSelectedFibRetracement,
    fibRetracementDrawingTool,
    setFibRetracementsData,
    activeResizeHandleRef: fibRetracementActiveResizeHandleRef,
  } = useFibRetracementDrawing(
    chart,
    candlestickSeries,
    setCurrentTool,
    currentTool,
    candleData,
  );

  // Create unified activeResizeHandleRefs object for elegant handling
  // Memoize to prevent infinite loops in useCreateDrawings
  const activeResizeHandleRefs = useMemo(
    () => ({
      rectangle: rectangleActiveResizeHandleRef,
      line: lineActiveResizeHandleRef,
      long_position: longPositionActiveResizeHandleRef,
      short_position: shortPositionActiveResizeHandleRef,
      fib_retracement: fibRetracementActiveResizeHandleRef,
    }),
    [
      rectangleActiveResizeHandleRef,
      lineActiveResizeHandleRef,
      longPositionActiveResizeHandleRef,
      shortPositionActiveResizeHandleRef,
      fibRetracementActiveResizeHandleRef,
    ],
  );

  // Create drawings from backend data with hybrid coordinate system support
  useCreateDrawings({
    chart,
    candlestickSeries,
    candleData,
    setBoxesData,
    setLinesData,
    setLongPositionsData,
    setShortPositionsData,
    setFibRetracementsData,
    rectangleDrawingTool,
    lineDrawingTool,
    longPositionDrawingTool,
    shortPositionDrawingTool,
    fibRetracementDrawingTool,
    activeResizeHandleRefs,
  });

  // Fit chart on Option+R or Ctrl+R
  useChartFitHotkey(chart, candlestickSeries, candleData);

  // Timeframe modal for number input
  const {
    isModalOpen,
    inputValue,
    isValid,
    closeModal,
    applyTimeframe,
    handleInputChange,
    getPreviewTimeframe,
  } = useTimeframeModal();

  // Ticker modal for letter input
  const {
    isModalOpen: isTickerModalOpen,
    initialLetter,
    closeModal: closeTickerModal,
    openModal: openTickerModal,
    handleTickerSelect,
  } = useTickerModal();

  // Add drawing socket hook
  const symbol = useChartStore((s) => s.ticker);
  const timeframe = useChartStore((s) => s.timeframe);
  useChartDrawingSocket({
    symbol: getSymbol(symbol),
    interval: timeframe,
    chart,
    candlestickSeries,
    candleData,
    setBoxesData,
    setLinesData,
    setLongPositionsData,
    setShortPositionsData,
    setFibRetracementsData,
    rectangleDrawingTool,
    lineDrawingTool,
    longPositionDrawingTool,
    shortPositionDrawingTool,
    fibRetracementDrawingTool,
    activeResizeHandleRefs,
  });

  // Load undelivered drawings on mount
  useUndeliveredDrawings();

  const handleDeleteSelected = () => {
    if (selectedLineId) {
      deleteSelectedLine();
    }
    if (selectedBoxId) {
      deleteSelectedBox();
    }
    if (selectedLongPositionId) {
      deleteSelectedLongPosition();
    }
    if (selectedShortPositionId) {
      deleteSelectedShortPosition();
    }
    if (selectedFibRetracementId) {
      deleteSelectedFibRetracement();
    }
  };

  return (
    <>
      <div className='h-screen flex flex-col'>
        <TopBar onOpenTickerModal={openTickerModal} />
        <div className='flex h-full'>
          <Sidebar
            deleteAllLines={deleteAllLines}
            deleteAllBoxes={deleteAllBoxes}
            deleteAllLongPositions={deleteAllLongPositions}
            deleteAllShortPositions={deleteAllShortPositions}
            deleteAllFibRetracements={deleteAllFibRetracements}
          />
          <div className='flex flex-col relative w-full h-full'>
            <div
              ref={chartContainerRef}
              className={`w-full -mb-1 h-full ${
                pathname === "/backtest" ? "mb-[350px]" : ""
              }`}
            />
            {pathname === "/backtest" ? <Trades /> : ""}
            {(selectedLineId ||
              selectedBoxId ||
              selectedLongPositionId ||
              selectedShortPositionId ||
              selectedFibRetracementId) && (
              <button
                onClick={handleDeleteSelected}
                className='absolute top-4 right-20 bg-red-500 text-white border-none px-2 py-2 rounded z-40 shadow hover:bg-red-600 transition-colors'
              >
                <Trash />
              </button>
            )}
          </div>
        </div>
      </div>
      <TimeframeModal
        isOpen={isModalOpen}
        inputValue={inputValue}
        isValid={isValid}
        onClose={closeModal}
        onApply={applyTimeframe}
        onInputChange={handleInputChange}
        getPreviewTimeframe={getPreviewTimeframe}
      />
      <TickerModal
        isOpen={isTickerModalOpen}
        initialLetter={initialLetter}
        onClose={closeTickerModal}
        onSelectTicker={handleTickerSelect}
      />
    </>
  );
};

export default TradingChart;
