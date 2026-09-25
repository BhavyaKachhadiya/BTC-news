import { IndicatorError } from "@/shared/errors/app-error";

/**
 * Calculates Wilder's Relative Strength Index (RSI).
 *
 * @param prices Array of sequential closing prices (oldest first).
 * @param period Lookback period (default 14).
 * @returns RSI value between 0 and 100.
 */
export function calculateRSI(prices: readonly number[], period = 14): number {
  if (period <= 0) {
    throw new IndicatorError("RSI", "Period must be greater than 0");
  }

  if (prices.length < period + 1) {
    throw new IndicatorError(
      "RSI",
      `Insufficient data: received ${prices.length} prices, requires at least ${period + 1}`,
    );
  }

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Initial average gain/loss
  let totalGain = 0;
  let totalLoss = 0;
  for (let i = 0; i < period; i++) {
    const diff = changes[i];
    if (diff > 0) totalGain += diff;
    else totalLoss += Math.abs(diff);
  }

  let avgGain = totalGain / period;
  let avgLoss = totalLoss / period;

  // Wilder's smoothing for subsequent periods
  for (let i = period; i < changes.length; i++) {
    const diff = changes[i];
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
  }

  if (avgLoss === 0) {
    return 100;
  }
  if (avgGain === 0) {
    return 0;
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return Number(rsi.toFixed(2));
}
