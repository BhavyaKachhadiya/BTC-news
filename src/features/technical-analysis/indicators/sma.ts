import { IndicatorError } from "@/shared/errors/app-error";

/**
 * Calculates Simple Moving Average (SMA).
 *
 * @param prices Array of sequential closing prices (oldest first).
 * @param period Lookback window size.
 * @returns Current SMA.
 */
export function calculateSMA(prices: readonly number[], period: number): number {
  if (period <= 0) {
    throw new IndicatorError("SMA", "Period must be greater than 0");
  }

  if (prices.length < period) {
    throw new IndicatorError(
      "SMA",
      `Insufficient data: received ${prices.length} prices, requires at least ${period}`,
    );
  }

  const window = prices.slice(-period);
  const sum = window.reduce((acc, val) => acc + val, 0);
  return Number((sum / period).toFixed(2));
}
