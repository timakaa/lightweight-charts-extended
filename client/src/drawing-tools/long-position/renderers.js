// renderers.js - Rendering logic for long position primitives on the chart
import { drawLabel } from "../position-base/helpers.js";
import { getXCoordinate } from "../../helpers/coordinateUtils.js";

// HandlesPaneRenderer draws the resize handles for the long position
export class HandlesPaneRenderer {
  constructor(handles, options, activeResizeHandle) {
    this._handles = handles;
    this._options = options;
    this._activeResizeHandle = activeResizeHandle;
  }

  // Draws the handles on the chart
  draw(target) {
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      ctx.save();
      ctx.fillStyle = this._options.handleFillColor || "#fff";
      ctx.strokeStyle = this._options.handleStrokeColor || "#2196f3";
      ctx.lineWidth =
        (this._options.handleStrokeWidth || 2) * scope.verticalPixelRatio;
      const radius =
        (this._options.handleRadius || 5) * scope.verticalPixelRatio;

      for (const handle of this._handles) {
        if (handle.name === this._activeResizeHandle) continue;
        if (handle.type === "circle") {
          ctx.beginPath();
          ctx.arc(
            handle.x * scope.horizontalPixelRatio,
            handle.y * scope.verticalPixelRatio,
            radius,
            0,
            2 * Math.PI,
          );
          ctx.fill();
          ctx.stroke();
        } else if (handle.type === "rect") {
          ctx.beginPath();
          ctx.rect(
            handle.x * scope.horizontalPixelRatio - radius,
            handle.y * scope.verticalPixelRatio - radius,
            radius * 2,
            radius * 2,
          );
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.restore();
    });
  }
}

// LongPositionPaneRenderer draws the profit/loss boxes, entry line, and info panels for the long position
export class LongPositionPaneRenderer {
  constructor(profitBox, lossBox, entryLine, options, source) {
    this._profitBox = profitBox;
    this._lossBox = lossBox;
    this._entryLine = entryLine;
    this._options = options;
    this._source = source;
  }

