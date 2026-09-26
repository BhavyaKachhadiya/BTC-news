import { calculateATR, synthesizeBarsFromPrices } from "@/features/technical-analysis";
import type { RiskMetricsState } from "./types";

export class RiskManagementService {
  /**
   * Calculates institutional risk parameters (volatility stop, suggested R/R, invalidation).
   *
   * @param prices Array of sequential closing prices.
   * @param nearestSupport Nearest identified support level.
   * @param nearestResistance Nearest identified resistance level.
   */
  public analyze(
    prices: readonly number[],
    nearestSupport?: number,
    nearestResistance?: number,
  ): RiskMetricsState {
    if (!prices || prices.length < 5) {
      return {
        suggestedRR: 2.5,
        volatilityStopPct: 1.5,
        atrRisk: 1000,
        invalidation: 0,
      };
    }

    const currentPrice = prices[prices.length - 1];
    const bars = synthesizeBarsFromPrices(prices);
    const atr14 = calculateATR(bars, Math.min(14, bars.length - 1));

    // Volatility adjusted stop: 1.5x ATR as percentage of price
    const rawStopPct = currentPrice > 0 ? ((atr14 * 1.5) / currentPrice) * 100 : 1.5;
    const volatilityStopPct = Number(Math.max(0.8, Math.min(rawStopPct, 4.5)).toFixed(1));

    // Invalidation level: based on nearest support or 1.5x ATR below current price
    const stopDistance = currentPrice * (volatilityStopPct / 100);
    const invalidation = nearestSupport && nearestSupport < currentPrice
      ? nearestSupport
      : Math.round(currentPrice - stopDistance);

    // Suggested Risk/Reward ratio
    let suggestedRR = 2.5;
    if (nearestResistance && nearestSupport && nearestResistance > currentPrice && currentPrice > nearestSupport) {
      const reward = nearestResistance - currentPrice;
      const risk = currentPrice - nearestSupport;
      if (risk > 0) {
        suggestedRR = Number(Math.max(1.5, Math.min(reward / risk, 4.0)).toFixed(1));
      }
    } else {
      // Default institutional R/R between 2.2 and 3.0 based on trend strength
      suggestedRR = Number((2.4 + (volatilityStopPct > 2.0 ? 0.4 : 0.1)).toFixed(1));
    }

    return {
      suggestedRR,
      volatilityStopPct,
      atrRisk: Math.round(atr14),
      invalidation,
    };
  }
}

export const riskManagementService = new RiskManagementService();
