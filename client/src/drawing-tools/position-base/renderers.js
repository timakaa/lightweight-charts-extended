// renderers.js - Rendering logic for axis overlays for position tools (generic)
import { positionsBox } from "../positions.js";
// PositionAxisPaneRenderer draws the filled axis overlay for the position (price or time axis)
export class PositionAxisPaneRenderer {
  constructor(p1, p2, fillColor, vertical) {
    this._p1 = p1;
    this._p2 = p2;
    this._fillColor = fillColor || "rgba(0, 100, 255, 0.4)";
    this._vertical = vertical;
  }

  // Draws the axis overlay on the chart
  draw(target) {
    target.useBitmapCoordinateSpace((scope) => {
      if (this._p1 === null || this._p2 === null) return;
      const ctx = scope.context;
      ctx.globalAlpha = 1;
      const positions = positionsBox(
        this._p1,
        this._p2,
        this._vertical ? scope.verticalPixelRatio : scope.horizontalPixelRatio,
      );
      ctx.fillStyle = this._fillColor;
      if (this._vertical) {
        ctx.fillRect(0, positions.position, 15, positions.length);
      } else {
        ctx.fillRect(positions.position, 0, positions.length, 15);
      }
    });
  }
}
