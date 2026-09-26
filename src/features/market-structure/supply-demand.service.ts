import type { OrderBlock } from "./types";

export interface SupplyDemandResult {
  readonly demandBlocks: readonly OrderBlock[];
  readonly supplyBlocks: readonly OrderBlock[];
}

export class SupplyDemandService {
  /**
   * Identifies institutional supply and demand order blocks.
   *
   * @param prices Array of sequential closing prices.
   * @param thresholdPct Minimum expansion impulse required to confirm order block (default 1.5%).
   */
  public analyze(prices: readonly number[], thresholdPct = 1.5): SupplyDemandResult {
    if (!prices || prices.length < 6) {
      return { demandBlocks: [], supplyBlocks: [] };
    }

    const demandBlocks: OrderBlock[] = [];
    const supplyBlocks: OrderBlock[] = [];
    const currentPrice = prices[prices.length - 1];

    for (let i = 2; i < prices.length - 1; i++) {
      const pPrev = prices[i - 1];
      const pCurr = prices[i];
      const pNext = prices[i + 1];

      // Bullish Impulse (Demand Block): Down/consolidation candle followed by explosive upward push
      const impulseUpPct = ((pNext - pCurr) / pCurr) * 100;
      if (impulseUpPct >= thresholdPct && pCurr <= pPrev) {
        const isMitigated = currentPrice < pCurr * 0.99;
        demandBlocks.push({
          price: Math.round(pCurr),
          low: Math.round(pCurr * 0.995),
          high: Math.round(pCurr * 1.005),
          mitigated: isMitigated,
        });
      }

      // Bearish Impulse (Supply Block): Up/consolidation candle followed by sharp drop
      const impulseDownPct = ((pCurr - pNext) / pCurr) * 100;
      if (impulseDownPct >= thresholdPct && pCurr >= pPrev) {
        const isMitigated = currentPrice > pCurr * 1.01;
        supplyBlocks.push({
          price: Math.round(pCurr),
          low: Math.round(pCurr * 0.995),
          high: Math.round(pCurr * 1.005),
          mitigated: isMitigated,
        });
      }
    }

    // Unmitigated blocks prioritized, latest first
    const activeDemand = demandBlocks
      .filter((b) => !b.mitigated && b.price <= currentPrice * 1.02)
      .slice(-4)
      .reverse();

    const activeSupply = supplyBlocks
      .filter((b) => !b.mitigated && b.price >= currentPrice * 0.98)
      .slice(-4)
      .reverse();

    return {
      demandBlocks: activeDemand.length > 0 ? activeDemand : demandBlocks.slice(-3).reverse(),
      supplyBlocks: activeSupply.length > 0 ? activeSupply : supplyBlocks.slice(-3).reverse(),
    };
  }
}

export const supplyDemandService = new SupplyDemandService();
