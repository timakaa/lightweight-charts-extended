import { getXCoordinate } from "../../helpers/coordinateUtils.js";

/**
 * Checks if a logical point ({time, price, logicalIndex}) is near a line primitive on the chart.
 * This is done by converting logical coordinates to screen coordinates and checking proximity in pixels.
 *
 * @param {{time, price, logicalIndex}} point - The logical point to check.
 * @param {object} line - The line primitive object, containing `_p1` and `_p2`.
 * @param {object} chart - The chart instance for coordinate conversion.
 * @param {object} series - The series instance for coordinate conversion.
 * @param {number} threshold - The proximity threshold in pixels.
 * @returns {{near: boolean, onPoint: number|null}} - An object indicating if the point is near,
 * and if so, whether it's on an endpoint (0 or 1) or the line body (null).
 */
export function isPointNearLine(point, line, chart, series, threshold = 10) {
  // Convert logical coordinates to screen coordinates using enhanced conversion
  const timeScale = chart.timeScale();
  const candleData = line._candleData;

  const p1Coord = {
    x: getXCoordinate(line._p1, timeScale, candleData),
    y: series.priceToCoordinate(line._p1.price),
  };
  const p2Coord = {
    x: getXCoordinate(line._p2, timeScale, candleData),
    y: series.priceToCoordinate(line._p2.price),
  };
  const pointCoord = {
    x: getXCoordinate(point, timeScale, candleData),
    y: series.priceToCoordinate(point.price),
  };

  // If any coordinate is null, the point is not near
  if (
    p1Coord.x === null ||
    p1Coord.y === null ||
    p2Coord.x === null ||
    p2Coord.y === null ||
    pointCoord.x === null ||
    pointCoord.y === null
  ) {
    return { near: false, onPoint: null };
  }

  // Check if the point is near the first endpoint
  const dist1 = Math.hypot(pointCoord.x - p1Coord.x, pointCoord.y - p1Coord.y);
  if (dist1 <= threshold) return { near: true, onPoint: 0 };

  // Check if the point is near the second endpoint
  const dist2 = Math.hypot(pointCoord.x - p2Coord.x, pointCoord.y - p2Coord.y);
  if (dist2 <= threshold) return { near: true, onPoint: 1 };

  // Check if the point is near the line body (not endpoints)
  const dx = p2Coord.x - p1Coord.x;
  const dy = p2Coord.y - p1Coord.y;
  const lenSq = dx * dx + dy * dy;

  // If the line is a point (zero length), return not near
  if (lenSq === 0) return { near: false, onPoint: null }; // p1 and p2 are the same

  // Find the projection of the point onto the line segment
  const t =
    ((pointCoord.x - p1Coord.x) * dx + (pointCoord.y - p1Coord.y) * dy) / lenSq;

  // If the projection is outside the segment, it's not on the line body
  if (t < 0 || t > 1) {
    return { near: false, onPoint: null };
  }

  // Calculate the coordinates of the projection
  const projX = p1Coord.x + t * dx;
  const projY = p1Coord.y + t * dy;

  // Calculate the distance from the point to the projection
  const distToLine = Math.hypot(pointCoord.x - projX, pointCoord.y - projY);

  // Return true if the point is close enough to the line body
  return { near: distToLine <= threshold, onPoint: null };
}
