// helpers.js - Utility functions for rectangle (box) hit-testing and geometry
import { getXCoordinate } from "../../helpers/coordinateUtils.js";

/**
 * Checks if a logical point ({time, price, logicalIndex}) is near the border of a rectangle (box).
 * Returns true if the point is within a certain percent of the width/height from the border.
 * This function works with hybrid coordinate system supporting both time and logical coordinates.
 */
export function isPointNearRectangleBorder(
  point,
  box,
  chart,
  series,
  percent = 0.05,
) {
  const { price } = point;
  if (!price) return false;

  // Convert logical coordinates to screen coordinates for accurate distance calculation
  const timeScale = chart.timeScale();
  const candleData = box._candleData;

  const pointX = getXCoordinate(point, timeScale, candleData);
  const p1X = getXCoordinate(box._p1, timeScale, candleData);
  const p2X = getXCoordinate(box._p2, timeScale, candleData);

  // If any coordinate conversion fails, we can't determine proximity
  if (pointX === null || p1X === null || p2X === null) {
    return false;
  }

  const pointY = series.priceToCoordinate(price);
  const p1Y = series.priceToCoordinate(box._p1.price);
  const p2Y = series.priceToCoordinate(box._p2.price);

  const minX = Math.min(p1X, p2X);
  const maxX = Math.max(p1X, p2X);
  const minY = Math.min(p1Y, p2Y);
  const maxY = Math.max(p1Y, p2Y);

  if (pointX < minX || pointX > maxX || pointY < minY || pointY > maxY)
    return false;

  const width = maxX - minX;
  const height = maxY - minY;
  const xThreshold = width * percent;
  const yThreshold = height * percent;

  const nearLeft = Math.abs(pointX - minX) <= xThreshold;
  const nearRight = Math.abs(pointX - maxX) <= xThreshold;
  const nearTop = Math.abs(pointY - minY) <= yThreshold;
  const nearBottom = Math.abs(pointY - maxY) <= yThreshold;

  // Only consider near if on the border, not inside
  return (
    (nearLeft || nearRight || nearTop || nearBottom) &&
    // Not in the center (not near two borders at once)
    !(nearLeft && nearRight) &&
    !(nearTop && nearBottom)
  );
}

/**
 * Checks if a logical point ({time, price, logicalIndex}) is near a corner of a rectangle (box).
 * Returns the corner object if near, otherwise null.
 * This function works with hybrid coordinate system supporting both time and logical coordinates.
 */
export function isPointNearRectangleCorner(
  point,
  box,
  chart,
  series,
  percent = 0.05,
) {
  const { price } = point;
  if (!price) return null;

  // Convert logical coordinates to screen coordinates for accurate distance calculation
  const timeScale = chart.timeScale();
  const candleData = box._candleData;

  const pointX = getXCoordinate(point, timeScale, candleData);
  const p1X = getXCoordinate(box._p1, timeScale, candleData);
  const p2X = getXCoordinate(box._p2, timeScale, candleData);

  // If any coordinate conversion fails, we can't determine proximity
  if (pointX === null || p1X === null || p2X === null) {
    return null;
  }

  const pointY = series.priceToCoordinate(price);
  const p1Y = series.priceToCoordinate(box._p1.price);
  const p2Y = series.priceToCoordinate(box._p2.price);

  const minX = Math.min(p1X, p2X);
  const maxX = Math.max(p1X, p2X);
  const minY = Math.min(p1Y, p2Y);
  const maxY = Math.max(p1Y, p2Y);

  const width = maxX - minX;
  const height = maxY - minY;
  const xThreshold = width * percent;
  const yThreshold = height * percent;

  // Screen-space corners
  const corners = [
    { name: "topLeft", x: minX, y: minY },
    { name: "topRight", x: maxX, y: minY },
    { name: "bottomLeft", x: minX, y: maxY },
    { name: "bottomRight", x: maxX, y: maxY },
  ];

  for (const corner of corners) {
    if (
      Math.abs(pointX - corner.x) <= xThreshold &&
      Math.abs(pointY - corner.y) <= yThreshold
    ) {
      return corner;
    }
  }
  return null;
}

/**
 * Checks if a logical point ({time, price, logicalIndex}) is near a midpoint of a rectangle (box).
 * Returns the name of the midpoint if near, otherwise null.
 * This function works with hybrid coordinate system supporting both time and logical coordinates.
 */
export function isPointNearRectangleMidpoint(
  point,
  box,
  chart,
  series,
  percent = 0.05,
) {
  const { price } = point;
  if (!price) return null;

  // Convert logical coordinates to screen coordinates for accurate distance calculation
  const timeScale = chart.timeScale();
  const candleData = box._candleData;

  const pointX = getXCoordinate(point, timeScale, candleData);
  const p1X = getXCoordinate(box._p1, timeScale, candleData);
  const p2X = getXCoordinate(box._p2, timeScale, candleData);

  // If any coordinate conversion fails, we can't determine proximity
  if (pointX === null || p1X === null || p2X === null) {
    return null;
  }

  const pointY = series.priceToCoordinate(price);
  const p1Y = series.priceToCoordinate(box._p1.price);
  const p2Y = series.priceToCoordinate(box._p2.price);

  const minX = Math.min(p1X, p2X);
  const maxX = Math.max(p1X, p2X);
  const minY = Math.min(p1Y, p2Y);
  const maxY = Math.max(p1Y, p2Y);

  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const width = maxX - minX;
  const height = maxY - minY;
  const xThreshold = width * percent;
  const yThreshold = height * percent;

  // Screen-space midpoints
  const midpoints = [
    { name: "top", x: midX, y: minY },
    { name: "bottom", x: midX, y: maxY },
    { name: "left", x: minX, y: midY },
    { name: "right", x: maxX, y: midY },
  ];

  for (const midpoint of midpoints) {
    if (
      Math.abs(pointX - midpoint.x) <= xThreshold &&
      Math.abs(pointY - midpoint.y) <= yThreshold
    ) {
      return midpoint.name;
    }
  }
  return null;
}
