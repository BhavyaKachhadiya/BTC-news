export interface FibonacciRetracementResult {
  readonly r0236: number;
  readonly r0382: number;
  readonly r0500: number;
  readonly r0618: number;
  readonly r0786: number;
}

/**
 * Calculates standard Fibonacci Retracement levels between a swing high and low.
 *
 * @param high Swing high price.
 * @param low Swing low price.
 */
export function calculateFibonacciRetracement(
  high: number,
  low: number,
): FibonacciRetracementResult {
  if (high <= 0 || low <= 0 || high < low) {
    const fallback = Math.max(high, low, 0);
    return {
      r0236: fallback,
      r0382: fallback,
      r0500: fallback,
      r0618: fallback,
      r0786: fallback,
    };
  }

  const diff = high - low;

  return {
    r0236: Number((high - 0.236 * diff).toFixed(2)),
    r0382: Number((high - 0.382 * diff).toFixed(2)),
    r0500: Number((high - 0.500 * diff).toFixed(2)),
    r0618: Number((high - 0.618 * diff).toFixed(2)),
    r0786: Number((high - 0.786 * diff).toFixed(2)),
  };
}
