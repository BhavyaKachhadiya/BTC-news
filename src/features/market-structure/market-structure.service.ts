import type { MarketStructureState } from "./types";
import { supportResistanceService } from "./support-resistance.service";
import { supplyDemandService } from "./supply-demand.service";
import { liquidityService } from "./liquidity.service";
import { volumeProfileService } from "./volume-profile.service";
import { riskManagementService } from "./risk-management.service";
import { psychologyService } from "./psychology.service";

// Baseline benchmark BTC price series if none provided in isolated tests/queries
const DEFAULT_PRICES = [
  91200, 91800, 91500, 92400, 93100, 92800, 93500, 94200, 93900, 94600,
  95200, 94900, 95800, 96400, 96100, 96800, 97400, 97100, 97900, 98500,
  98200, 98900, 99400, 99100, 99800, 100400, 100100, 100900, 101500, 101200,
];

export class MarketStructureService {
  /**
   * Performs complete institutional market structure analysis.
   *
   * @param inputPrices Optional sequential closing prices (uses baseline if omitted).
   * @param volumes Optional corresponding volumes.
   */
  public analyze(
    inputPrices?: readonly number[],
    volumes?: readonly number[],
  ): MarketStructureState {
    const prices = inputPrices && inputPrices.length >= 10 ? inputPrices : DEFAULT_PRICES;
    const currentPrice = prices[prices.length - 1];

    // 1. Detect Support & Resistance Levels
    const { supportLevels, resistanceLevels } = supportResistanceService.analyze(prices);

    // 2. Detect Institutional Supply & Demand Order Blocks
    const { demandBlocks, supplyBlocks } = supplyDemandService.analyze(prices);

    // 3. Detect Liquidity Sweeps & Unmitigated Pools
    const liquidity = liquidityService.analyze(prices);

    // 4. Calculate Volume Profile (POC, VAH, VAL)
    const volumeProfile = volumeProfileService.analyze(prices, volumes);

    // 5. Calculate Volatility Risk & Suggested R/R
    const nearestSupport = supportLevels.length > 0 ? supportLevels[0] : Math.round(currentPrice * 0.98);
    const nearestResistance = resistanceLevels.length > 0 ? resistanceLevels[0] : Math.round(currentPrice * 1.02);
    const riskMetrics = riskManagementService.analyze(prices, nearestSupport, nearestResistance);

    // 6. Evaluate Market Psychology & Wyckoff Phase
    const psychology = psychologyService.analyze(prices);

    // 7. Determine Macro Structure (Higher Highs / Higher Lows vs Lower Highs / Lower Lows)
    let structure: "bullish" | "bearish" | "ranging" = "ranging";
    const recentWindow = prices.slice(-15);
    const firstHalf = recentWindow.slice(0, Math.floor(recentWindow.length / 2));
    const secondHalf = recentWindow.slice(Math.floor(recentWindow.length / 2));

    const high1 = Math.max(...firstHalf);
    const low1 = Math.min(...firstHalf);
    const high2 = Math.max(...secondHalf);
    const low2 = Math.min(...secondHalf);

    if (high2 > high1 && low2 > low1 && currentPrice > firstHalf[firstHalf.length - 1]) {
      structure = "bullish";
    } else if (high2 < high1 && low2 < low1 && currentPrice < firstHalf[firstHalf.length - 1]) {
      structure = "bearish";
    } else {
      structure = "ranging";
    }

    return {
      structure,
      supportLevels,
      resistanceLevels,
      demandBlocks,
      supplyBlocks,
      liquidity,
      volumeProfile,
      riskMetrics,
      psychology,
    };
  }
}

export const marketStructureService = new MarketStructureService();
