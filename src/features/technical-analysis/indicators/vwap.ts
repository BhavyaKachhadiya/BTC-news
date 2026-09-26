export interface VWAPInputBar {
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

/**
 * Calculates Volume Weighted Average Price (VWAP).
 *
 * @param prices Sequential closing prices or array of VWAPInputBar.
 * @param volumes Optional corresponding volumes.
 */
export function calculateVWAP(
  prices: readonly number[] | readonly VWAPInputBar[],
  volumes?: readonly number[],
): number {
  if (!prices || prices.length === 0) return 0;

  // Case 1: Complex OHLCV bars
  if (typeof prices[0] === "object" && prices[0] !== null) {
    const bars = prices as readonly VWAPInputBar[];
    let cumulativeTypicalVolume = 0;
    let cumulativeVolume = 0;

    for (const bar of bars) {
      const typicalPrice = (bar.high + bar.low + bar.close) / 3;
      const vol = bar.volume > 0 ? bar.volume : 1;
      cumulativeTypicalVolume += typicalPrice * vol;
      cumulativeVolume += vol;
    }

    return cumulativeVolume > 0
      ? Number((cumulativeTypicalVolume / cumulativeVolume).toFixed(2))
      : 0;
  }

  // Case 2: Numeric prices array with optional volumes array
  const priceList = prices as readonly number[];
  let cumulativePV = 0;
  let totalVolume = 0;

  for (let i = 0; i < priceList.length; i++) {
    const p = priceList[i];
    const v = volumes && volumes[i] !== undefined && volumes[i] > 0 ? volumes[i] : 1;
    cumulativePV += p * v;
    totalVolume += v;
  }

  return totalVolume > 0 ? Number((cumulativePV / totalVolume).toFixed(2)) : priceList[priceList.length - 1];
}
