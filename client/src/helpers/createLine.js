import { Line } from "../drawing-tools/line/Line.js";
import { toUnixSeconds } from "./time.js";
import { useDrawingsStore } from "../store/drawings.js";
import { useChartStore } from "../store/chart.js";

// Example object structure for line data from backend
export const exampleLineData = {
  type: "line",
  startTime: "2025-05-21T09:00:00Z",
  endTime: "2025-05-21T16:00:00Z", // or specific timestamp
  startPrice: 167.33,
  endPrice: 167.33,
  style: {
    color: "#FF0000",
    width: 2,
    lineStyle: "solid", // solid, dashed, dotted, dashdot
  },
};

export const createLine = (
  chart,
  candlestickSeries,
  candleData,
  lineData = exampleLineData,
  setLinesData = null,
  lineDrawingTool = null,
  activeResizeHandleRef = null,
) => {
  if (!chart || !candlestickSeries || !candleData || candleData.length === 0)
    return;

  // Parse start and end times from the resolved data object
  // (relative positioning is already handled by resolveDrawingPositions)
  const startTime = toUnixSeconds(lineData.startTime);
  const endTime = lineData.endTime; // Already resolved as unix timestamp

  // Create line points using data from the object
  const p1 = { time: startTime, price: lineData.startPrice };
  const p2 = { time: endTime, price: lineData.endPrice };

  // Create line instance with activeResizeHandleRef for handle hiding and candleData for logical coordinates
  const line = new Line(
    p1,
    p2,
    candlestickSeries,
    chart,
    null,
    activeResizeHandleRef,
    candleData,
    lineData.id,
  );

  // Apply styling if provided
  if (lineData.style) {
    line.applyOptions({
      color: lineData.style.color || line._options.color,
      style: {
        width: lineData.style.width || 4,
        lineStyle: lineData.style.lineStyle || "solid",
      },
    });
  }

  // Attach to chart
  candlestickSeries.attachPrimitive(line);

  // Add to state management for interactivity
  if (setLinesData) {
    setLinesData((prevLines) => [...prevLines, line]);
  }

  // Add to drawing tool's internal tracking
  if (lineDrawingTool && lineDrawingTool.current) {
    lineDrawingTool.current._lines.add(line);
  }

  // Handle store persistence
  if (!lineData.id && !lineData.primitiveId) {
    // This is a completely new line (drawn by user) - save to store
    const { addDrawing } = useDrawingsStore.getState();
    const { ticker } = useChartStore.getState();

    if (ticker) {
      const drawingData = {
        type: "line",
        ticker: ticker.replace("/", ""),
        startTime: lineData.startTime,
        endTime: lineData.endTime,
        startPrice: lineData.startPrice,
        endPrice: lineData.endPrice,
        primitiveId: line.id,
        style: lineData.style,
      };

      addDrawing(drawingData);
    }
  } else if (lineData.id) {
    // This line was loaded from store - update the primitive ID in store to match new primitive
    const { updateDrawing } = useDrawingsStore.getState();
    updateDrawing(lineData.id, { primitiveId: line.id });
  }
};
