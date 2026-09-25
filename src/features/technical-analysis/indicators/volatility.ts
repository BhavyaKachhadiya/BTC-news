import { IndicatorError } from "@/shared/errors/app-error";

/**
 * Calculates historical price return volatility (standard deviation of daily/step returns).
 *
 * @param prices Sequential closing prices.
 * @param window Lookback window (default 14).
 * @returns Volatility percentage (e.g. 3.25 for 3.25%).
 */
export function calculateVolatility(prices: readonly number[], window = 14): number {
  if (prices.length < window + 1) {
    throw new IndicatorError(
      "Volatility",
      `Insufficient data: received ${prices.length} prices, requires at least ${window + 1}`,
    );
  }

  const subset = prices.slice(-(window + 1));
  const returns: number[] = [];

  for (let i = 1; i < subset.length; i++) {
    const prev = subset[i - 1];
    if (prev <= 0) continue;
    returns.push((subset[i] - prev) / prev);
  }

  if (returns.length === 0) return 0;

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1 || 1);
  const stdDev = Math.sqrt(variance);

  // Return standard deviation as percentage
  return Number((stdDev * 100).toFixed(2));
}

/**
 * Calculates percentage price change between two points or over a window.
 */
export function calculatePriceChange(prices: readonly number[], window = 1): number {
  if (prices.length < window + 1) {
    return 0;
  }
  const current = prices[prices.length - 1];
  const previous = prices[prices.length - 1 - window];
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

/**
 * Calculates volume change ratio or percentage between recent volume and past average.
 */
export function calculateVolumeChange(volumes: readonly number[]): number {
  if (volumes.length < 2) return 0;
  const current = volumes[volumes.length - 1];
  const previous = volumes[volumes.length - 2];
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}
