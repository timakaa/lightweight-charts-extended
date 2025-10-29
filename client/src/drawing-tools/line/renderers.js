// renderers.js - Rendering logic for line primitives on the chart
import { positionsBox } from "../positions.js";

// LinePaneRenderer draws the main line between two points
export class LinePaneRenderer {
  constructor(p1, p2, color, style = {}) {
    this._p1 = p1;
    this._p2 = p2;
    this._color = color;
    this._style = {
      width: 4,
      lineStyle: "solid",
      ...style,
    };
  }

  // Draws the line on the chart
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
      ctx.save();
      ctx.strokeStyle = this._color;
      ctx.lineWidth = this._style.width * scope.verticalPixelRatio;

      // Set line dash pattern based on style
      switch (this._style.lineStyle) {
        case "dashed":
          ctx.setLineDash([
            10 * scope.horizontalPixelRatio,
            5 * scope.horizontalPixelRatio,
          ]);
          break;
        case "dotted":
          ctx.setLineDash([
            2 * scope.horizontalPixelRatio,
            3 * scope.horizontalPixelRatio,
          ]);
          break;
        case "dashdot":
          ctx.setLineDash([
            10 * scope.horizontalPixelRatio,
            3 * scope.horizontalPixelRatio,
            2 * scope.horizontalPixelRatio,
            3 * scope.horizontalPixelRatio,
          ]);
          break;
        case "solid":
        default:
          ctx.setLineDash([]);
          break;
      }

      // Convert logical coordinates to pixel coordinates
      const x1 = Math.round(this._p1.x * scope.horizontalPixelRatio);
      const y1 = Math.round(this._p1.y * scope.verticalPixelRatio);
      const x2 = Math.round(this._p2.x * scope.horizontalPixelRatio);
      const y2 = Math.round(this._p2.y * scope.verticalPixelRatio);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    });
  }
}

// LineHandlesPaneRenderer draws the resize handles for the line endpoints
export class LineHandlesPaneRenderer {
  constructor(p1, p2, options, activeResizeHandleRef) {
    this._p1 = p1;
    this._p2 = p2;
    this._options = options;
    this._activeResizeHandleRef = activeResizeHandleRef;
  }

  // Draws the handles on the chart
  draw(target) {
    target.useBitmapCoordinateSpace((scope) => {
      if (this._p1.x === null || this._p2.x === null) return;
      const ctx = scope.context;

      ctx.fillStyle = this._options.handleFillColor;
      ctx.strokeStyle = this._options.handleStrokeColor;
      ctx.lineWidth =
        this._options.handleStrokeWidth * scope.verticalPixelRatio;
      const radius = this._options.handleRadius * scope.verticalPixelRatio;

      // Calculate pixel positions for endpoints
      const p1_x = Math.round(this._p1.x * scope.horizontalPixelRatio);
      const p1_y = Math.round(this._p1.y * scope.verticalPixelRatio);
      const p2_x = Math.round(this._p2.x * scope.horizontalPixelRatio);
      const p2_y = Math.round(this._p2.y * scope.verticalPixelRatio);

      const points = [
        { name: "p1", x: p1_x, y: p1_y },
        { name: "p2", x: p2_x, y: p2_y },
      ];

      // Draw each handle, skipping the one currently being dragged
      points.forEach((point) => {
        if (point.name === this._activeResizeHandleRef) return;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });
    });
  }
}

// LineAxisPaneRenderer draws the filled axis overlay for the line (price or time axis)
export class LineAxisPaneRenderer {
  constructor(p1, p2, options, vertical) {
    this._p1 = p1;
    this._p2 = p2;
    this._options = options;
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
      ctx.fillStyle = this._options.axisFillColor;
      if (this._vertical) {
        ctx.fillRect(0, positions.position, 15, positions.length);
      } else {
        ctx.fillRect(positions.position, 0, positions.length, 15);
      }
    });
  }
}
