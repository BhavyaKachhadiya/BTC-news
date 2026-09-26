import { calculateATR, synthesizeBarsFromPrices, type OHLCBar } from "./atr";

export interface SupertrendResult {
  readonly direction: "bullish" | "bearish";
  readonly stop: number;
}

/**
 * Calculates the Supertrend indicator using ATR trailing stop.
 *
 * @param input Array of sequential closing prices or OHLC bars.
 * @param period ATR lookback period (default 10).
 * @param multiplier ATR multiplier factor (default 3.0).
 */
export function calculateSupertrend(
  input: readonly number[] | readonly OHLCBar[],
  period = 10,
  multiplier = 3.0,
): SupertrendResult {
  if (!input || input.length < 2) {
    return { direction: "bullish", stop: 0 };
  }

  const bars: readonly OHLCBar[] =
    typeof input[0] === "number"
      ? synthesizeBarsFromPrices(input as readonly number[])
      : (input as readonly OHLCBar[]);

  const atr = calculateATR(bars, Math.min(period, bars.length - 1));
  const currentBar = bars[bars.length - 1];
  const midpoint = (currentBar.high + currentBar.low) / 2;

  const basicUpper = midpoint + multiplier * atr;
  const basicLower = midpoint - multiplier * atr;

  let direction: "bullish" | "bearish" = "bullish";
  let stop = basicLower;

  // Track over recent history
  let prevUpper = basicUpper;
  let prevLower = basicLower;

  for (let i = 1; i < bars.length; i++) {
    const bar = bars[i];
    const prevBar = bars[i - 1];
    const barMid = (bar.high + bar.low) / 2;
    const bUpper = barMid + multiplier * atr;
    const bLower = barMid - multiplier * atr;

    const lowerBand = bLower > prevLower || prevBar.close < prevLower ? bLower : prevLower;
    const upperBand = bUpper < prevUpper || prevBar.close > prevUpper ? bUpper : prevUpper;

    if (direction === "bullish") {
      if (bar.close < lowerBand) {
        direction = "bearish";
        stop = upperBand;
      } else {
        stop = lowerBand;
      }
    } else {
      if (bar.close > upperBand) {
        direction = "bullish";
        stop = lowerBand;
      } else {
        stop = upperBand;
      }
    }

    prevUpper = upperBand;
    prevLower = lowerBand;
  }

  return {
    direction,
    stop: Number(stop.toFixed(2)),
  };
}