  // Draws the long position (profit/loss zones, entry line, and info panels)
  draw(target) {
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      // Draw profit zone
      if (
        this._profitBox &&
        this._profitBox.x != null &&
        this._profitBox.y != null &&
        this._profitBox.width != null &&
        this._profitBox.height != null
      ) {
        ctx.fillStyle = this._options.fillColor;
        ctx.fillRect(
          this._profitBox.x * scope.horizontalPixelRatio,
          this._profitBox.y * scope.verticalPixelRatio,
          this._profitBox.width * scope.horizontalPixelRatio,
          this._profitBox.height * scope.verticalPixelRatio,
        );
      }
      // Draw loss zone
      if (
        this._lossBox &&
        this._lossBox.x != null &&
        this._lossBox.y != null &&
        this._lossBox.width != null &&
        this._lossBox.height != null
      ) {
        ctx.fillStyle = this._options.lossFillColor;
        ctx.fillRect(
          this._lossBox.x * scope.horizontalPixelRatio,
          this._lossBox.y * scope.verticalPixelRatio,
          this._lossBox.width * scope.horizontalPixelRatio,
          this._lossBox.height * scope.verticalPixelRatio,
        );
      }
      // Draw entry line
      if (
        this._entryLine &&
        this._entryLine.x1 != null &&
        this._entryLine.x2 != null &&
        this._entryLine.y != null
      ) {
        ctx.strokeStyle = this._options.entryLineColor || "#00f";
        ctx.lineWidth = 2 * scope.verticalPixelRatio;
        ctx.beginPath();
        ctx.moveTo(
          this._entryLine.x1 * scope.horizontalPixelRatio,
          this._entryLine.y * scope.verticalPixelRatio,
        );
        ctx.lineTo(
          this._entryLine.x2 * scope.horizontalPixelRatio,
          this._entryLine.y * scope.verticalPixelRatio,
        );
        ctx.stroke();

        // TradingView-style dashed line logic
        const paneView = this._source._paneViews && this._source._paneViews[0];
        const candleData = this._source._candleData;
        const entryPrice = this._source._entryPrice?.price;
        const stopPrice = this._source._stopPrice?.price;
        const targetPrice = this._source._targetPrice?.price;
        if (paneView && candleData && Array.isArray(candleData)) {
          const entryTime = this._source._entryPrice?.time;
          const targetTime = this._source._targetPrice?.time;

          // Use hybrid coordinate system for positions that might be outside candle range
          const timeScale = this._source._chart.timeScale();

          // Find indices, allowing for positions outside candle range
          let entryIdx = candleData.findIndex((c) => c.time === entryTime);
          let targetIdx = candleData.findIndex((c) => c.time === targetTime);

          // If either entry or target is outside candle range, use logical indices
          if (
            entryIdx === -1 &&
            this._source._entryPrice?.logicalIndex !== undefined
          ) {
            entryIdx = this._source._entryPrice.logicalIndex;
          }
          if (
            targetIdx === -1 &&
            this._source._targetPrice?.logicalIndex !== undefined
          ) {
            targetIdx = this._source._targetPrice.logicalIndex;
          }

          // Proceed even if indices are outside actual candle data range
          if (entryIdx !== -1 || targetIdx !== -1) {
            // Calculate the bounds for checking candles within position range
            const leftIdx = Math.min(
              entryIdx !== -1 ? entryIdx : 0,
              targetIdx !== -1 ? targetIdx : 0,
            );
            const rightIdx = Math.max(
              entryIdx !== -1 ? entryIdx : candleData.length - 1,
              targetIdx !== -1 ? targetIdx : candleData.length - 1,
            );

            // 1. Find first candle that touches entry (any OHLC) within available data
            let tapIdx = -1;
            const searchStart = Math.max(0, leftIdx);
            const searchEnd = Math.min(candleData.length - 1, rightIdx);

            for (let i = searchStart; i <= searchEnd; ++i) {
              const c = candleData[i];
              // Entry tap: entry price is within candle's range
              if (c && c.low <= entryPrice && entryPrice <= c.high) {
                tapIdx = i;
                break;
              }
            }

            if (tapIdx !== -1) {
              // 2. After tap, check for stop/target hit within available data
              let endX = null;
              let endY = null;
              let hit = false;

              for (let i = tapIdx; i <= searchEnd; ++i) {
                const c = candleData[i];
                if (!c) continue;

                const x =
                  getXCoordinate({ time: c.time }, timeScale, candleData) *
                  scope.horizontalPixelRatio;

                // Stop loss hit
                if (c.low <= stopPrice) {
                  endX = x;
                  endY =
                    this._source._series.priceToCoordinate(stopPrice) *
                    scope.verticalPixelRatio;
                  hit = true;
                  break;
                }
                // Take profit hit
                if (c.high >= targetPrice) {
                  endX = x;
                  endY =
                    this._source._series.priceToCoordinate(targetPrice) *
                    scope.verticalPixelRatio;
                  hit = true;
                  break;
                }
              }

              // 3. If neither hit, check if there are candles beyond position's right border
              if (!hit) {
                let targetCandle = null;

                // Check if there are any candles beyond the position's right border
                let hasCandlesBeyond = false;
                for (let i = rightIdx + 1; i < candleData.length; i++) {
                  const candle = candleData[i];
                  if (candle && candle.close !== undefined) {
                    hasCandlesBeyond = true;
                    break;
                  }
                }

                // If there are candles beyond, point to the position's right border candle
                if (
                  hasCandlesBeyond &&
                  rightIdx >= 0 &&
                  rightIdx < candleData.length
                ) {
                  targetCandle = candleData[rightIdx];
                } else {
                  // Otherwise, find the last available candle
                  for (let i = candleData.length - 1; i >= 0; i--) {
                    const candle = candleData[i];
                    if (candle && candle.close !== undefined) {
                      targetCandle = candle;
                      break;
                    }
                  }
                }

                if (targetCandle && targetCandle.close !== undefined) {
                  endX =
                    getXCoordinate(
                      { time: targetCandle.time },
                      timeScale,
                      candleData,
                    ) * scope.horizontalPixelRatio;
                  endY =
                    this._source._series.priceToCoordinate(targetCandle.close) *
                    scope.verticalPixelRatio;
                }
              }

              if (endX !== null && endY !== null) {
                // Draw from tapIdx candle's x, entry price y, to endX, endY
                const tapCandle = candleData[tapIdx];
                const startX =
                  getXCoordinate(
                    { time: tapCandle.time },
                    timeScale,
                    candleData,
                  ) * scope.horizontalPixelRatio;
                const startY =
                  this._source._series.priceToCoordinate(entryPrice) *
                  scope.verticalPixelRatio;

                // --- HIGHLIGHT AREA LEFT OF ARROW ---
                if (paneView._profitBox && paneView._lossBox) {
                  if (endY < startY) {
                    // Arrow ends in profit box
                    // More opaque profit color
                    let rgba = this._options.fillColor
                      .replace(/rgba?\(([^)]+)\)/, "$1")
                      .split(",");
                    if (rgba.length === 3) rgba.push("0.41"); // fallback
                    else
                      rgba[3] = Math.min(1, parseFloat(rgba[3]) + 0.1).toFixed(
                        2,
                      );
                    ctx.save();
                    ctx.fillStyle = `rgba(${rgba.join(",")})`;
                    const highlightLeft = Math.max(
                      startX,
                      paneView._profitBox.x,
                    );
                    const highlightWidth = endX - highlightLeft;
                    if (highlightWidth > 0) {
                      ctx.beginPath();
                      ctx.rect(
                        highlightLeft,
                        startY,
                        highlightWidth,
                        endY - startY,
                      );
                      ctx.fill();
                    }
                    ctx.restore();
                  } else if (endY > startY) {
                    // Arrow ends in loss box
                    // More opaque loss color
                    let rgba = this._options.lossFillColor
                      .replace(/rgba?\(([^)]+)\)/, "$1")
                      .split(",");
                    if (rgba.length === 3) rgba.push("0.24"); // fallback
                    else
                      rgba[3] = Math.min(1, parseFloat(rgba[3]) + 0.1).toFixed(
                        2,
                      );
                    ctx.save();
                    ctx.fillStyle = `rgba(${rgba.join(",")})`;
                    const highlightLeft = Math.max(startX, paneView._lossBox.x);
                    const highlightWidth = endX - highlightLeft;
                    if (highlightWidth > 0) {
                      ctx.beginPath();
                      ctx.rect(
                        highlightLeft,
                        endY,
                        highlightWidth,
                        startY - endY,
                      );
                      ctx.fill();
                    }
                    ctx.restore();
                  }
                }
                // --- END HIGHLIGHT ---

                ctx.save();
                ctx.strokeStyle =
                  this._options.entryLineTappedColor || "#39FF14";
                ctx.setLineDash(this._options.entryLineTappedDash || [6, 6]);
                ctx.lineWidth = 2 * scope.verticalPixelRatio;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                ctx.setLineDash([]);
                // Draw arrowhead
                const arrowLength = 16; // px
                const angle = Math.atan2(endY - startY, endX - startX);
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                  endX - arrowLength * Math.cos(angle - Math.PI / 8),
                  endY - arrowLength * Math.sin(angle - Math.PI / 8),
                );
                ctx.lineTo(
                  endX - arrowLength * Math.cos(angle + Math.PI / 8),
                  endY - arrowLength * Math.sin(angle + Math.PI / 8),
                );
                ctx.closePath();
                ctx.fillStyle = this._options.entryLineTappedColor || "#39FF14";
                ctx.fill();
                ctx.restore();
              }
            }
          }
        }
        // Info panels: only show if hovered or selected
        const showPanels =
          this._source.isHovered?.(this._source._hoveredPositionId) ||
          this._source.isTargeted?.(this._source._selectedPositionId);
        if (
          showPanels &&
          paneView &&
          paneView._profitBox &&
          paneView._lossBox
        ) {
          // Get chart width in pixels
          const chartWidth = ctx.canvas.width;
          // Helper to clamp X so label is always centered over visible box
          function clampCenterX(centerX, boxWidth) {
            const halfLabel = boxWidth / 2;
            if (centerX - halfLabel < 0) return halfLabel;
            if (centerX + halfLabel > chartWidth) return chartWidth - halfLabel;
            return centerX;
          }
          // Calculate percent changes
          const entry = this._source._entryPrice?.price;
          const target = this._source._targetPrice?.price;
          const stop = this._source._stopPrice?.price;
          let targetPercent = "";
          let stopPercent = "";
          if (entry && target) {
            const pct = ((target - entry) / entry) * 100;
            targetPercent = `${pct >= 0 ? "+" : "-"}${Math.abs(pct).toFixed(
              2,
            )}%`;
          }
          if (entry && stop) {
            const pct = ((stop - entry) / entry) * 100;
            stopPercent = `${pct >= 0 ? "+" : "-"}${Math.abs(pct).toFixed(2)}%`;
          }
          // Profit panel (centered, directly above profit box)
          let profitCenterX =
            (paneView._profitBox.x + paneView._profitBox.width / 2) *
            scope.horizontalPixelRatio;
          const profitY = paneView._profitBox.y * scope.verticalPixelRatio; // top edge in px
          // Loss panel (centered, directly below loss box)
          let lossCenterX =
            (paneView._lossBox.x + paneView._lossBox.width / 2) *
            scope.horizontalPixelRatio;
          const lossY =
            (paneView._lossBox.y + paneView._lossBox.height) *
            scope.verticalPixelRatio; // bottom edge in px
          // Measure label width for clamping
          ctx.save();
          ctx.font = "300 24px Arial";
          const profitLabelWidth =
            ctx.measureText(
              `Target: ${target?.toFixed(2) ?? ""} (${targetPercent})`,
            ).width + 44;
          const lossLabelWidth =
            ctx.measureText(`Stop: ${stop?.toFixed(2) ?? ""} (${stopPercent})`)
              .width + 44;
          ctx.restore();
          profitCenterX = clampCenterX(profitCenterX, profitLabelWidth);
          lossCenterX = clampCenterX(lossCenterX, lossLabelWidth);
          drawLabel(
            ctx,
            profitCenterX,
            profitY,
            [`Target: ${target?.toFixed(2) ?? ""} (${targetPercent})`],
            "rgba(60, 120, 255, 0.95)",
            true,
            16, // offset for more space above profit box
          );
          drawLabel(
            ctx,
            lossCenterX,
            lossY,
            [`Stop: ${stop?.toFixed(2) ?? ""} (${stopPercent})`],
            "rgba(60, 60, 60, 0.95)",
            false,
            16, // offset for more space below loss box
          );
          // --- Risk/Reward/Stats panel ---
          // Show only Risk/Reward Ratio
          let rr = "";
          if (entry && target && stop && entry !== stop) {
            rr = ((target - entry) / (entry - stop)).toFixed(2);
          } else {
            rr = "BE";
          }
          const statsLines = [`Risk/Reward Ratio: ${rr}`];
          // Position: under the entry line, with a small gap
          ctx.save();
          ctx.font = "300 24px Arial";
          const statsLabelWidth =
            Math.max(...statsLines.map((t) => ctx.measureText(t).width)) + 44;
          let statsCenterX =
            ((paneView._entryLine.x1 + paneView._entryLine.x2) / 2) *
            scope.horizontalPixelRatio;
          statsCenterX = clampCenterX(statsCenterX, statsLabelWidth);
          const statsY = paneView._entryLine.y * scope.verticalPixelRatio + 28; // 28px below entry line for more space
          drawLabel(ctx, statsCenterX, statsY, statsLines, "#555", false);
          ctx.restore();
        }
      }
    });
  }
}
