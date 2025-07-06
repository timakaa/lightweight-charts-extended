import { useChartSocket } from "./useChartSocket";
import { createDrawings } from "../helpers/createDrawings";
import { useDrawingsStore } from "../store/drawings";
import { toUnixSeconds, resolveDrawingTime } from "../helpers/time";

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
  const { removeDrawing, updateDrawing } = useDrawingsStore();

  // Helper function to resolve time coordinates
  const resolveTime = (time) => {
    const unixTime = toUnixSeconds(time);
    return resolveDrawingTime(unixTime, candleData);
  };

  useChartSocket({
    symbol,
    interval,
    onDrawing: (msg) => {
      if (
        msg.symbol &&
        msg.drawing_data &&
        chart &&
        candlestickSeries &&
        candleData?.length > 0
      ) {
        // Create the drawing directly using createDrawings
        createDrawings(
          chart,
          candlestickSeries,
          candleData,
          [{ ...msg.drawing_data, ticker: msg.symbol }], // Pass as array since createDrawings expects array
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
        );
      }
    },
    onDrawingUpdated: (msg) => {
      if (msg.symbol && msg.drawing_id && msg.drawing_data) {
        // Update store first
        updateDrawing(msg.drawing_id, msg.drawing_data);

        // Find the drawing to update
        const drawing =
          Array.from(rectangleDrawingTool.current?._rectangles || []).find(
            (d) => d.id === msg.drawing_id,
          ) ||
          Array.from(lineDrawingTool.current?._lines || []).find(
            (d) => d.id === msg.drawing_id,
          ) ||
          Array.from(longPositionDrawingTool.current?._positions || []).find(
            (d) => d.id === msg.drawing_id,
          ) ||
          Array.from(shortPositionDrawingTool.current?._positions || []).find(
            (d) => d.id === msg.drawing_id,
          ) ||
          Array.from(
            fibRetracementDrawingTool.current?._retracements || [],
          ).find((d) => d.id === msg.drawing_id);

        if (drawing) {
          // Update the drawing based on its type
          if (rectangleDrawingTool.current?._rectangles.has(drawing)) {
            const { startTime, endTime, startPrice, endPrice, options } =
              msg.drawing_data;
            drawing._p1 = {
              time: resolveTime(startTime),
              price: startPrice,
            };
            drawing._p2 = {
              time: resolveTime(endTime),
              price: endPrice,
            };
            drawing.updateCandleData(candleData);
            if (options) drawing.applyOptions(options);
          } else if (lineDrawingTool.current?._lines.has(drawing)) {
            const { startTime, endTime, startPrice, endPrice, options } =
              msg.drawing_data;
            drawing._p1 = {
              time: resolveTime(startTime),
              price: startPrice,
            };
            drawing._p2 = {
              time: resolveTime(endTime),
              price: endPrice,
            };
            drawing.updateCandleData(candleData);
            if (options) drawing.applyOptions(options);
          } else if (longPositionDrawingTool.current?._positions.has(drawing)) {
            const { entry, target, stop, options } = msg.drawing_data;
            drawing._entry = {
              time: resolveTime(entry.time),
              price: entry.price,
            };
            drawing._target = {
              time: resolveTime(target.time),
              price: target.price,
            };
            drawing._stop = {
              time: resolveTime(stop.time),
              price: stop.price,
            };
            drawing.updateCandleData(candleData);
            if (options) drawing.applyOptions(options);
          } else if (
            shortPositionDrawingTool.current?._positions.has(drawing)
          ) {
            const { entry, target, stop, options } = msg.drawing_data;
            drawing._entry = {
              time: resolveTime(entry.time),
              price: entry.price,
            };
            drawing._target = {
              time: resolveTime(target.time),
              price: target.price,
            };
            drawing._stop = {
              time: resolveTime(stop.time),
              price: stop.price,
            };
            drawing.updateCandleData(candleData);
            if (options) drawing.applyOptions(options);
          } else if (
            fibRetracementDrawingTool.current?._retracements.has(drawing)
          ) {
            const { startTime, endTime, startPrice, endPrice, options } =
              msg.drawing_data;
            drawing._p1 = {
              time: resolveTime(startTime),
              price: startPrice,
            };
            drawing._p2 = {
              time: resolveTime(endTime),
              price: endPrice,
            };
            drawing.updateCandleData(candleData);
            if (options) drawing.applyOptions(options);
          }
        }
      }
    },
    onDrawingDeleted: (msg) => {
      if (msg.symbol && msg.drawing_id) {
        // Remove from store
        removeDrawing(msg.drawing_id);

        // Remove from chart
        const drawing =
          Array.from(rectangleDrawingTool.current?._rectangles || []).find(
            (d) => d.id === msg.drawing_id,
          ) ||
          Array.from(lineDrawingTool.current?._lines || []).find(
            (d) => d.id === msg.drawing_id,
          ) ||
          Array.from(longPositionDrawingTool.current?._positions || []).find(
            (d) => d.id === msg.drawing_id,
          ) ||
          Array.from(shortPositionDrawingTool.current?._positions || []).find(
            (d) => d.id === msg.drawing_id,
          ) ||
          Array.from(
            fibRetracementDrawingTool.current?._retracements || [],
          ).find((d) => d.id === msg.drawing_id);

        if (drawing) {
          if (rectangleDrawingTool.current?._rectangles.has(drawing)) {
            rectangleDrawingTool.current._removeRectangle(drawing);
          } else if (lineDrawingTool.current?._lines.has(drawing)) {
            lineDrawingTool.current._removeLine(drawing);
          } else if (longPositionDrawingTool.current?._positions.has(drawing)) {
            longPositionDrawingTool.current._removePosition(drawing);
          } else if (
            shortPositionDrawingTool.current?._positions.has(drawing)
          ) {
            shortPositionDrawingTool.current._removePosition(drawing);
          } else if (
            fibRetracementDrawingTool.current?._retracements.has(drawing)
          ) {
            fibRetracementDrawingTool.current._removeRetracement(drawing);
          }
        }
      }
    },
  });
}
