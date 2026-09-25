import { IndicatorError } from "@/shared/errors/app-error";

/**
 * Calculates Exponential Moving Average (EMA).
 *
 * @param prices Array of sequential closing prices (oldest first).
 * @param period Lookback period.
 * @returns Current EMA value.
 */
export function calculateEMA(prices: readonly number[], period: number): number {
  if (period <= 0) {
    throw new IndicatorError("EMA", "Period must be greater than 0");
  }

  if (prices.length < period) {
    throw new IndicatorError(
      "EMA",
      `Insufficient data: received ${prices.length} prices, requires at least ${period}`,
    );
  }

  const k = 2 / (period + 1);

  // Initial EMA is simple moving average of first `period` elements
  let ema = 0;
  for (let i = 0; i < period; i++) {
    ema += prices[i];
  }
  ema /= period;

  // Apply smoothing factor for remaining elements
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return Number(ema.toFixed(2));
}
