// renderers.js - Rendering logic for ruler primitives on the chart
import { positionsBox } from "../positions.js";

// Helper to draw an arrow with an arrowhead
function drawArrow(ctx, fromX, fromY, toX, toY, arrowLength = 16) {
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Arrowhead
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - arrowLength * Math.cos(angle - Math.PI / 8),
    toY - arrowLength * Math.sin(angle - Math.PI / 8),
  );
  ctx.lineTo(
    toX - arrowLength * Math.cos(angle + Math.PI / 8),
    toY - arrowLength * Math.sin(angle + Math.PI / 8),
  );
  ctx.lineTo(toX, toY);
  ctx.fill();
}

// Helper to draw a label with background and text
function drawLabel(ctx, x, y, textLines, color, above = true) {
  ctx.save();
  ctx.font = "300 24px Arial";
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  const paddingX = 22;
  const paddingY = 12;
  const lineHeight = 32;
  const width =
    Math.max(...textLines.map((t) => ctx.measureText(t).width)) + paddingX * 2;
  const height = textLines.length * lineHeight + paddingY * 2;
  const rectX = x - width / 2;
  const rectY = above ? y - height - 16 : y + 16;
  // Draw rounded rectangle
  ctx.beginPath();
  const radius = 14;
  ctx.moveTo(rectX + radius, rectY);
  ctx.lineTo(rectX + width - radius, rectY);
  ctx.quadraticCurveTo(rectX + width, rectY, rectX + width, rectY + radius);
  ctx.lineTo(rectX + width, rectY + height - radius);
  ctx.quadraticCurveTo(
    rectX + width,
    rectY + height,
    rectX + width - radius,
    rectY + height,
  );
  ctx.lineTo(rectX + radius, rectY + height);
  ctx.quadraticCurveTo(rectX, rectY + height, rectX, rectY + height - radius);
  ctx.lineTo(rectX, rectY + radius);
  ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  // Draw text
  ctx.fillStyle = "#fff";
  textLines.forEach((line, i) => {
    ctx.fillText(line, x, rectY + paddingY + i * lineHeight);
  });
  ctx.restore();
}

// Helper to format the time difference between two points
function formatTimeDiff(t1, t2) {
  const diff = Math.abs(t2 - t1);
  const sign = t2 < t1 ? "-" : "";
  // If time looks like a timestamp (seconds since epoch, > 10^9), show days/hours
  if (t1 > 1e9 && t2 > 1e9) {
    const seconds = diff;
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    let human = "";
    if (days > 0) human += `${days}d `;
    human += `${hours}h`;
    return sign + human;
  }
  // Otherwise, just show bars
  return `${sign}${diff} bars`;
}

// Helper to calculate bar count between two points using logical indices
function calculateBarCount(p1, p2, candleData) {
  if (!candleData || !Array.isArray(candleData) || candleData.length === 0) {
    return null;
  }

  let logicalIndex1 = p1.logicalIndex;
  let logicalIndex2 = p2.logicalIndex;

  // If logical indices aren't available, calculate them from time
  if (logicalIndex1 === undefined || logicalIndex1 === null) {
    // Find closest candle time or extrapolate position
    const time1 = p1.time;
    if (time1 !== null && time1 !== undefined) {
      // Try to find exact match first
      let foundIndex = candleData.findIndex((c) => c.time === time1);

      if (foundIndex !== -1) {
        logicalIndex1 = foundIndex;
      } else {
        // Calculate logical index from time position
        if (candleData.length >= 2) {
          const interval = candleData[1].time - candleData[0].time;
          if (time1 < candleData[0].time) {
            // Before first candle
            logicalIndex1 = (time1 - candleData[0].time) / interval;
          } else if (time1 > candleData[candleData.length - 1].time) {
            // After last candle
            const extraSteps =
              (time1 - candleData[candleData.length - 1].time) / interval;
            logicalIndex1 = candleData.length - 1 + extraSteps;
          } else {
            // Between candles - find the interpolated position
            for (let i = 0; i < candleData.length - 1; i++) {
              if (
                time1 >= candleData[i].time &&
                time1 <= candleData[i + 1].time
              ) {
                const progress =
                  (time1 - candleData[i].time) /
                  (candleData[i + 1].time - candleData[i].time);
                logicalIndex1 = i + progress;
                break;
              }
            }
          }
        }
      }
    }
  }

  // Same logic for p2
  if (logicalIndex2 === undefined || logicalIndex2 === null) {
    const time2 = p2.time;
    if (time2 !== null && time2 !== undefined) {
      let foundIndex = candleData.findIndex((c) => c.time === time2);

      if (foundIndex !== -1) {
        logicalIndex2 = foundIndex;
      } else {
        if (candleData.length >= 2) {
          const interval = candleData[1].time - candleData[0].time;
          if (time2 < candleData[0].time) {
            logicalIndex2 = (time2 - candleData[0].time) / interval;
          } else if (time2 > candleData[candleData.length - 1].time) {
            const extraSteps =
              (time2 - candleData[candleData.length - 1].time) / interval;
            logicalIndex2 = candleData.length - 1 + extraSteps;
          } else {
            for (let i = 0; i < candleData.length - 1; i++) {
              if (
                time2 >= candleData[i].time &&
                time2 <= candleData[i + 1].time
              ) {
                const progress =
                  (time2 - candleData[i].time) /
                  (candleData[i + 1].time - candleData[i].time);
                logicalIndex2 = i + progress;
                break;
              }
            }
          }
        }
      }
    }
  }

  // Calculate bar count from logical indices
  if (
    logicalIndex1 !== null &&
    logicalIndex1 !== undefined &&
    logicalIndex2 !== null &&
    logicalIndex2 !== undefined
  ) {
    // Convert to absolute bar count (starts from 0)
    const barCount = Math.abs(
      Math.round(logicalIndex2) - Math.round(logicalIndex1),
    );
    return barCount;
  }

  return null;
}

