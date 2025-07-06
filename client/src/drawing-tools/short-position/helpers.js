// Most helpers are identical to long, but profit/loss logic is swapped for short
import {
  isPointInBox,
  isPointNearLine,
  isPointInCircle,
  isPointInRect,
} from "../position-base/helpers.js";
import { getXCoordinate } from "../../helpers/coordinateUtils.js";

// Gets the specific handle being hovered over (custom for short)
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

  const entryHandlePos = { x: entryX, y: entryLine.y }; // "entry-left"
  const widthHandlePos = { x: targetX, y: entryLine.y }; // "entry-right"
  // For short: profit handle is at the BOTTOM of the profit box, loss handle is at the TOP of the loss box
  // But the resize logic expects 'profit-top-left' to control stop (loss) and 'loss-bottom-left' to control target (profit)
  // So we swap the handle names here for correct behavior
  const profitBoxHandle = {
    x: entryX,
    y: profitBox.y + profitBox.height,
  };
  const lossBoxHandle = {
    x: entryX,
    y: lossBox.y,
  };

  // Check for hover on the anchor handle ("entry-left") - ALWAYS a circle
  if (isPointInCircle({ x, y }, entryHandlePos, detectionRadius)) {
    return "entry-left";
  }

  // Check for hover on the width handle ("entry-right") - ALWAYS a square
  if (isPointInRect({ x, y }, widthHandlePos, detectionRadius)) {
    return "entry-right";
  }

  // For short: swap handle names for correct resize logic
  if (isPointInRect({ x, y }, profitBoxHandle, detectionRadius)) {
    return "loss-bottom-left";
  }
  if (isPointInRect({ x, y }, lossBoxHandle, detectionRadius)) {
    return "profit-top-left";
  }

  return null;
}

// New helper to check if point is on the main body (excluding handles)
export function isPointOnShortPositionBody(
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

  // For short: profit is below entry, loss is above
  return (
    isPointInBox({ x, y }, profitBox) ||
    isPointInBox({ x, y }, lossBox) ||
    isPointNearLine({ x, y }, entryLine)
  );
}

// Main helper function to check if a point is on any part of the short position drawing
export function isPointOnShortPosition(logicalPoint, position, chart, series) {
  if (!logicalPoint || !position || !chart || !series) return false;

  // First check if point is on the main body
  if (isPointOnShortPositionBody(logicalPoint, position, chart, series)) {
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
