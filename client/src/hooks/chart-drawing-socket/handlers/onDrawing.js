import { getSymbol } from "../../../helpers/symbol";
import { createDrawings } from "../../../helpers/createDrawings";

export const onDrawing = ({
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
}) => {
  if (
    msg.symbol &&
    msg.drawing_data &&
    chart &&
    candlestickSeries &&
    candleData?.length > 0
  ) {
    try {
      const drawingDatas = Array.isArray(msg.drawing_data)
        ? msg.drawing_data
        : [msg.drawing_data];

      const addedDrawings = drawingDatas.map((data) => {
        if (!data.id) {
          console.warn("Drawing data missing ID from backend:", data);
        }
        return addDrawing({
          ...data,
          ticker: getSymbol(msg.symbol),
          id: data.id,
        });
      });

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
            : drawing.type === "long_position"
            ? longPositionDrawingTool.current?._positions
            : drawing.type === "short_position"
            ? shortPositionDrawingTool.current?._positions
            : drawing.type === "fib_retracement"
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
};
