export interface IchimokuResult {
  readonly tenkan: number;
  readonly kijun: number;
  readonly senkouA: number;
  readonly senkouB: number;
  readonly chikou: number;
}

/**
 * Calculates Ichimoku Kinko Hyo components.
 *
 * @param prices Sequential closing prices (oldest first).
 * @param tenkanPeriod Lookback for Tenkan-sen (default 9).
 * @param kijunPeriod Lookback for Kijun-sen (default 26).
 * @param senkouBPeriod Lookback for Senkou Span B (default 52).
 */
export function calculateIchimoku(
  prices: readonly number[],
  tenkanPeriod = 9,
  kijunPeriod = 26,
  senkouBPeriod = 52,
): IchimokuResult {
  if (!prices || prices.length === 0) {
    return { tenkan: 0, kijun: 0, senkouA: 0, senkouB: 0, chikou: 0 };
  }

  const currentPrice = prices[prices.length - 1];

  const getMidpoint = (period: number): number => {
    const effective = Math.min(period, prices.length);
    const window = prices.slice(-effective);
    const high = Math.max(...window);
    const low = Math.min(...window);
    return (high + low) / 2;
  };

  const tenkan = getMidpoint(tenkanPeriod);
  const kijun = getMidpoint(kijunPeriod);
  const senkouA = (tenkan + kijun) / 2;
  const senkouB = getMidpoint(senkouBPeriod);
  const chikou = currentPrice;

  return {
    tenkan: Number(tenkan.toFixed(2)),
    kijun: Number(kijun.toFixed(2)),
    senkouA: Number(senkouA.toFixed(2)),
    senkouB: Number(senkouB.toFixed(2)),
    chikou: Number(chikou.toFixed(2)),
  };
}
