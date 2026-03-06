import { BaseDrawingTool } from "../BaseDrawingTool.js";
import { Line, PreviewLine } from "./Line.js";

/**
 * LineDrawingTool - Drawing tool for creating line primitives
 *
 * Extends BaseDrawingTool with line-specific logic:
 * - Creates Line and PreviewLine primitives
 * - Provides line-specific store data format
 */
export class LineDrawingTool extends BaseDrawingTool {
  // Expose _lines for backward compatibility with existing code
  get _lines() {
    return this._primitives;
  }

  /**
   * Create a new Line primitive
   */
  createPrimitive(p1, p2) {
    return new Line(
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
   * Create a preview Line primitive
   */
  createPreviewPrimitive(p1, p2) {
    return new PreviewLine(
      p1,
      p2,
      this._series,
      this._chart,
      this._selectedPrimitiveId,
      this._candleData,
    );
  }

  /**
   * Get the drawing type for store persistence
   */
  getDrawingType() {
    return "line";
  }

  /**
   * Get the store data for a line primitive
   */
  getStoreData(line) {
    return {
      startTime: new Date(line._p1.time * 1000).toISOString(),
      endTime: new Date(line._p2.time * 1000).toISOString(),
      startPrice: line._p1.price,
      endPrice: line._p2.price,
      style: {
        color: line._options.color,
        width: line._options.width || 2,
        style: "solid",
      },
    };
  }

  /**
   * Set the selected line ID (backward compatibility)
   */
  setSelectedLineId(selectedLineId) {
    this.setSelectedPrimitiveId(selectedLineId);
  }

  /**
   * Remove a line (backward compatibility)
   */
  _removeLine(line) {
    this._removePrimitive(line);
  }

  /**
   * Remove a line from chart only (backward compatibility)
   */
  _removeLineFromChartOnly(line) {
    this._removePrimitiveFromChartOnly(line);
  }

  /**
   * Remove preview line (backward compatibility)
   */
  _removePreviewLine() {
    this._removePreviewPrimitive();
  }
}
