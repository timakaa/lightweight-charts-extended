import { BaseDrawingTool } from "../BaseDrawingTool.js";
import { Rectangle, PreviewRectangle } from "./Rectangle.js";

/**
 * RectangleDrawingTool - Drawing tool for creating rectangle primitives
 *
 * Extends BaseDrawingTool with rectangle-specific logic:
 * - Creates Rectangle and PreviewRectangle primitives
 * - Provides rectangle-specific store data format
 */
export class RectangleDrawingTool extends BaseDrawingTool {
  // Expose _rectangles for backward compatibility with existing code
  get _rectangles() {
    return this._primitives;
  }

  /**
   * Create a new Rectangle primitive
   */
  createPrimitive(p1, p2) {
    return new Rectangle(
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
   * Create a preview Rectangle primitive
   */
  createPreviewPrimitive(p1, p2) {
    return new PreviewRectangle(
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
    return "rectangle";
  }

  /**
   * Get the store data for a rectangle primitive
   */
  getStoreData(rectangle) {
    return {
      startTime: new Date(rectangle._p1.time * 1000).toISOString(),
      endTime: new Date(rectangle._p2.time * 1000).toISOString(),
      startPrice: rectangle._p1.price,
      endPrice: rectangle._p2.price,
      style: {
        borderColor: rectangle._options.borderColor || "#FF0000",
        borderWidth: rectangle._options.borderWidth || 2,
        fillColor: rectangle._options.fillColor || "rgba(255, 0, 0, 0.1)",
      },
    };
  }

  /**
   * Set the selected box ID (backward compatibility)
   */
  setSelectedBoxId(selectedBoxId) {
    this.setSelectedPrimitiveId(selectedBoxId);
  }

  /**
   * Remove a rectangle (backward compatibility)
   */
  _removeRectangle(rectangle) {
    this._removePrimitive(rectangle);
  }

  /**
   * Remove a rectangle from chart only (backward compatibility)
   */
  _removeRectangleFromChartOnly(rectangle) {
    this._removePrimitiveFromChartOnly(rectangle);
  }

  /**
   * Remove preview rectangle (backward compatibility)
   */
  _removePreviewRectangle() {
    this._removePreviewPrimitive();
  }
}
