export interface SupportResistanceLevels {
  readonly supportLevels: readonly number[];
  readonly resistanceLevels: readonly number[];
}

export class SupportResistanceService {
  /**
   * Detects key horizontal support and resistance levels from swing pivots and price action.
   * STRICT GUARANTEE: Support levels are always strictly BELOW currentPrice.
   * Resistance levels are always strictly ABOVE currentPrice.
   *
   * @param prices Array of sequential closing prices (oldest first).
   * @param window Pivot lookback window (default 3).
   * @param clusterTolerancePct Percentage threshold to cluster nearby price touches (default 1.2%).
   * @param priceAnchor Optional explicit current price anchor.
   */
  public analyze(
    prices: readonly number[],
    window = 3,
    clusterTolerancePct = 1.2,
    priceAnchor?: number,
  ): SupportResistanceLevels {
    if (!prices || prices.length === 0) {
      const anchor = priceAnchor && priceAnchor > 0 ? priceAnchor : 84000;
      return this.synthesizeDynamicLevels(anchor);
    }

    const currentPrice = priceAnchor && priceAnchor > 0 ? priceAnchor : prices[prices.length - 1];
    const swingHighs: number[] = [];
    const swingLows: number[] = [];

    // 1. Identify pivot highs and pivot lows across historical bars
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

    // Include recent high/low
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    swingHighs.push(maxPrice);
    swingLows.push(minPrice);

    // 2. Cluster nearby pivots
    const cluster = (pivots: number[]): number[] => {
      const sorted = [...pivots].filter((v) => v > 0).sort((a, b) => a - b);
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

    // STRICT FILTER: Resistances MUST be > currentPrice, Supports MUST be < currentPrice
    const rawResistance = allLevels
      .filter((lvl) => lvl > currentPrice * 1.003)
      .sort((a, b) => a - b); // Nearest first

    const rawSupport = allLevels
      .filter((lvl) => lvl < currentPrice * 0.997)
      .sort((a, b) => b - a); // Nearest first

    // 3. If there are fewer than 2 historical levels in either direction, supplement with psychological round numbers
    const finalResistance = [...rawResistance];
    const finalSupport = [...rawSupport];

    // Supplement resistance if needed (e.g. price is near 30-day ATH)
    if (finalResistance.length < 2) {
      const nextRound = Math.ceil(currentPrice / 1000) * 1000;
      const res1 = nextRound <= currentPrice ? nextRound + 1000 : nextRound;
      const res2 = Math.round(currentPrice * 1.035);
      const res3 = Math.round(currentPrice * 1.065);

      for (const r of [res1, res2, res3]) {
        if (r > currentPrice && !finalResistance.some((existing) => Math.abs(existing - r) / r < 0.01)) {
          finalResistance.push(r);
        }
      }
      finalResistance.sort((a, b) => a - b);
    }

    // Supplement support if needed (e.g. price is near 30-day ATL)
    if (finalSupport.length < 2) {
      const prevRound = Math.floor(currentPrice / 1000) * 1000;
      const sup1 = prevRound >= currentPrice ? prevRound - 1000 : prevRound;
      const sup2 = Math.round(currentPrice * 0.965);
      const sup3 = Math.round(currentPrice * 0.935);

      for (const s of [sup1, sup2, sup3]) {
        if (s < currentPrice && !finalSupport.some((existing) => Math.abs(existing - s) / s < 0.01)) {
          finalSupport.push(s);
        }
      }
      finalSupport.sort((a, b) => b - a);
    }

    return {
      supportLevels: finalSupport.filter((s) => s < currentPrice).slice(0, 4),
      resistanceLevels: finalResistance.filter((r) => r > currentPrice).slice(0, 4),
    };
  }

  /**
   * Generates clean psychological support and resistance anchored at current price.
   */
  private synthesizeDynamicLevels(currentPrice: number): SupportResistanceLevels {
    const roundStep = currentPrice > 50000 ? 1000 : 500;
    const baseRound = Math.round(currentPrice / roundStep) * roundStep;

    const r1 = baseRound >= currentPrice ? baseRound + roundStep : baseRound + roundStep;
    const r2 = r1 + roundStep * 2;
    const r3 = Math.round(currentPrice * 1.05);

    const s1 = baseRound <= currentPrice ? baseRound - roundStep : baseRound - roundStep * 2;
    const s2 = s1 - roundStep * 2;
    const s3 = Math.round(currentPrice * 0.95);

    return {
      supportLevels: [s1, s2, s3].filter((s) => s < currentPrice),
      resistanceLevels: [r1, r2, r3].filter((r) => r > currentPrice),
    };
  }
}

export const supportResistanceService = new SupportResistanceService();
