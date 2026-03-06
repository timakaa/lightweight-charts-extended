// index.js - Implements the LongPositionDrawingTool for managing long position drawing interactions on the chart
import { BasePositionDrawingTool } from "../position-base/BasePositionDrawingTool.js";
import { LongPosition } from "./LongPosition.js";

/**
 * LongPositionDrawingTool - Drawing tool for creating long position primitives
 *
 * Extends BasePositionDrawingTool with long position-specific logic.
 * Uses single-click workflow: calculates 1:1 RR (risk/reward) position
 */
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
      options,
      onPositionsChange,
      onPositionCreated,
      candleData,
      activeResizeHandleRef,
      LongPosition,
    );
  }

  /**
   * Get the drawing type for store persistence
   */
  _getDrawingType() {
    return "long_position";
  }

  /**
   * Calculate target and stop prices for long position (1:1 RR)
   * For long: target is above entry, stop is below entry
   */
  _calculatePrices(entryPrice) {
    const riskRewardRatio = 1.0; // 1:1 RR
    const riskPercent = 0.01; // 1% risk

    const risk = entryPrice * riskPercent;
    const reward = risk * riskRewardRatio;

    return {
      targetPrice: entryPrice + reward, // Above entry for long
      stopPrice: entryPrice - risk, // Below entry for long
    };
  }
}
