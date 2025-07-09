export const onDrawingDelete = ({
  msg,
  socket,
  rectangleDrawingTool,
  lineDrawingTool,
  longPositionDrawingTool,
  shortPositionDrawingTool,
  fibRetracementDrawingTool,
  useDrawingsStore,
  removeDrawing,
}) => {
  const handleDrawingDelete = (drawingId) => {
    const drawing = useDrawingsStore
      .getState()
      .drawings.find((d) => d.id === drawingId);
    if (!drawing) return;

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

    removeDrawing(drawingId);
  };

  if (msg.drawing_id) {
    try {
      const drawingIds = Array.isArray(msg.drawing_id)
        ? msg.drawing_id
        : [msg.drawing_id];

      drawingIds.forEach(handleDrawingDelete);

      socket.emit("drawing_delete_ack", {
        success: true,
        drawingIds,
      });
    } catch {
      socket.emit("drawing_delete_ack", { success: false });
    }
  } else {
    socket.emit("drawing_delete_ack", { success: false });
  }
};
