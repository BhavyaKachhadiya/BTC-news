import { calculateSMA } from "./sma";

export interface BollingerBandsResult {
  readonly upper: number;
  readonly lower: number;
  readonly bandwidth: number;
  readonly percentB: number;
}

/**
 * Calculates Bollinger Bands (Upper, Lower, Bandwidth, %B).
 *
 * @param prices Sequential closing prices (oldest first).
 * @param period Lookback window size (default 20).
 * @param stdDevMultiplier Number of standard deviations (default 2).
 */
export function calculateBollingerBands(
  prices: readonly number[],
  period = 20,
  stdDevMultiplier = 2,
): BollingerBandsResult {
  if (!prices || prices.length < 2) {
    return { upper: 0, lower: 0, bandwidth: 0, percentB: 0 };
  }

  const effectivePeriod = Math.min(period, prices.length);
  const subset = prices.slice(-effectivePeriod);
  const middle = calculateSMA(prices, effectivePeriod);

  // Calculate population standard deviation
  const variance =
    subset.reduce((acc, val) => acc + Math.pow(val - middle, 2), 0) / effectivePeriod;
  const stdDev = Math.sqrt(variance);

  const upper = middle + stdDevMultiplier * stdDev;
  const lower = Math.max(0, middle - stdDevMultiplier * stdDev);
  const bandwidth = middle > 0 ? ((upper - lower) / middle) * 100 : 0;

  const currentPrice = prices[prices.length - 1];
  const range = upper - lower;
  const percentB = range > 0 ? (currentPrice - lower) / range : 0.5;

  return {
    upper: Number(upper.toFixed(2)),
    lower: Number(lower.toFixed(2)),
    bandwidth: Number(bandwidth.toFixed(2)),
    percentB: Number(percentB.toFixed(4)),
  };
}
