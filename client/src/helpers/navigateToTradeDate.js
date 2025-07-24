// navigateToTradeDate.js
// Helper to navigate chart to a specific trade's entry time

export function navigateToTradeDate(
  chart,
  candleData,
  tradeEntryTime,
  barsToShow = 200,
) {
  if (!chart || !candleData || !candleData.length || !tradeEntryTime) {
    console.log("Navigation failed - missing requirements");
    return;
  }

  // Convert trade entry time to timestamp if it's a string
  const targetTime =
    typeof tradeEntryTime === "string"
      ? new Date(tradeEntryTime).getTime() / 1000
      : tradeEntryTime;

  console.log("Target time:", targetTime, "Original:", tradeEntryTime);

  // Sort candles by time ascending
  const sortedCandles = [...candleData].sort((a, b) => a.time - b.time);

  // Find the candle closest to the trade entry time
  let closestCandleIndex = -1;
  let minTimeDiff = Infinity;

  for (let i = 0; i < sortedCandles.length; i++) {
    const timeDiff = Math.abs(sortedCandles[i].time - targetTime);
    if (timeDiff < minTimeDiff) {
      minTimeDiff = timeDiff;
      closestCandleIndex = i;
    }
  }

  if (closestCandleIndex === -1) return;

  // Calculate the range to show with trade at the start (left side) of the screen
  const startIndex = Math.max(0, closestCandleIndex - 10); // Show 10 bars before the trade
  const endIndex = Math.min(sortedCandles.length - 1, startIndex + barsToShow);

  const startCandle = sortedCandles[startIndex];
  const endCandle = sortedCandles[endIndex];

  // Calculate interval between candles for padding
  let interval = 1;
  if (sortedCandles.length > 1) {
    interval = sortedCandles[1].time - sortedCandles[0].time;
  }

  // Set visible range with some padding
  const fromTime = startCandle.time - interval;
  const toTime = endCandle.time + interval;

  console.log("Setting visible range:", { from: fromTime, to: toTime });

  // Calculate price range for visible candles
  const visibleCandles = sortedCandles.slice(startIndex, endIndex + 1);
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  visibleCandles.forEach((candle) => {
    if (candle.low < minPrice) minPrice = candle.low;
    if (candle.high > maxPrice) maxPrice = candle.high;
  });

  // Add some padding to the price range (5%)
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.05;
  const adjustedMinPrice = minPrice - padding;
  const adjustedMaxPrice = maxPrice + padding;

  console.log("Setting price range:", {
    min: adjustedMinPrice,
    max: adjustedMaxPrice,
  });

  // Set time range first
  chart.timeScale().setVisibleRange(
    {
      from: fromTime,
      to: toTime,
    },
    { animation: true },
  );

  // Then set price range
  chart.priceScale("right").setVisibleRange({
    from: adjustedMinPrice,
    to: adjustedMaxPrice,
  });
}
