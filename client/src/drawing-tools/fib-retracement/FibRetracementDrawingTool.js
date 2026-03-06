import { BaseDrawingTool } from "../BaseDrawingTool.js";
import { FibRetracement } from "./FibRetracement.js";
import { enhancePointWithLogicalIndex } from "@helpers/coordinateUtils.js";

/**
 * PreviewFibRetracement - Temporary retracement shown while drawing
 */
class PreviewFibRetracement extends FibRetracement {
  constructor(p1, p2, series, chart, candleData = null) {
    super(p1, p2, series, chart, null, null, candleData);
  }

  updateEndPoint(p) {
    this._p2 = enhancePointWithLogicalIndex(p, this._candleData);
    if (this.requestUpdate) {
      this.requestUpdate();
    }
  }
}

/**
 * FibRetracementDrawingTool - Drawing tool for creating fibonacci retracement primitives
 *
 * Extends BaseDrawingTool with fib retracement-specific logic:
 * - Creates FibRetracement and PreviewFibRetracement primitives
 * - Provides fib retracement-specific store data format
 */
export class FibRetracementDrawingTool extends BaseDrawingTool {
  // Expose _retracements for backward compatibility with existing code
  get _retracements() {
    return this._primitives;
  }

  /**
   * Create a new FibRetracement primitive
   */
  createPrimitive(p1, p2) {
    return new FibRetracement(
      p1,
      p2,
      this._series,
      this._chart,
      this._selectedPrimitiveId,
      this._activeResizeHandleRef,
      this._candleData,
    );
  }

  /**
   * Create a preview FibRetracement primitive
   */
  createPreviewPrimitive(p1, p2) {
    return new PreviewFibRetracement(
      p1,
      p2,
      this._series,
      this._chart,
      this._candleData,
    );
  }

  /**
   * Get the drawing type for store persistence
   */
  getDrawingType() {
    return "fib_retracement";
  }

  /**
   * Get the store data for a fib retracement primitive
   */
  getStoreData(fib) {
    return {
      startTime: new Date(fib._p1.time * 1000).toISOString(),
      endTime: new Date(fib._p2.time * 1000).toISOString(),
      startPrice: fib._p1.price,
      endPrice: fib._p2.price,
      style: fib._options.style || {},
    };
  }

  /**
   * Set the selected fib retracement ID (backward compatibility)
   */
  setSelectedFibRetracementId(selectedId) {
    this.setSelectedPrimitiveId(selectedId);
  }

  /**
   * Remove a retracement (backward compatibility)
   */
  _removeRetracement(fib) {
    this._removePrimitive(fib);
  }

  /**
   * Remove a retracement from chart only (backward compatibility)
   */
  _removeRetracementFromChartOnly(fib) {
    this._removePrimitiveFromChartOnly(fib);
  }

  /**
   * Remove preview retracement (backward compatibility)
   */
  _removePreviewRetracement() {
    this._removePreviewPrimitive();
  }
}