// RulerPaneRenderer draws the main ruler box, arrows, and label
export class RulerPaneRenderer {
  constructor(p1, p2, source) {
    this._p1 = p1;
    this._p2 = p2;
    this._source = source;
  }

  // Draws the ruler, arrows, and label on the chart
  draw(target) {
    target.useBitmapCoordinateSpace((scope) => {
      if (
        this._p1.x === null ||
        this._p1.y === null ||
        this._p2.x === null ||
        this._p2.y === null
      )
        return;
      const ctx = scope.context;

      // Use positionsBox for pixel-perfect scaling
      const horizontalPositions = positionsBox(
        this._p1.x,
        this._p2.x,
        scope.horizontalPixelRatio,
      );
      const verticalPositions = positionsBox(
        this._p1.y,
        this._p2.y,
        scope.verticalPixelRatio,
      );

      const left = horizontalPositions.position;
      const right = left + horizontalPositions.length;
      const top = verticalPositions.position;
      const bottom = top + verticalPositions.length;

      // --- BOTTOM CORNER COLOR LOGIC ---
      const { _p1, _p2, _series, _chart } = this._source;
      let verticalColor = "rgba(60, 120, 255, 1)";
      let backgroundColor = "rgba(60, 120, 255, 0.25)";
      if (_p2.price < _p1.price) {
        verticalColor = "rgba(255, 60, 60, 1)";
        backgroundColor = "rgba(255, 60, 60, 0.25)";
      }

      // Arrow direction logic
      const timeDelta = _p2.time - _p1.time;
      const priceDelta = _p2.price - _p1.price;
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;
      let horizontalFrom, horizontalTo, verticalFrom, verticalTo;
      // Horizontal arrow
      if (timeDelta >= 0) {
        horizontalFrom = left;
        horizontalTo = right;
      } else {
        horizontalFrom = right;
        horizontalTo = left;
      }
      // Vertical arrow
      let labelAbove = true;
      if (priceDelta >= 0) {
        verticalFrom = bottom;
        verticalTo = top;
        labelAbove = true;
      } else {
        verticalFrom = top;
        verticalTo = bottom;
        labelAbove = false;
      }

      // Draw box (no border, more visible background)
      ctx.setLineDash([]);
      ctx.fillStyle = backgroundColor;
      ctx.beginPath();
      ctx.rect(left, top, right - left, bottom - top);
      ctx.fill();
      // No stroke (border)

      // Draw arrows (horizontal and vertical) at box center
      ctx.lineWidth = 2;
      ctx.strokeStyle = verticalColor;
      ctx.fillStyle = verticalColor;
      ctx.setLineDash([]);
      // Horizontal arrow
      drawArrow(ctx, horizontalFrom, centerY, horizontalTo, centerY);
      // Vertical arrow
      drawArrow(ctx, centerX, verticalFrom, centerX, verticalTo);

      // --- LABEL LOGIC ---
      // Calculate price and time difference
      const priceDiff = _p2.price - _p1.price;
      const priceDiffAbs = Math.abs(priceDiff);
      const priceDiffStr = `${priceDiff >= 0 ? "+" : "-"}${priceDiffAbs.toFixed(
        2,
      )}`;
      // Calculate percentage change
      let percentChangeStr = "";
      if (_p1.price !== 0 && _p1.price !== null && _p1.price !== undefined) {
        const percentChange = (priceDiff / _p1.price) * 100;
        percentChangeStr = `${percentChange >= 0 ? "+" : "-"}${Math.abs(
          percentChange,
        ).toFixed(2)}%`;
      } else {
        percentChangeStr = "N/A";
      }
      const timeDiffStr = formatTimeDiff(_p1.time, _p2.time);
      // Calculate number of bars between the two points using logical indices (hybrid coordinate support)
      let barCountStr = "";
      const candleData = this._source.candleData;
      const barCount = calculateBarCount(_p1, _p2, candleData);

      if (barCount !== null) {
        barCountStr = `Bars: ${barCount}`;
      } else {
        barCountStr = "Bars: N/A";
      }
      // Compose label lines: price diff with percent change, then bar count as 'N bars, time diff'
      let barsAndTimeStr = "";
      if (barCountStr.startsWith("Bars: ")) {
        const num = barCountStr.replace("Bars: ", "");
        barsAndTimeStr = `${num} bars, ${timeDiffStr}`;
      } else {
        barsAndTimeStr = `${barCountStr}, ${timeDiffStr}`;
      }
      const labelLines = [
        `${priceDiffStr} (${percentChangeStr})`,
        barsAndTimeStr,
      ];
      // Draw label
      drawLabel(
        ctx,
        centerX,
        labelAbove ? top : bottom,
        labelLines,
        verticalColor,
        labelAbove,
      );
    });
  }
}
