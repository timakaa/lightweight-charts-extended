// renderers.js - Rendering logic for rectangle (box) primitives on the chart
import { positionsBox } from "../positions.js";

// HandlesPaneRenderer draws the resize handles (corners and sides) for a rectangle
export class HandlesPaneRenderer {
  constructor(p1, p2, options, activeResizeHandle) {
    this._p1 = p1;
    this._p2 = p2;
    this._options = options;
    this._activeResizeHandle = activeResizeHandle;
  }

  // Draws the handles on the chart
  draw(target) {
    target.useBitmapCoordinateSpace((scope) => {
      if (this._p1.x === null || this._p2.x === null) return;
      const ctx = scope.context;

      // Calculate pixel positions for the rectangle
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

      ctx.fillStyle = this._options.handleFillColor;
      ctx.strokeStyle = this._options.handleStrokeColor;
      ctx.lineWidth =
        this._options.handleStrokeWidth * scope.verticalPixelRatio;
      const radius = this._options.handleRadius * scope.verticalPixelRatio;

      // Calculate handle positions (corners and sides)
      const minX = horizontalPositions.position;
      const minY = verticalPositions.position;
      const maxX = horizontalPositions.position + horizontalPositions.length;
      const maxY = verticalPositions.position + verticalPositions.length;

      const handles = [
        { name: "topLeft", x: minX, y: minY, type: "circle" },
        { name: "topRight", x: maxX, y: minY, type: "circle" },
        { name: "bottomLeft", x: minX, y: maxY, type: "circle" },
        { name: "bottomRight", x: maxX, y: maxY, type: "circle" },
        { name: "top", x: (minX + maxX) / 2, y: minY, type: "rect" },
        { name: "bottom", x: (minX + maxX) / 2, y: maxY, type: "rect" },
        { name: "left", x: minX, y: (minY + maxY) / 2, type: "rect" },
        { name: "right", x: maxX, y: (minY + maxY) / 2, type: "rect" },
      ];

      // Draw each handle, skipping the one currently being dragged
      handles.forEach((handle) => {
        if (handle.name === this._activeResizeHandle) return;

        ctx.beginPath();
        if (handle.type === "circle") {
          ctx.arc(handle.x, handle.y, radius, 0, 2 * Math.PI);
        } else {
          ctx.rect(
            handle.x - radius,
            handle.y - radius,
            radius * 2,
            radius * 2,
          );
        }
        ctx.fill();
        ctx.stroke();
      });
    });
  }
}

// RectanglePaneRenderer draws the filled rectangle and its midline (if enabled)
export class RectanglePaneRenderer {
  constructor(p1, p2, options, source) {
    this._p1 = p1;
    this._p2 = p2;
    this._options = options;
    this._source = source;
  }

  // Draws the rectangle and optional midline on the chart
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
      ctx.fillStyle = this._options.fillColor;
      ctx.fillRect(
        horizontalPositions.position,
        verticalPositions.position,
        horizontalPositions.length,
        verticalPositions.length,
      );

      // Optionally draw a horizontal midline
      if (!this._options.showMidline) return;

      const left = horizontalPositions.position;
      const right = left + horizontalPositions.length;
      const centerY = verticalPositions.position + verticalPositions.length / 2;

      ctx.save();
      ctx.strokeStyle = this._options.midlineColor;
      ctx.lineWidth = this._options.midlineWidth * scope.verticalPixelRatio;
      ctx.setLineDash(this._options.midlineStyle);
      ctx.beginPath();
      ctx.moveTo(left, centerY);
      ctx.lineTo(right, centerY);
      ctx.stroke();
      ctx.restore();
    });
  }
}

// RectangleAxisPaneRenderer draws the filled axis overlay for the rectangle (price or time axis)
export class RectangleAxisPaneRenderer {
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
