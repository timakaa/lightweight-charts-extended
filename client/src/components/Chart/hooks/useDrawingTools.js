import { useMemo } from "react";
import { useLineDrawing } from "./useLineDrawing";
import { useBoxDrawing } from "./useBoxDrawing";
import { useLongPositionDrawing } from "./useLongPositionDrawing";
import { useShortPositionDrawing } from "./useShortPositionDrawing";
import { useRulerDrawing } from "./useRulerDrawing";
import useFibRetracementDrawing from "./useFibRetracementDrawing";
import { useToolStore } from "@store/tool";
import useCrosshairToRuler from "./useCrosshairToRuler";

export const useDrawingTools = (chart, candlestickSeries, candleData) => {
  const { setCurrentTool, currentTool } = useToolStore();

  const lineDrawing = useLineDrawing(chart, candlestickSeries, candleData);
  const boxDrawing = useBoxDrawing(chart, candlestickSeries, candleData);
  const longPositionDrawing = useLongPositionDrawing(
    chart,
    candlestickSeries,
    candleData,
  );
  const shortPositionDrawing = useShortPositionDrawing(
    chart,
    candlestickSeries,
    candleData,
  );
  const rulerDrawing = useRulerDrawing(chart, candlestickSeries, candleData);
  const fibRetracementDrawing = useFibRetracementDrawing(
    chart,
    candlestickSeries,
    setCurrentTool,
    currentTool,
    candleData,
  );

  useCrosshairToRuler(
    chart,
    candlestickSeries,
    rulerDrawing.rulerDrawingTool,
    setCurrentTool,
    currentTool,
    candleData,
  );

  const activeResizeHandleRefs = useMemo(
    () => ({
      rectangle: boxDrawing.activeResizeHandleRef,
      line: lineDrawing.activeResizeHandleRef,
      long_position: longPositionDrawing.activeResizeHandleRef,
      short_position: shortPositionDrawing.activeResizeHandleRef,
      fib_retracement: fibRetracementDrawing.activeResizeHandleRef,
    }),
    [
      boxDrawing.activeResizeHandleRef,
      lineDrawing.activeResizeHandleRef,
      longPositionDrawing.activeResizeHandleRef,
      shortPositionDrawing.activeResizeHandleRef,
      fibRetracementDrawing.activeResizeHandleRef,
    ],
  );

  return {
    lineDrawing,
    boxDrawing,
    longPositionDrawing,
    shortPositionDrawing,
    rulerDrawing,
    fibRetracementDrawing,
    activeResizeHandleRefs,
  };
};
