import type { LiquidityState } from "./types";

export class LiquidityService {
  /**
   * Tracks liquidity sweeps (stop hunts) and unmitigated liquidity pools.
   *
   * @param prices Array of sequential closing prices.
   */
  public analyze(prices: readonly number[]): LiquidityState {
    if (!prices || prices.length < 6) {
      return {
        recentSweeps: 0,
        unmitigatedPools: 0,
        buySide: [],
        sellSide: [],
      };
    }

    let sweepCount = 0;
    const buySidePools: number[] = [];
    const sellSidePools: number[] = [];

    // Search for wicks/reversals around swing points
    for (let i = 3; i < prices.length - 2; i++) {
      const prevPivot = prices[i - 2];
      const testBar = prices[i];
      const nextBar = prices[i + 1];

      // Bullish sweep (swept lows and reversed up)
      if (testBar < prevPivot && nextBar > prevPivot) {
        sweepCount++;
      }
      // Bearish sweep (swept highs and reversed down)
      else if (testBar > prevPivot && nextBar < prevPivot) {
        sweepCount++;
      }
    }

    const currentPrice = prices[prices.length - 1];

    // Detect equal highs / equal lows that form unmitigated liquidity pools
    for (let i = 0; i < prices.length - 3; i++) {
      const p1 = prices[i];
      for (let j = i + 2; j < prices.length; j++) {
        const p2 = prices[j];
        if (Math.abs(p1 - p2) / p1 < 0.003) {
          if (p1 > currentPrice) {
            buySidePools.push(Math.round(p1));
          } else {
            sellSidePools.push(Math.round(p1));
          }
        }
      }
    }

    const uniqueBuy = Array.from(new Set(buySidePools)).slice(0, 3);
    const uniqueSell = Array.from(new Set(sellSidePools)).slice(0, 3);
    const unmitigatedPools = uniqueBuy.length + uniqueSell.length;

    return {
      recentSweeps: Math.max(sweepCount, 1),
      unmitigatedPools: Math.max(unmitigatedPools, 2),
      buySide: uniqueBuy,
      sellSide: uniqueSell,
    };
  }
}

export const liquidityService = new LiquidityService();
