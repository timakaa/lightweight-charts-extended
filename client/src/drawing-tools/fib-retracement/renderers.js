// renderers.js - Rendering logic for fib retracement drawing tool
import { positionsBox } from "../positions.js";

/**
 * FibRetracementPaneRenderer - Renders fib retracement on the main chart pane
 *
 * Draws horizontal lines for each fib level with labels:
 * - Background rectangle covering all levels
 * - Horizontal lines for each fib level with custom colors
 * - Level labels on the left side
 */
export class FibRetracementPaneRenderer {
  constructor(p1, p2, options) {
    this._p1 = p1;
    this._p2 = p2;
    this._options = options;
  }

  /**
   * Draws the fib retracement on the chart
   * @param {object} target - Chart rendering target
   */
  draw(target) {
    target.useBitmapCoordinateSpace((scope) => {
      // Skip if any coordinates are null
      if (
        this._p1.x === null ||
        this._p1.y === null ||
        this._p2.x === null ||
        this._p2.y === null
      )
        return;

      const ctx = scope.context;

      // Calculate horizontal positions for the retracement
      const horizontalPositions = positionsBox(
        this._p1.x,
        this._p2.x,
        scope.horizontalPixelRatio,
      );
      const y1 = scope.verticalPixelRatio * this._p1.y;
      const y2 = scope.verticalPixelRatio * this._p2.y;
      const x1 = horizontalPositions.position;
      const x2 = horizontalPositions.position + horizontalPositions.length;

      // Define levels and their custom colors
      const fibLevels = this._options.fibLevels;
      const levelColors = this._options.levelColors;
      const levels = fibLevels.map((level) => ({
        value: level,
        y: y1 + (y2 - y1) * (1 - level),
        color: levelColors[level] || this._options.lineColor,
      }));

      // Draw rectangle background from lowest to highest level
      const yValues = levels.map((l) => l.y);
      const minY = Math.min(...yValues);
      const maxY = Math.max(...yValues);
      ctx.save();
      ctx.fillStyle = this._options.fillColor;
      ctx.fillRect(x1, minY, x2 - x1, maxY - minY);
      ctx.restore();

      // Draw horizontal lines for each fib level
      for (const level of levels) {
        ctx.save();
        ctx.strokeStyle = level.color;
        ctx.lineWidth = 2 * scope.verticalPixelRatio;
        ctx.beginPath();
        ctx.moveTo(x1, level.y);
        ctx.lineTo(x2, level.y);
        ctx.stroke();

        // Draw label for the level on the left side
        ctx.font = `${
          this._options.labelFontSize * scope.verticalPixelRatio
        }px ${this._options.labelFont}`;
        ctx.fillStyle = level.color;
        ctx.textBaseline = "middle";
        ctx.textAlign = "right";
        ctx.fillText(
          level.value.toString(),
          x1 - 8 * scope.horizontalPixelRatio,
          level.y,
        );
        ctx.restore();
      }
    });
  }
}

/**
 * FibRetracementHandlesPaneRenderer - Renders resize handles for fib retracements
 *
 * Draws resize handles at the start and end points:
 * - Handles at p1 and p2 positions
 * - Hides handles that are currently being dragged
 */
export class FibRetracementHandlesPaneRenderer {
  constructor(p1, p2, options, activeResizeHandle) {
    this._p1 = p1;
    this._p2 = p2;
    this._options = options;
    this._activeResizeHandle = activeResizeHandle;
  }

  /**
   * Draws the handles on the chart
   * @param {object} target - Chart rendering target
   */
  draw(target) {
    // Only draw handles if enabled
    if (!this._options.showHandles) return;

    target.useBitmapCoordinateSpace((scope) => {
      // Skip if any coordinates are null
      if (
        this._p1.x === null ||
        this._p1.y === null ||
        this._p2.x === null ||
        this._p2.y === null
      )
        return;

      const ctx = scope.context;
      ctx.save();
      ctx.fillStyle = this._options.handleFillColor || "#fff";
      ctx.strokeStyle = this._options.handleStrokeColor || "#000";
      ctx.lineWidth =
        (this._options.handleStrokeWidth || 2) * scope.verticalPixelRatio;
      const radius =
        (this._options.handleRadius || 5) * scope.verticalPixelRatio;

      // Define handles for p1 and p2 points (matching resize hook naming)
      const handles = [
        {
          name: "p1",
          x: scope.horizontalPixelRatio * this._p1.x,
          y: scope.verticalPixelRatio * this._p1.y,
        },
        {
          name: "p2",
          x: scope.horizontalPixelRatio * this._p2.x,
          y: scope.verticalPixelRatio * this._p2.y,
        },
      ];

      // Draw each handle, skipping the one currently being dragged
      handles.forEach((handle) => {
        if (handle.name === this._activeResizeHandle) return;

        ctx.beginPath();
        ctx.arc(handle.x, handle.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });

      ctx.restore();
    });
  }
}

/**
 * FibRetracementAxisPaneRenderer - Draws the filled axis overlay for fib retracements
 *
 * Renders blue background rectangles on price or time axes:
 * - Price axis: vertical rectangle covering all fib levels
 * - Time axis: horizontal rectangle covering retracement time range
 * - Only visible when retracement is selected or in preview mode
 */
export class FibRetracementAxisPaneRenderer {
  constructor(
    p1,
    p2,
    options,
    vertical,
    fibLevels,
    minPrice,
    maxPrice,
    series,
    p1Price,
    p2Price,
  ) {
    this._p1 = p1;
    this._p2 = p2;
    this._options = options;
    this._vertical = vertical;
    this._fibLevels = fibLevels;
    this._minPrice = minPrice;
    this._maxPrice = maxPrice;
    this._series = series;
    this._p1Price = p1Price;
    this._p2Price = p2Price;
  }

  /**
   * Draws the axis overlay on the chart
   * @param {object} target - Chart rendering target
   */
  draw(target) {
    target.useBitmapCoordinateSpace((scope) => {
      if (this._p1 === null || this._p2 === null) return;
      const ctx = scope.context;
      ctx.globalAlpha = 1;

      if (this._vertical && this._fibLevels && this._fibLevels.length > 0) {
        // Compute min and max price among all fib levels for price axis
        const prices = this._fibLevels.map(
          (level) =>
            this._p1Price + (this._p2Price - this._p1Price) * (1 - level),
        );
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const minY =
          scope.verticalPixelRatio * this._series.priceToCoordinate(minPrice);
        const maxY =
          scope.verticalPixelRatio * this._series.priceToCoordinate(maxPrice);
        const top = Math.min(minY, maxY);
        const height = Math.abs(maxY - minY);

        // Draw vertical rectangle on price axis
        ctx.fillStyle = this._options.axisFillColor;
        ctx.fillRect(0, top, 15, height);
      } else if (this._vertical) {
        // Fallback for price axis without fib levels
        const positions = positionsBox(
          this._p1,
          this._p2,
          scope.verticalPixelRatio,
        );
        ctx.fillStyle = this._options.axisFillColor;
        ctx.fillRect(0, positions.position, 15, positions.length);
      } else {
        // Time axis overlay
        const positions = positionsBox(
          this._p1,
          this._p2,
          scope.horizontalPixelRatio,
        );
        ctx.fillStyle = this._options.axisFillColor;
        ctx.fillRect(positions.position, 0, positions.length, 15);
      }
    });
  }
}
