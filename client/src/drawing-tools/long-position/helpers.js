// helpers.js - Utility functions for long position hit-testing and handle logic
import {
  isPointInBox,
  isPointNearLine,
  isPointInCircle,
  isPointInRect,
} from "../position-base/helpers.js";
import { getXCoordinate } from "../../helpers/coordinateUtils.js";

// Gets the specific handle being hovered over for a long position
export function getHoveredHandle(logicalPoint, position, chart, series) {
  if (!logicalPoint || !position || !chart || !series) return null;

  // Convert logical coordinates to screen coordinates using hybrid coordinate system
  const timeScale = chart.timeScale();
  const candleData = position._candleData;
  const y = series.priceToCoordinate(logicalPoint.price);
  const x = getXCoordinate(logicalPoint, timeScale, candleData);

  // If coordinate conversion fails, we can't determine handle proximity
  if (x === null || y === null) return null;

  if (!position._paneViews || !position._paneViews[0]) return null;
  position._paneViews[0].update && position._paneViews[0].update();
  const paneView = position._paneViews[0];

  const {
    _profitBox: profitBox,
    _lossBox: lossBox,
    _entryLine: entryLine,
  } = paneView;
  if (!profitBox || !lossBox || !entryLine) return null;

  const options = position._options || {};
  const handleRadius = options.handleRadius || 5;
  const detectionRadius = handleRadius * 2; // Double the detection tolerance for better UX

  // Define handle screen coordinates using hybrid coordinate conversion
  const entryX = getXCoordinate(position._entryPrice, timeScale, candleData);
  const targetX = getXCoordinate(position._targetPrice, timeScale, candleData);

  // If coordinate conversion fails, we can't determine handle positions
  if (entryX === null || targetX === null) return null;

  const entryHandlePos = { x: entryX, y: entryLine.y }; // Role: "entry-left" (anchor)
  const widthHandlePos = { x: targetX, y: entryLine.y }; // Role: "entry-right" (width)
  const profitBoxHandle = {
    x: entryX,
    y: profitBox.y,
  };
  const lossBoxHandle = {
    x: entryX,
    y: lossBox.y + lossBox.height,
  };

  // Check for hover on the anchor handle ("entry-left") - ALWAYS a circle
  if (isPointInCircle({ x, y }, entryHandlePos, detectionRadius)) {
    return "entry-left";
  }

  // Check for hover on the width handle ("entry-right") - ALWAYS a square
  if (isPointInRect({ x, y }, widthHandlePos, detectionRadius)) {
    return "entry-right";
  }

  // Profit and Loss handles (adjust price levels)
  if (isPointInRect({ x, y }, profitBoxHandle, detectionRadius)) {
    return "profit-top-left";
  }
  if (isPointInRect({ x, y }, lossBoxHandle, detectionRadius)) {
    return "loss-bottom-left";
  }

  return null;
}

// Checks if a point is on the main body (excluding handles) of a long position
export function isPointOnLongPositionBody(
  logicalPoint,
  position,
  chart,
  series,
) {
  if (!logicalPoint || !position || !chart || !series) return false;

  // Convert logical coordinates to screen coordinates using hybrid coordinate system
  const timeScale = chart.timeScale();
  const candleData = position._candleData;
  const y = series.priceToCoordinate(logicalPoint.price);
  const x = getXCoordinate(logicalPoint, timeScale, candleData);

  // If coordinate conversion fails, we can't determine proximity
  if (x === null || y === null) return false;

  // Get the drawing components' screen coordinates from the position's pane view
  if (!position._paneViews || !position._paneViews[0]) return false;
  position._paneViews[0].update && position._paneViews[0].update();
  const paneView = position._paneViews[0];

  const profitBox = paneView._profitBox;
  const lossBox = paneView._lossBox;
  const entryLine = paneView._entryLine;

  // Check only the main bodies
  return (
    isPointInBox({ x, y }, profitBox) ||
    isPointInBox({ x, y }, lossBox) ||
    isPointNearLine({ x, y }, entryLine)
  );
}

// Checks if a point is on any part of the long position drawing (body or handles)
export function isPointOnLongPosition(logicalPoint, position, chart, series) {
  if (!logicalPoint || !position || !chart || !series) return false;

  // First check if point is on the main body
  if (isPointOnLongPositionBody(logicalPoint, position, chart, series)) {
    return true;
  }

  // Then check handles, but only if they are visible
  const handlesVisible =
    (typeof position.isHovered === "function" &&
      position.isHovered(position._hoveredPositionId)) ||
    (typeof position.isTargeted === "function" &&
      position.isTargeted(position._selectedPositionId));

  if (handlesVisible) {
    if (getHoveredHandle(logicalPoint, position, chart, series) !== null) {
      return true;
    }
  }

  return false;
}
export { isPointNearLine };
