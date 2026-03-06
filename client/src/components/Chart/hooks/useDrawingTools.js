import { useMemo } from "react";
import { useLineDrawing } from "./useLineDrawing";
import { useBoxDrawing } from "./useBoxDrawing";
import { useLongPositionDrawing } from "./useLongPositionDrawing";
import { useShortPositionDrawing } from "./useShortPositionDrawing";
import { useRulerDrawing } from "./useRulerDrawing";
import useFibRetracementDrawing from "./useFibRetracementDrawing";
import { useToolStore } from "@store/tool";
import useCrosshairToRuler from "./useCrosshairToRuler";

export const useDrawingTools = (
  chart,
  candlestickSeries,
  candleData,
  precision = 2,
) => {
  const { setCurrentTool, currentTool } = useToolStore();

  const lineDrawing = useLineDrawing(
    chart,
    candlestickSeries,
    candleData,
    precision,
  );
  const boxDrawing = useBoxDrawing(
    chart,
    candlestickSeries,
    candleData,
    precision,
  );
  const longPositionDrawing = useLongPositionDrawing(
    chart,
    candlestickSeries,
    candleData,
    precision,
  );
  const shortPositionDrawing = useShortPositionDrawing(
    chart,
    candlestickSeries,
    candleData,
    precision,
  );
  const rulerDrawing = useRulerDrawing(
    chart,
    candlestickSeries,
    candleData,
    precision,
  );
  const fibRetracementDrawing = useFibRetracementDrawing(
    chart,
    candlestickSeries,
    setCurrentTool,
    currentTool,
    candleData,
    precision,
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
