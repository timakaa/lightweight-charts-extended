import { useChartSocket } from "./useChartSocket";
import { createDrawings } from "../helpers/createDrawings";
import { useDrawingsStore } from "../store/drawings";
import { toUnixSeconds, resolveDrawingTime } from "../helpers/time";
import { getSymbol } from "../helpers/symbol";
import { resolveRelativeEndTime } from "../helpers/time";

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

  const resolveTime = (time) => {
    if (time === "relative") {
      // Handle relative positioning - extend to latest candle + 10 candles further
      return resolveRelativeEndTime(candleData);
    }
    const unixTime = toUnixSeconds(time);
    return resolveDrawingTime(unixTime, candleData);
  };

  const handleDrawingUpdate = (drawingId, drawingData) => {
    // Find the drawing in the store first
    const drawing = useDrawingsStore
      .getState()
      .drawings.find((d) => d.id === drawingId);
    if (!drawing) return;

    // Update store first
    updateDrawing(drawingId, {
      ...drawingData,
      id: drawingId, // Ensure ID is preserved
    });

    // Find and update the drawing on the chart based on type
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
        // Force a redraw
        rectangleDrawingTool.current._series.requestUpdate();
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
      }
    } else if (
      drawing.type === "long-position" &&
      longPositionDrawingTool.current
    ) {
      const pos = Array.from(longPositionDrawingTool.current._positions).find(
        (p) => p.id === drawing.primitiveId,
      );
      if (pos) {
        const { entry, target, stop, options } = drawingData;
        pos._entry = {
          time: resolveTime(entry.time),
          price: entry.price,
        };
        pos._target = {
          time: resolveTime(target.time),
          price: target.price,
        };
        pos._stop = {
          time: resolveTime(stop.time),
          price: stop.price,
        };
        pos.updateCandleData(candleData);
        if (options) pos.applyOptions(options);
      }
    } else if (
      drawing.type === "short-position" &&
      shortPositionDrawingTool.current
    ) {
      const pos = Array.from(shortPositionDrawingTool.current._positions).find(
        (p) => p.id === drawing.primitiveId,
      );
      if (pos) {
        const { entry, target, stop, options } = drawingData;
        pos._entry = {
          time: resolveTime(entry.time),
          price: entry.price,
        };
        pos._target = {
          time: resolveTime(target.time),
          price: target.price,
        };
        pos._stop = {
          time: resolveTime(stop.time),
          price: stop.price,
        };
        pos.updateCandleData(candleData);
        if (options) pos.applyOptions(options);
      }
    } else if (
      drawing.type === "fib-retracement" &&
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
      }
    }
  };

  const handleDrawingDelete = (drawingId) => {
    // Find the drawing in the store first
    const drawing = useDrawingsStore
      .getState()
      .drawings.find((d) => d.id === drawingId);
    if (!drawing) return;

    // Remove from chart based on type
    if (drawing.type === "rectangle" && rectangleDrawingTool.current) {
      const rect = Array.from(rectangleDrawingTool.current._rectangles).find(
        (r) => r.id === drawing.primitiveId,
      );
      if (rect) rectangleDrawingTool.current._removeRectangle(rect);
    } else if (drawing.type === "line" && lineDrawingTool.current) {
      const line = Array.from(lineDrawingTool.current._lines).find(
        (l) => l.id === drawing.primitiveId,
      );
      if (line) lineDrawingTool.current._removeLine(line);
    } else if (
      drawing.type === "long-position" &&
      longPositionDrawingTool.current
    ) {
      const pos = Array.from(longPositionDrawingTool.current._positions).find(
        (p) => p.id === drawing.primitiveId,
      );
      if (pos) longPositionDrawingTool.current._removePosition(pos);
    } else if (
      drawing.type === "short-position" &&
      shortPositionDrawingTool.current
    ) {
      const pos = Array.from(shortPositionDrawingTool.current._positions).find(
        (p) => p.id === drawing.primitiveId,
      );
      if (pos) shortPositionDrawingTool.current._removePosition(pos);
    } else if (
      drawing.type === "fib-retracement" &&
      fibRetracementDrawingTool.current
    ) {
      const fib = Array.from(
        fibRetracementDrawingTool.current._retracements,
      ).find((f) => f.id === drawing.primitiveId);
      if (fib) fibRetracementDrawingTool.current._removeRetracement(fib);
    }

    // Remove from store
    removeDrawing(drawingId);
  };

  useChartSocket({
    symbol,
    interval,
    onDrawing: (msg, socket) => {
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

        try {
          // Add to store first, preserving the backend-generated IDs
          const addedDrawings = drawingData.map((data) => {
            // Ensure we have the ID from the backend
            if (!data.id) {
              console.error("Drawing data missing ID from backend:", data);
              return null;
            }
            return addDrawing({
              ...data,
              ticker: getSymbol(msg.symbol),
              id: data.id, // Explicitly set the ID from backend
            });
          });

          // Filter out any failed additions
          const validDrawings = addedDrawings.filter(Boolean);

          if (validDrawings.length === 0) {
            socket.emit("drawing_ack", { success: false });
            return;
          }

          createDrawings(
            chart,
            candlestickSeries,
            candleData,
            validDrawings,
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

          const allDrawingsCreated = validDrawings.every((drawing) => {
            const tool =
              drawing.type === "rectangle"
                ? rectangleDrawingTool.current?._rectangles
                : drawing.type === "line"
                ? lineDrawingTool.current?._lines
                : drawing.type === "long-position"
                ? longPositionDrawingTool.current?._positions
                : drawing.type === "short-position"
                ? shortPositionDrawingTool.current?._positions
                : drawing.type === "fib-retracement"
                ? fibRetracementDrawingTool.current?._retracements
                : null;

            return Array.from(tool || []).some((d) => d.id === drawing.id);
          });

          socket.emit("drawing_ack", {
            success: allDrawingsCreated,
            symbol: msg.symbol,
            drawingIds: validDrawings.map((d) => d.id),
          });
        } catch {
          socket.emit("drawing_ack", { success: false });
        }
      } else {
        socket.emit("drawing_ack", { success: false });
      }
    },
    onDrawingUpdated: (msg, socket) => {
      if (msg.symbol && msg.drawing_id && msg.drawing_data) {
        try {
          if (
            Array.isArray(msg.drawing_id) &&
            Array.isArray(msg.drawing_data)
          ) {
            msg.drawing_id.forEach((id, index) => {
              updateDrawing(id, {
                ...msg.drawing_data[index],
                id, // Ensure ID is preserved
              });
              handleDrawingUpdate(id, msg.drawing_data[index]);
            });
          } else {
            updateDrawing(msg.drawing_id, {
              ...msg.drawing_data,
              id: msg.drawing_id, // Ensure ID is preserved
            });
            handleDrawingUpdate(msg.drawing_id, msg.drawing_data);
          }

          socket.emit("drawing_update_ack", {
            success: true,
            symbol: msg.symbol,
            drawingIds: Array.isArray(msg.drawing_id)
              ? msg.drawing_id
              : [msg.drawing_id],
          });
        } catch {
          socket.emit("drawing_update_ack", { success: false });
        }
      } else {
        socket.emit("drawing_update_ack", { success: false });
      }
    },
    onDrawingDeleted: (msg, socket) => {
      if (msg.symbol && msg.drawing_id) {
        try {
          if (Array.isArray(msg.drawing_id)) {
            msg.drawing_id.forEach(handleDrawingDelete);
          } else {
            handleDrawingDelete(msg.drawing_id);
          }

          // Send explicit acknowledgment event
          socket.emit("drawing_delete_ack", {
            success: true,
            symbol: msg.symbol,
            drawingIds: Array.isArray(msg.drawing_id)
              ? msg.drawing_id
              : [msg.drawing_id],
          });
        } catch {
          socket.emit("drawing_delete_ack", { success: false });
        }
      } else {
        socket.emit("drawing_delete_ack", { success: false });
      }
    },
  });
}
