import { Rectangle } from "../drawing-tools/rectangle/Rectangle.js";
import { toUnixSeconds } from "./time.js";
import { useDrawingsStore } from "../store/drawings.js";
import { useChartStore } from "../store/chart.js";

// Example object structure for rectangle data from backend
export const exampleRectangleData = {
  type: "rectangle",
  startTime: "2025-05-21T16:00:00Z",
  endTime: "relative", // or specific timestamp
  startPrice: 171.31,
  endPrice: 169.56,
  style: {
    borderColor: "#FF0000",
    borderWidth: 2,
    fillColor: "rgba(255, 0, 0, 0.1)",
  },
};

export const createRectangle = (
  chart,
  candlestickSeries,
  candleData,
  rectangleData = exampleRectangleData,
  setBoxesData = null,
  rectangleDrawingTool = null,
  activeResizeHandleRef = null,
) => {
  if (!chart || !candlestickSeries || !candleData || candleData.length === 0)
    return;

  // Parse start and end times from the resolved data object
  // (relative positioning is already handled by resolveDrawingPositions)
  const startTime = toUnixSeconds(rectangleData.startTime);
  const endTime = rectangleData.endTime; // Already resolved as unix timestamp

  // Create rectangle points using data from the object
  const p1 = { time: startTime, price: rectangleData.startPrice };
  const p2 = { time: endTime, price: rectangleData.endPrice };

  // Create rectangle instance with activeResizeHandleRef for handle hiding
  const rectangle = new Rectangle(
    p1,
    p2,
    candlestickSeries,
    chart,
    null,
    activeResizeHandleRef,
    candleData,
    rectangleData.id,
  );

  // Apply styling if provided
  if (rectangleData.style) {
    rectangle.applyOptions({
      fillColor: rectangleData.style.fillColor || rectangle._options.fillColor,
    });
    rectangle.updateAllViews(); // Force redraw with new styling
  }

  // Attach to chart
  candlestickSeries.attachPrimitive(rectangle);

  // Add to state management for interactivity
  if (setBoxesData) {
    setBoxesData((prevBoxes) => [...prevBoxes, rectangle]);
  }

  // Add to drawing tool's internal tracking
  if (rectangleDrawingTool && rectangleDrawingTool.current) {
    rectangleDrawingTool.current._rectangles.add(rectangle);
  }

  // Handle store persistence
  if (!rectangleData.id && !rectangleData.primitiveId) {
    // This is a completely new rectangle (drawn by user) - save to store
    const { addDrawing } = useDrawingsStore.getState();
    const { ticker } = useChartStore.getState();

    if (ticker) {
      const drawingData = {
        type: "rectangle",
        ticker: ticker.replace("/", ""),
        startTime: rectangleData.startTime,
        endTime: rectangleData.endTime,
        startPrice: rectangleData.startPrice,
        endPrice: rectangleData.endPrice,
        primitiveId: rectangle.id,
        style: rectangleData.style,
      };

      addDrawing(drawingData);
    }
  } else if (rectangleData.id) {
    // This rectangle was loaded from store - update the primitive ID in store to match new primitive
    const { updateDrawing } = useDrawingsStore.getState();
    updateDrawing(rectangleData.id, { primitiveId: rectangle.id });
  }
};
