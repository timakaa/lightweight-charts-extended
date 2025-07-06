// index.js - Implements the LongPositionDrawingTool for managing long position drawing interactions on the chart
import { BasePositionDrawingTool } from "../position-base/BasePositionDrawingTool.js";
import { LongPosition } from "./LongPosition.js";
import { useDrawingsStore } from "../../store/drawings.js";
import { useChartStore } from "../../store/chart.js";

// LongPositionDrawingTool manages the creation, drawing, and management of long position primitives on the chart
export class LongPositionDrawingTool extends BasePositionDrawingTool {
  constructor(
    chart,
    series,
    onToolChanged,
    options,
    onPositionsChange,
    onPositionCreated,
    candleData,
    activeResizeHandleRef,
  ) {
    super(
      chart,
      series,
      onToolChanged,
      onPositionsChange,
      onPositionCreated,
      candleData,
      activeResizeHandleRef,
      LongPosition,
    );
  }

  // Remove all positions from the chart
  remove() {
    this._positions.forEach((pos) => this._removePosition(pos));
    this._positions.clear();
  }

  // Remove all positions from chart without removing from store (for ticker/timeframe changes)
  removeFromChartOnly() {
    this._positions.forEach((pos) => this._removePositionFromChartOnly(pos));
    this._positions.clear();
  }

  // Remove a position primitive from chart only (without removing from store)
  _removePositionFromChartOnly(position) {
    this._series.detachPrimitive(position);
    this._positions.delete(position);

    if (this._onPositionsChange) {
      this._onPositionsChange([...this._positions]);
    }
  }

  // Save long position data to persistent store
  _saveLongPositionToStore(position) {
    const { addDrawing } = useDrawingsStore.getState();
    const { ticker } = useChartStore.getState();

    if (!ticker) return;

    const positionData = {
      type: "long_position",
      ticker: ticker.replace("/", ""),
      entry: {
        time: new Date(position._entryPrice.time * 1000).toISOString(),
        price: position._entryPrice.price,
      },
      target: {
        time: new Date(position._targetPrice.time * 1000).toISOString(),
        price: position._targetPrice.price,
      },
      stop: {
        time: new Date(position._stopPrice.time * 1000).toISOString(),
        price: position._stopPrice.price,
      },
      primitiveId: position.id,
      style: {
        // Add any style properties if needed
      },
    };

    addDrawing(positionData);
  }

  // Remove long position data from persistent store
  _removeLongPositionFromStore(position) {
    const { drawings, removeDrawing } = useDrawingsStore.getState();

    // Find the drawing by primitiveId
    const drawing = drawings.find((d) => d.primitiveId === position.id);

    if (drawing) {
      removeDrawing(drawing.id);
    }
  }

  // Override the base class's _createPosition to add store persistence
  _createPosition(entry, target, stop) {
    const position = super._createPosition(entry, target, stop);
    this._saveLongPositionToStore(position);
    return position;
  }

  // Remove a position primitive from the chart and update state
  _removePosition(position) {
    this._series.detachPrimitive(position);
    this._positions.delete(position);

    // Remove from persistent store
    this._removeLongPositionFromStore(position);

    if (this._onPositionsChange) {
      this._onPositionsChange([...this._positions]);
    }
  }

  // Set the selected position ID and notify all positions
  setSelectedPositionId(selectedPositionId) {
    this._selectedPositionId = selectedPositionId;
    this._positions.forEach((position) => {
      if (position && position.setSelectedPositionId) {
        position.setSelectedPositionId(selectedPositionId);
      }
    });
  }

  // Set the hovered position ID and notify all positions
  setHoveredPositionId(hoveredPositionId) {
    this._hoveredPositionId = hoveredPositionId;
    this._positions.forEach((position) => {
      if (position && position.setHoveredPositionId) {
        position.setHoveredPositionId(hoveredPositionId);
      }
    });
  }
}
