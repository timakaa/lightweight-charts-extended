import {
  resolveDrawingTime,
  resolveRelativeEndTime,
  toUnixSeconds,
} from "../../../helpers/time";

export const onDrawingUpdate = ({
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
}) => {
  const resolveTime = (time) => {
    if (time === "relative") {
      return resolveRelativeEndTime(candleData);
    }
    const unixTime = toUnixSeconds(time);
    return resolveDrawingTime(unixTime, candleData);
  };

  const handleDrawingUpdate = (drawingId, drawingData) => {
    const drawing = useDrawingsStore
      .getState()
      .drawings.find((d) => d.id === drawingId);
    if (!drawing) return;

    updateDrawing(drawingId, {
      ...drawingData,
      id: drawingId,
    });

    if (drawing.type === "rectangle" && rectangleDrawingTool.current) {
      const rect = Array.from(rectangleDrawingTool.current._rectangles).find(
        (r) => r.id === drawing.primitiveId,
      );
      if (rect) {
        const { startTime, endTime, startPrice, endPrice, options } =
          drawingData;
        rect._p1 = {
          time: resolveTime(startTime),
          price: startPrice,
        };
        rect._p2 = {
          time: resolveTime(endTime),
          price: endPrice,
        };
        rect.updateCandleData(candleData);
        rect.updateAllViews();
        if (options) rect.applyOptions(options);
        candlestickSeries.setData(candlestickSeries.data());
      }
    } else if (drawing.type === "line" && lineDrawingTool.current) {
      const line = Array.from(lineDrawingTool.current._lines).find(
        (l) => l.id === drawing.primitiveId,
      );
      if (line) {
        const { startTime, endTime, startPrice, endPrice, options } =
          drawingData;
        line._p1 = {
          time: resolveTime(startTime),
          price: startPrice,
        };
        line._p2 = {
          time: resolveTime(endTime),
          price: endPrice,
        };
        line.updateCandleData(candleData);
        if (options) line.applyOptions(options);
        candlestickSeries.setData(candlestickSeries.data());
      }
    } else if (
      drawing.type === "long_position" &&
      longPositionDrawingTool.current
    ) {
      const pos = Array.from(longPositionDrawingTool.current._positions).find(
        (p) => p.id === drawing.primitiveId,
      );
      if (pos) {
        const { entry, target, stop, options } = drawingData;
        pos._entryPrice = {
          time: resolveTime(entry.time),
          price: entry.price,
        };
        pos._targetPrice = {
          time: resolveTime(target.time),
          price: target.price,
        };
        pos._stopPrice = {
          time: resolveTime(stop.time),
          price: stop.price,
        };
        pos.updateCandleData(candleData);
        if (options) pos.applyOptions(options);
        candlestickSeries.setData(candlestickSeries.data());
      }
    } else if (
      drawing.type === "short_position" &&
      shortPositionDrawingTool.current
    ) {
      const pos = Array.from(shortPositionDrawingTool.current._positions).find(
        (p) => p.id === drawing.primitiveId,
      );
      if (pos) {
        const { entry, target, stop, options } = drawingData;
        pos._entryPrice = {
          time: resolveTime(entry.time),
          price: entry.price,
        };
        pos._targetPrice = {
          time: resolveTime(target.time),
          price: target.price,
        };
        pos._stopPrice = {
          time: resolveTime(stop.time),
          price: stop.price,
        };
        pos.updateCandleData(candleData);
        if (options) pos.applyOptions(options);
        candlestickSeries.setData(candlestickSeries.data());
      }
    } else if (
      drawing.type === "fib_retracement" &&
      fibRetracementDrawingTool.current
    ) {
      const fib = Array.from(
        fibRetracementDrawingTool.current._retracements,
      ).find((f) => f.id === drawing.primitiveId);
      if (fib) {
        const { startTime, endTime, startPrice, endPrice, options } =
          drawingData;
        fib._p1 = {
          time: resolveTime(startTime),
          price: startPrice,
        };
        fib._p2 = {
          time: resolveTime(endTime),
          price: endPrice,
        };
        fib.updateCandleData(candleData);
        if (options) fib.applyOptions(options);
        candlestickSeries.setData(candlestickSeries.data());
      }
    }
  };

  if (msg.drawing_id && msg.drawing_data) {
    try {
      const drawingIds = Array.isArray(msg.drawing_id)
        ? msg.drawing_id
        : [msg.drawing_id];
      const drawingDatas = Array.isArray(msg.drawing_data)
        ? msg.drawing_data
        : [msg.drawing_data];

      const success = drawingIds.every((id, index) => {
        const data = drawingDatas[index];
        if (!data) return false;

        try {
          updateDrawing(id, {
            ...data,
            id,
          });
          handleDrawingUpdate(id, data);
          return true;
        } catch (err) {
          console.error("Failed to update drawing:", err);
          return false;
        }
      });

      socket.emit("drawing_update_ack", {
        success,
        drawingIds,
      });
    } catch {
      socket.emit("drawing_update_ack", { success: false });
    }
  } else {
    socket.emit("drawing_update_ack", { success: false });
  }
};
