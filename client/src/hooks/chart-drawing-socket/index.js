import { useChartSocket } from "../useChartSocket";
import { useDrawingsStore } from "../../store/drawings";
import { onDrawing } from "./handlers/onDrawing";
import { onDrawingDelete } from "./handlers/onDrawingDelete";
import { onDrawingUpdate } from "./handlers/onDrawingUpdate";

export function useChartDrawingSocket({
  symbol,
  interval,
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
  activeResizeHandleRefs = {},
}) {
  const { removeDrawing, updateDrawing, addDrawing } = useDrawingsStore();

  useChartSocket({
    symbol,
    interval,
    onDrawing: (msg, socket) =>
      onDrawing({
        msg,
        socket,
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
        addDrawing,
      }),
    onDrawingUpdated: (msg, socket) =>
      onDrawingUpdate({
        msg,
        socket,
        candleData,
        candlestickSeries,
        rectangleDrawingTool,
        lineDrawingTool,
        longPositionDrawingTool,
        shortPositionDrawingTool,
        fibRetracementDrawingTool,
        useDrawingsStore,
        updateDrawing,
      }),
    onDrawingDeleted: (msg, socket) =>
      onDrawingDelete({
        msg,
        socket,
        rectangleDrawingTool,
        lineDrawingTool,
        longPositionDrawingTool,
        shortPositionDrawingTool,
        fibRetracementDrawingTool,
        useDrawingsStore,
        removeDrawing,
      }),
  });
}
