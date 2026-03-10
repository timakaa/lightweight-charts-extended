import { BaseDrawingTool } from "../BaseDrawingTool.js";
import { ConstraintMixin } from "../mixins/ConstraintMixin.js";
import { Line, PreviewLine } from "./Line.js";

// Apply the ConstraintMixin to BaseDrawingTool
const BaseWithConstraint = ConstraintMixin(BaseDrawingTool);

export class LineDrawingTool extends BaseWithConstraint {
  get _lines() {
    return this._primitives;
  }

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

  getDrawingType() {
    return "line";
  }

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

  setSelectedLineId(selectedLineId) {
    this.setSelectedPrimitiveId(selectedLineId);
  }

  // The mixin provides _getSecondPoint, startDrawing, stopDrawing,
  // _onMouseDown, _onKeyDown, _onKeyUp automatically!

  _onClick = (param) => {
    if (!param.point) return;
    if (!this._p1) {
      this._p1 = this._getPoint(param);
      if (!this._p1) return;
    } else {
      this._p2 = this._getSecondPoint(param);
      if (!this._p2) return;

      const newPrimitive = this.createPrimitive(this._p1, this._p2);
      if (this._options && Object.keys(this._options).length > 0)
        newPrimitive.applyOptions(this._options);

      this._series.attachPrimitive(newPrimitive);
      this._primitives.add(newPrimitive);
      this._savePrimitiveToStore(newPrimitive);

      if (this._onPrimitivesChange)
        this._onPrimitivesChange([...this._primitives]);
      if (this._onPrimitiveCreated) this._onPrimitiveCreated(newPrimitive);
      if (this._onToolChanged) this._onToolChanged();

      this._onDrawingFinished();
      this._p1 = null;
      this._p2 = null;
      this._isSnapping = false;
    }
  };

  _onCrosshairMove = (param) => {
    if (!this._p1 || !param.point) return;
    // Store for constraint updates (mixin needs this)
    this._lastCrosshairParam = param;

    this._p2 = this._getSecondPoint(param);
    if (!this._p2) return;

    if (!this._previewPrimitive) {
      this._previewPrimitive = this.createPreviewPrimitive(this._p1, this._p2);
      if (this._options && Object.keys(this._options).length > 0)
        this._previewPrimitive.applyOptions(this._options);
      this._series.attachPrimitive(this._previewPrimitive);
    } else {
      this._previewPrimitive.updateEndPoint(this._p2);
      if (this._previewPrimitive.setSelectedLineId)
        this._previewPrimitive.setSelectedLineId(this._selectedPrimitiveId);
    }
  };

  _removeLine(line) {
    this._removePrimitive(line);
  }

  _removeLineFromChartOnly(line) {
    this._removePrimitiveFromChartOnly(line);
  }

  _removePreviewLine() {
    this._removePreviewPrimitive();
  }
}
