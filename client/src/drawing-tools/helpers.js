export function getSnappedPrice(price, candle) {
  if (!candle || !candle.open) {
    return price;
  }

  const ohlc = [candle.open, candle.high, candle.low, candle.close];
  let closestPrice = ohlc[0];
  let minDiff = Math.abs(price - closestPrice);

  for (let i = 1; i < ohlc.length; i++) {
    const diff = Math.abs(price - ohlc[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closestPrice = ohlc[i];
    }
  }
  return closestPrice;
}
