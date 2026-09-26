import { calculateSMA } from "./sma";

export interface CrossoversResult {
  readonly goldenCross: boolean;
  readonly deathCross: boolean;
}

/**
 * Evaluates moving average crossover conditions (Golden Cross and Death Cross).
 *
 * @param prices Sequential closing prices (oldest first).
 * @param fastPeriod Fast MA window (default 50 or scaled).
 * @param slowPeriod Slow MA window (default 200 or scaled).
 */
export function calculateCrossovers(
  prices: readonly number[],
  fastPeriod = 50,
  slowPeriod = 200,
): CrossoversResult {
  if (!prices || prices.length < 5) {
    return { goldenCross: false, deathCross: false };
  }

  // Scale down periods if history is shorter (e.g. 20 and 50 for shorter timeframes)
  let fast = fastPeriod;
  let slow = slowPeriod;

  if (prices.length < slow) {
    slow = Math.max(Math.floor(prices.length * 0.8), 4);
    fast = Math.max(Math.floor(slow / 2), 2);
  }

  // Current values
  const currentFast = calculateSMA(prices, fast);
  const currentSlow = calculateSMA(prices, slow);

  // Previous values (1 candle prior)
  const prevPrices = prices.slice(0, prices.length - 1);
  const prevFast = calculateSMA(prevPrices, fast);
  const prevSlow = calculateSMA(prevPrices, slow);

  const goldenCross = prevFast <= prevSlow && currentFast > currentSlow;
  const deathCross = prevFast >= prevSlow && currentFast < currentSlow;

  return {
    goldenCross,
    deathCross,
  };
}
