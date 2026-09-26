export interface StochasticResult {
  readonly k: number;
  readonly d: number;
}

/**
 * Calculates the Stochastic Oscillator (%K and %D).
 *
 * @param prices Sequential closing prices (oldest first).
 * @param period Lookback window for %K (default 14).
 * @param smoothD Smoothing period for %D (default 3).
 */
export function calculateStochastic(
  prices: readonly number[],
  period = 14,
  smoothD = 3,
): StochasticResult {
  if (!prices || prices.length < 2) {
    return { k: 50, d: 50 };
  }

  const effectivePeriod = Math.min(period, prices.length);
  const kValues: number[] = [];

  for (let i = effectivePeriod; i <= prices.length; i++) {
    const window = prices.slice(i - effectivePeriod, i);
    const highest = Math.max(...window);
    const lowest = Math.min(...window);
    const current = window[window.length - 1];

    const k = highest !== lowest ? ((current - lowest) / (highest - lowest)) * 100 : 50;
    kValues.push(k);
  }

  if (kValues.length === 0) {
    return { k: 50, d: 50 };
  }

  const currentK = kValues[kValues.length - 1];
  const dWindow = kValues.slice(-Math.min(smoothD, kValues.length));
  const currentD = dWindow.reduce((a, b) => a + b, 0) / dWindow.length;

  return {
    k: Number(currentK.toFixed(2)),
    d: Number(currentD.toFixed(2)),
  };
}
