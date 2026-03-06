import { useCreateDrawings } from "./useCreateDrawings";
import { useChartDrawingSocket } from "./chart-drawing-socket";
import { useUndeliveredDrawings } from "./useUndeliveredDrawings";
import { useChartStore } from "@store/chart";
import { getSymbol } from "@helpers/symbol";

export const useDrawingSync = ({
  chart,
  candlestickSeries,
  candleData,
  drawings,
  drawingTools,
  activeResizeHandleRefs,
  precision = 2,
}) => {
  const {
    lineDrawing,
    boxDrawing,
    longPositionDrawing,
    shortPositionDrawing,
    fibRetracementDrawing,
  } = drawingTools;

  const symbol = useChartStore((s) => s.ticker);
  const timeframe = useChartStore((s) => s.timeframe);

  useCreateDrawings({
    chart,
    candlestickSeries,
    candleData,
    drawingsData: drawings,
    setBoxesData: boxDrawing.setBoxesData,
    setLinesData: lineDrawing.setLinesData,
    setLongPositionsData: longPositionDrawing.setLongPositionsData,
    setShortPositionsData: shortPositionDrawing.setShortPositionsData,
    setFibRetracementsData: fibRetracementDrawing.setFibRetracementsData,
    rectangleDrawingTool: boxDrawing.rectangleDrawingTool,
    lineDrawingTool: lineDrawing.lineDrawingTool,
    longPositionDrawingTool: longPositionDrawing.longPositionDrawingTool,
    shortPositionDrawingTool: shortPositionDrawing.shortPositionDrawingTool,
    fibRetracementDrawingTool: fibRetracementDrawing.fibRetracementDrawingTool,
    activeResizeHandleRefs,
    precision,
  });

  useChartDrawingSocket({
    symbol: getSymbol(symbol),
    interval: timeframe,
    chart,
    candlestickSeries,
    candleData,
    setBoxesData: boxDrawing.setBoxesData,
    setLinesData: lineDrawing.setLinesData,
    setLongPositionsData: longPositionDrawing.setLongPositionsData,
    setShortPositionsData: shortPositionDrawing.setShortPositionsData,
    setFibRetracementsData: fibRetracementDrawing.setFibRetracementsData,
    rectangleDrawingTool: boxDrawing.rectangleDrawingTool,
    lineDrawingTool: lineDrawing.lineDrawingTool,
    longPositionDrawingTool: longPositionDrawing.longPositionDrawingTool,
    shortPositionDrawingTool: shortPositionDrawing.shortPositionDrawingTool,
    fibRetracementDrawingTool: fibRetracementDrawing.fibRetracementDrawingTool,
    activeResizeHandleRefs,
    precision,
  });

  useUndeliveredDrawings();
};
