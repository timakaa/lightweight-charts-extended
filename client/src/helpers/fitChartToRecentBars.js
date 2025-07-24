// fitChartToRecentBars.js
// Helper to fit chart to last N real candles and fit price axis using built-in autoscale

export function fitChartToRecentBars(
  chart,
  series,
  candleData,
  barsToShow = 200,
  rightOffset = 10,
) {
  if (!chart || !series || !candleData || !candleData.length) return;
  // Sort candles by time ascending
  const sortedCandles = [...candleData].sort((a, b) => a.time - b.time);
  // Only count real candles (with open property)
  const realCandles = sortedCandles.filter((c) => c.open !== undefined);
  const realBars = realCandles.length;
  if (realBars > 0) {
    const lastReal = realCandles[realBars - 1];
    const firstIdx = Math.max(0, realBars - barsToShow);
    const firstReal = realCandles[firstIdx];
    // Calculate interval between real candles (default to 1 if not available)
    let interval = 1;
    if (realBars > 1) {
      interval = realCandles[1].time - realCandles[0].time;
    }
    // Ensure price scale is set to autoscale
    if (series.priceScale && series.priceScale().applyOptions) {
      series.priceScale().applyOptions({ autoScale: true });
    }
    // Set visible time range to last 200 bars
    chart
      .timeScale()
      .setVisibleRange(
        { from: firstReal.time, to: lastReal.time + rightOffset * interval },
        { animation: false },
      );
  }
}
