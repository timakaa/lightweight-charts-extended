// index.js - Implements the ShortPositionDrawingTool for managing short position drawing interactions on the chart
import { BasePositionDrawingTool } from "../position-base/BasePositionDrawingTool.js";
import { ShortPosition } from "./ShortPosition.js";

/**
 * ShortPositionDrawingTool - Drawing tool for creating short position primitives
 *
 * Extends BasePositionDrawingTool with short position-specific logic.
 * Uses single-click workflow: calculates 1:1 RR (risk/reward) position
 */
export class ShortPositionDrawingTool extends BasePositionDrawingTool {
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
      options,
      onPositionsChange,
      onPositionCreated,
      candleData,
      activeResizeHandleRef,
      ShortPosition,
    );
  }

  /**
   * Get the drawing type for store persistence
   */
  _getDrawingType() {
    return "short_position";
  }

  /**
   * Calculate target and stop prices for short position (1:1 RR)
   * For short: target is below entry, stop is above entry
   */
  _calculatePrices(entryPrice) {
    const riskRewardRatio = 1.0; // 1:1 RR
    const riskPercent = 0.01; // 1% risk

    const risk = entryPrice * riskPercent;
    const reward = risk * riskRewardRatio;

    return {
      targetPrice: entryPrice - reward, // Below entry for short
      stopPrice: entryPrice + risk, // Above entry for short
    };
  }
}
