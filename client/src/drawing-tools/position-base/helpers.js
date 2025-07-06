// helpers.js - Utility functions for position hit-testing and info panel drawing

export function isPointInBox({ x, y }, box) {
  if (!box) return false;
  return (
    x >= box.x &&
    x <= box.x + box.width &&
    y >= box.y &&
    y <= box.y + box.height
  );
}

export function isPointNearLine({ x, y }, line, tolerance = 6) {
  if (!line) return false;
  // Calculate distance from point to line segment
  const { x1, x2, y: ly } = line;
  if (x < Math.min(x1, x2) - tolerance || x > Math.max(x1, x2) + tolerance)
    return false;
  const dist = Math.abs(y - ly);
  return dist <= tolerance;
}

export function isPointInCircle({ x, y }, center, radius) {
  if (!center || center.x == null || center.y == null) return false;
  const dx = x - center.x;
  const dy = y - center.y;
  return dx * dx + dy * dy <= radius * radius;
}

export function isPointInRect({ x, y }, rect, radius) {
  if (!rect || rect.x == null || rect.y == null) return false;
  return (
    x >= rect.x - radius &&
    x <= rect.x + radius &&
    y >= rect.y - radius &&
    y <= rect.y + radius
  );
}

// Helper to draw info panel (like ruler)
export function drawLabel(
  ctx,
  x,
  y,
  textLines,
  color,
  above = true,
  offset = 4,
) {
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
  const rectY = above ? y - height - offset : y + offset;
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
  // Draw text vertically centered
  ctx.fillStyle = "#fff";
  const totalTextHeight = textLines.length * lineHeight;
  const textStartY = rectY + (height - totalTextHeight) / 2;
  textLines.forEach((line, i) => {
    ctx.fillText(line, x, textStartY + i * lineHeight);
  });
  ctx.restore();
}
