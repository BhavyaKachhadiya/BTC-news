import { calculateEMA } from "./ema";

export interface MACDResult {
  readonly macd: number;
  readonly signal: number;
  readonly histogram: number;
}

/**
 * Calculates Moving Average Convergence Divergence (MACD).
 * Standard parameters: Fast EMA = 12, Slow EMA = 26, Signal EMA = 9.
 *
 * @param prices Sequential closing prices (oldest first).
 * @param fastPeriod Lookback for fast EMA (default 12).
 * @param slowPeriod Lookback for slow EMA (default 26).
 * @param signalPeriod Lookback for signal EMA (default 9).
 */
export function calculateMACD(
  prices: readonly number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MACDResult {
  if (!prices || prices.length < 2) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  // Gracefully scale periods if fewer prices are available
  const effectiveSlow = Math.min(slowPeriod, Math.max(prices.length - 1, 2));
  const effectiveFast = Math.min(fastPeriod, Math.max(Math.floor(effectiveSlow / 2), 1));
  const effectiveSignal = Math.min(signalPeriod, Math.max(Math.floor(prices.length / 3), 2));

  // Compute MACD line over recent sliding window
  const minRequired = effectiveSlow + effectiveSignal;
  const windowLength = Math.max(prices.length, minRequired);

  // Calculate sliding MACD values
  const macdSeries: number[] = [];
  const startIdx = Math.max(0, prices.length - 30);

  for (let i = startIdx + effectiveSlow; i <= prices.length; i++) {
    const sub = prices.slice(0, i);
    const fastEma = calculateEMA(sub, effectiveFast);
    const slowEma = calculateEMA(sub, effectiveSlow);
    macdSeries.push(fastEma - slowEma);
  }

  if (macdSeries.length === 0) {
    const fast = calculateEMA(prices, effectiveFast);
    const slow = calculateEMA(prices, effectiveSlow);
    const macdVal = Number((fast - slow).toFixed(2));
    return { macd: macdVal, signal: macdVal, histogram: 0 };
  }

  const currentMacd = macdSeries[macdSeries.length - 1];
  const sigPeriod = Math.min(effectiveSignal, macdSeries.length);
  const currentSignal = calculateEMA(macdSeries, sigPeriod);
  const histogram = currentMacd - currentSignal;

  return {
    macd: Number(currentMacd.toFixed(2)),
    signal: Number(currentSignal.toFixed(2)),
    histogram: Number(histogram.toFixed(2)),
  };
}
