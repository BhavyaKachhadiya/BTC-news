export interface SupportResistanceLevels {
  readonly supportLevels: readonly number[];
  readonly resistanceLevels: readonly number[];
}

export class SupportResistanceService {
  /**
   * Detects key horizontal support and resistance levels from swing pivots.
   *
   * @param prices Array of sequential closing prices (oldest first).
   * @param window Pivot lookback window (default 3).
   * @param clusterTolerancePct Percentage threshold to cluster nearby price touches (default 1.2%).
   */
  public analyze(
    prices: readonly number[],
    window = 3,
    clusterTolerancePct = 1.2,
  ): SupportResistanceLevels {
    if (!prices || prices.length < 5) {
      return { supportLevels: [], resistanceLevels: [] };
    }

    const currentPrice = prices[prices.length - 1];
    const swingHighs: number[] = [];
    const swingLows: number[] = [];

    // 1. Identify pivot highs and pivot lows
    for (let i = window; i < prices.length - window; i++) {
      const p = prices[i];
      let isHigh = true;
      let isLow = true;

      for (let j = 1; j <= window; j++) {
        if (prices[i - j] >= p || prices[i + j] > p) isHigh = false;
        if (prices[i - j] <= p || prices[i + j] < p) isLow = false;
      }

      if (isHigh) swingHighs.push(p);
      if (isLow) swingLows.push(p);
    }

    // Include recent 24h/recent high and low if not already captured
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    if (!swingHighs.includes(maxPrice)) swingHighs.push(maxPrice);
    if (!swingLows.includes(minPrice)) swingLows.push(minPrice);

    // 2. Cluster pivots within tolerance to prevent clutter
    const cluster = (pivots: number[]): number[] => {
      const sorted = [...pivots].sort((a, b) => a - b);
      const clusters: number[][] = [];

      for (const val of sorted) {
        let placed = false;
        for (const grp of clusters) {
          const avg = grp.reduce((a, b) => a + b, 0) / grp.length;
          if (Math.abs(val - avg) / avg <= clusterTolerancePct / 100) {
            grp.push(val);
            placed = true;
            break;
          }
        }
        if (!placed) clusters.push([val]);
      }

      return clusters
        .map((grp) => Math.round(grp.reduce((a, b) => a + b, 0) / grp.length))
        .sort((a, b) => a - b);
    };

    const allLevels = cluster([...swingHighs, ...swingLows]);

    const resistance = allLevels
      .filter((lvl) => lvl > currentPrice * 1.002)
      .sort((a, b) => a - b); // Nearest first

    const support = allLevels
      .filter((lvl) => lvl < currentPrice * 0.998)
      .sort((a, b) => b - a); // Nearest first

    return {
      supportLevels: support.slice(0, 5),
      resistanceLevels: resistance.slice(0, 5),
    };
  }
}

export const supportResistanceService = new SupportResistanceService();
