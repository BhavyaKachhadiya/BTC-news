import { IndicatorError } from "@/shared/errors/app-error";

export interface OHLCBar {
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

/**
 * Calculates Average True Range (ATR).
 *
 * @param bars Sequential array of OHLC bars or price points.
 * @param period Lookback window (default 14).
 * @returns ATR value.
 */
export function calculateATR(bars: readonly OHLCBar[], period = 14): number {
  if (period <= 0) {
    throw new IndicatorError("ATR", "Period must be greater than 0");
  }

  if (bars.length < period + 1) {
    throw new IndicatorError(
      "ATR",
      `Insufficient data: received ${bars.length} bars, requires at least ${period + 1}`,
    );
  }

  const trueRanges: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const current = bars[i];
    const prev = bars[i - 1];

    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close),
    );
    trueRanges.push(tr);
  }

  // Initial ATR is simple average of first `period` true ranges
  let atr = 0;
  for (let i = 0; i < period; i++) {
    atr += trueRanges[i];
  }
  atr /= period;

  // Wilder's smoothing
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }

  return Number(atr.toFixed(2));
}

/**
 * Synthesizes OHLC bars from an array of sequential closing prices.
 */
export function synthesizeBarsFromPrices(prices: readonly number[]): OHLCBar[] {
  return prices.map((price, idx) => {
    const prev = idx > 0 ? prices[idx - 1] : price;
    const high = Math.max(price, prev);
    const low = Math.min(price, prev);
    return { high, low, close: price };
  });
}
