import { useDrawingsStore } from "../store/drawings.js";

/**
 * Update drawing position in store after drag/resize operations
 * @param {string} primitiveId - The primitive ID of the drawing
 * @param {Object} drawing - The drawing object with updated position
 * @param {string} type - The type of drawing ('line', 'rectangle', etc.)
 */
export const updateDrawingPosition = (primitiveId, drawing, type = "line") => {
  const { updateDrawingByPrimitiveId } = useDrawingsStore.getState();

  let updates = {};

  switch (type) {
    case "line":
      updates = {
        startTime: new Date(drawing._p1.time * 1000).toISOString(),
        endTime: new Date(drawing._p2.time * 1000).toISOString(),
        startPrice: drawing._p1.price,
        endPrice: drawing._p2.price,
      };
      break;

    case "rectangle":
      updates = {
        startTime: new Date(drawing._p1.time * 1000).toISOString(),
        endTime: new Date(drawing._p2.time * 1000).toISOString(),
        startPrice: drawing._p1.price,
        endPrice: drawing._p2.price,
      };
      break;

    case "long_position":
    case "short_position":
      updates = {
        startTime: new Date(drawing._startTime * 1000).toISOString(),
        endTime: new Date(drawing._endTime * 1000).toISOString(),
        entryPrice: drawing._entryPrice.price,
        targetPrice: drawing._targetPrice.price,
        stopPrice: drawing._stopPrice.price,
      };
      break;

    case "fib_retracement":
      updates = {
        startTime: new Date(drawing._p1.time * 1000).toISOString(),
        endTime: new Date(drawing._p2.time * 1000).toISOString(),
        startPrice: drawing._p1.price,
        endPrice: drawing._p2.price,
      };
      break;

    default:
      console.warn(`Unknown drawing type: ${type}`);
      return;
  }

  updateDrawingByPrimitiveId(primitiveId, updates);
};
