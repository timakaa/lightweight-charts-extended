/**
 * ConstraintMixin - Adds constraint functionality to drawing tools
 *
 * When Shift key is held:
 * - Lines become horizontal (same price for start and end)
 * - Rectangles become squares (equal width and height)
 *
 * Usage:
 *   class MyTool extends ConstraintMixin(BaseDrawingTool) {
 *     // Your tool implementation
 *   }
 */

export const ConstraintMixin = (Base) =>
  class extends Base {
    _isConstrained = false;
    _lastCrosshairParam = null;

    /**
     * Override to apply constraint to the second point
     * Subclasses can override this to define their own constraint behavior
     */
    applyConstraint(p1, p2) {
      // Default: horizontal line (same price)
      return { ...p2, price: p1.price };
    }

    /**
     * Get second point with optional constraint applied
     */
    _getSecondPoint(param) {
      const p2 = this._getPoint(param);
      if (!p2 || !this._isConstrained || !this._p1) return p2;
      return this.applyConstraint(this._p1, p2);
    }

    /**
     * Start drawing with constraint support
     */
    startDrawing() {
      super.startDrawing();
      const el = this._chart.chartElement();
      if (el) {
        el.addEventListener("mousedown", this._onMouseDown, { capture: true });
      }
    }

    /**
     * Stop drawing and cleanup constraint listeners
     */
    stopDrawing() {
      const el = this._chart.chartElement();
      if (el) {
        el.removeEventListener("mousedown", this._onMouseDown, {
          capture: true,
        });
      }
      super.stopDrawing();
    }

    /**
     * Handle mouse down to detect Shift key
     */
    _onMouseDown = (e) => {
      this._isConstrained = e.shiftKey;
    };

    /**
     * Handle key down for Shift key
     */
    _onKeyDown = (e) => {
      // Call parent key down handler first
      if (super._onKeyDown) {
        super._onKeyDown(e);
      }

      // Handle Shift key for constraints
      if (e.key === "Shift" && !this._isConstrained) {
        this._isConstrained = true;
        // Re-trigger crosshair move to update preview with constraint
        if (this._drawing && this._p1 && this._lastCrosshairParam) {
          this._onCrosshairMove(this._lastCrosshairParam);
        }
      }
    };

    /**
     * Handle key up for Shift key
     */
    _onKeyUp = (e) => {
      // Call parent key up handler first
      if (super._onKeyUp) {
        super._onKeyUp(e);
      }

      // Handle Shift key release
      if (e.key === "Shift" && this._isConstrained) {
        this._isConstrained = false;
        // Re-trigger crosshair move to update preview without constraint
        if (this._drawing && this._p1 && this._lastCrosshairParam) {
          this._onCrosshairMove(this._lastCrosshairParam);
        }
      }
    };

    /**
     * Override crosshair move to store last param for constraint updates
     */
    _onCrosshairMove = (param) => {
      this._lastCrosshairParam = param;
      if (super._onCrosshairMove) {
        super._onCrosshairMove(param);
      }
    };
  };
