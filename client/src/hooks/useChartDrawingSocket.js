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

  const resolveTime = (time) => {
    const unixTime = toUnixSeconds(time);
    return resolveDrawingTime(unixTime, candleData);
  };

  const handleDrawingUpdate = (drawingId, drawingData) => {
    const drawing =
      Array.from(rectangleDrawingTool.current?._rectangles || []).find(
        (d) => d.id === drawingId,
      ) ||
      Array.from(lineDrawingTool.current?._lines || []).find(
        (d) => d.id === drawingId,
      ) ||
      Array.from(longPositionDrawingTool.current?._positions || []).find(
        (d) => d.id === drawingId,
      ) ||
      Array.from(shortPositionDrawingTool.current?._positions || []).find(
        (d) => d.id === drawingId,
      ) ||
      Array.from(fibRetracementDrawingTool.current?._retracements || []).find(
        (d) => d.id === drawingId,
      );

    if (drawing) {
      if (rectangleDrawingTool.current?._rectangles.has(drawing)) {
        const { startTime, endTime, startPrice, endPrice, options } =
          drawingData;
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
          drawingData;
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
        const { entry, target, stop, options } = drawingData;
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
      } else if (shortPositionDrawingTool.current?._positions.has(drawing)) {
        const { entry, target, stop, options } = drawingData;
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
          drawingData;
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
  };

  const handleDrawingDelete = (drawingId) => {
    removeDrawing(drawingId);

    const drawing =
      Array.from(rectangleDrawingTool.current?._rectangles || []).find(
        (d) => d.id === drawingId,
      ) ||
      Array.from(lineDrawingTool.current?._lines || []).find(
        (d) => d.id === drawingId,
      ) ||
      Array.from(longPositionDrawingTool.current?._positions || []).find(
        (d) => d.id === drawingId,
      ) ||
      Array.from(shortPositionDrawingTool.current?._positions || []).find(
        (d) => d.id === drawingId,
      ) ||
      Array.from(fibRetracementDrawingTool.current?._retracements || []).find(
        (d) => d.id === drawingId,
      );

    if (drawing) {
      if (rectangleDrawingTool.current?._rectangles.has(drawing)) {
        rectangleDrawingTool.current._removeRectangle(drawing);
      } else if (lineDrawingTool.current?._lines.has(drawing)) {
        lineDrawingTool.current._removeLine(drawing);
      } else if (longPositionDrawingTool.current?._positions.has(drawing)) {
        longPositionDrawingTool.current._removePosition(drawing);
      } else if (shortPositionDrawingTool.current?._positions.has(drawing)) {
        shortPositionDrawingTool.current._removePosition(drawing);
      } else if (
        fibRetracementDrawingTool.current?._retracements.has(drawing)
      ) {
        fibRetracementDrawingTool.current._removeRetracement(drawing);
      }
    }
  };

  useChartSocket({
    symbol,
    interval,
    onDrawing: (msg, ack) => {
      if (
        msg.symbol &&
        msg.drawing_data &&
        chart &&
        candlestickSeries &&
        candleData?.length > 0
      ) {
        const drawingData = Array.isArray(msg.drawing_data)
          ? msg.drawing_data
          : [msg.drawing_data];

        createDrawings(
          chart,
          candlestickSeries,
          candleData,
          drawingData.map((data) => ({ ...data, ticker: msg.symbol })),
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

        // Acknowledge receipt
        if (ack) ack({ success: true });
      } else if (ack) {
        ack({ success: false });
      }
    },
    onDrawingUpdated: (msg, ack) => {
      if (msg.symbol && msg.drawing_id && msg.drawing_data) {
        if (Array.isArray(msg.drawing_id) && Array.isArray(msg.drawing_data)) {
          msg.drawing_id.forEach((id, index) => {
            updateDrawing(id, msg.drawing_data[index]);
            handleDrawingUpdate(id, msg.drawing_data[index]);
          });
        } else {
          updateDrawing(msg.drawing_id, msg.drawing_data);
          handleDrawingUpdate(msg.drawing_id, msg.drawing_data);
        }
        // Acknowledge receipt
        if (ack) ack({ success: true });
      } else if (ack) {
        ack({ success: false });
      }
    },
    onDrawingDeleted: (msg, ack) => {
      if (msg.symbol && msg.drawing_id) {
        if (Array.isArray(msg.drawing_id)) {
          msg.drawing_id.forEach((id) => handleDrawingDelete(id));
        } else {
          handleDrawingDelete(msg.drawing_id);
        }
        // Acknowledge receipt
        if (ack) ack({ success: true });
      } else if (ack) {
        ack({ success: false });
      }
    },
  });
}
