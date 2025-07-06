import { useEffect, useRef } from "react";
import { TOOL_CROSSHAIR, TOOL_RULER } from "../store/tool";
import { logicalIndexToTime } from "../helpers/coordinateUtils";

export default function useCrosshairToRuler(
  chart,
  candlestickSeries,
  rulerDrawingTool,
  setCurrentTool,
  currentTool,
  candleData,
) {
  const lastCrosshairParam = useRef(null);

  useEffect(() => {
    if (!chart || !candlestickSeries || !rulerDrawingTool?.current) return;
    const container = chart.chartElement();
    if (!container) return;

    let shiftPressed = false;
    let snapPressed = false;

    const handleKeyDown = (e) => {
      if (e.key === "Shift") shiftPressed = true;
      if (e.key === "Meta" || e.key === "Control") snapPressed = true;
    };
    const handleKeyUp = (e) => {
      if (e.key === "Shift") shiftPressed = false;
      if (e.key === "Meta" || e.key === "Control") snapPressed = false;
    };
    const handleMouseDown = (e) => {
      if (
        currentTool === TOOL_CROSSHAIR &&
        shiftPressed &&
        e.button === 0 // left click
      ) {
        let param;
        if (
          snapPressed &&
          lastCrosshairParam.current &&
          lastCrosshairParam.current.point &&
          lastCrosshairParam.current.time
        ) {
          // Use crosshair position
          param = {
            ...lastCrosshairParam.current,
            modifierKey: "snap",
          };
        } else {
          // Use mouse click position with hybrid coordinate support
          const rect = container.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          let time = chart.timeScale().coordinateToTime(x);
          const price = candlestickSeries.coordinateToPrice(y);

          if (price == null) return; // Must have valid price

          // Handle clicks outside candle range using logical coordinates
          if (!time && candleData && candleData.length > 0) {
            const timeScale = chart.timeScale();
            const logicalIndex = timeScale.coordinateToLogical(x);

            if (logicalIndex !== null) {
              // Calculate time from logical index using candle data
              time = logicalIndexToTime(logicalIndex, candleData);
            }
          }

          if (!time) return; // Must have valid time (either direct or calculated)

          const seriesData = new Map();
          seriesData.set(candlestickSeries, { close: price });
          param = {
            point: { x, y },
            time,
            seriesData,
          };
        }
        setCurrentTool(TOOL_RULER);
        setTimeout(() => {
          rulerDrawingTool.current.setFirstPointFromEvent(param);
        }, 0);
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const handleCrosshairMove = (param) => {
      lastCrosshairParam.current = param;
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);
    container.addEventListener("mousedown", handleMouseDown, true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      container.removeEventListener("mousedown", handleMouseDown, true);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    chart,
    candlestickSeries,
    rulerDrawingTool,
    setCurrentTool,
    currentTool,
    candleData,
  ]);
}
