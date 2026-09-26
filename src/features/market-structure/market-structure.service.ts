import type { LiquidityBar, MarketStructureState } from "./types";
import { supportResistanceService } from "./support-resistance.service";
import { supplyDemandService } from "./supply-demand.service";
import { liquidityService } from "./liquidity.service";
import { volumeProfileService } from "./volume-profile.service";
import { riskManagementService } from "./risk-management.service";
import { psychologyService } from "./psychology.service";
import { calculateRSI } from "../technical-analysis/indicators/rsi";
import { calculateMACD } from "../technical-analysis/indicators/macd";
import { calculateSupertrend } from "../technical-analysis/indicators/supertrend";
import { calculateBollingerBands } from "../technical-analysis/indicators/bollinger";
import { calculateVWAP } from "../technical-analysis/indicators/vwap";
import { calculateIchimoku } from "../technical-analysis/indicators/ichimoku";
import { calculateStochastic } from "../technical-analysis/indicators/stochastic";
import { calculateADX } from "../technical-analysis/indicators/adx";
import { calculateFibonacciRetracement } from "../technical-analysis/indicators/fibonacci";
import { calculateCrossovers } from "../technical-analysis/indicators/crossovers";
import { calculateElliottWave } from "../technical-analysis/indicators/elliott-wave";

/**
 * Generates dynamic baseline price series relative to an anchor price.
 */
function generateDynamicPrices(anchorPrice: number): number[] {
  const steps = [
    -0.042, -0.035, -0.038, -0.025, -0.018, -0.022, -0.015, -0.008, -0.012,
    -0.005, 0.002, -0.003, 0.008, 0.005, 0.012, 0.008, 0.015, 0.009, 0.018,
    0.012, 0.005, -0.002, 0.004, -0.001, 0.006, 0.002, -0.004, 0.001, -0.002, 0.0,
  ];
  return steps.map((pct) => Math.round(anchorPrice * (1 + pct)));
}

export class MarketStructureService {
  /**
   * Performs complete institutional market structure analysis.
   *
   * @param inputPrices Optional sequential closing prices.
   * @param volumes Optional corresponding volumes.
   * @param priceAnchor Optional explicit current BTC price.
   * @param bars Optional OHLC bars for high-fidelity scalp/swing sweep analysis.
   * @param timeframe Active timeframe horizon (e.g. "15m", "1h", "4h", "1D").
   */
  public analyze(
    inputPrices?: readonly number[],
    volumes?: readonly number[],
    priceAnchor?: number,
    bars?: readonly LiquidityBar[],
    timeframe: string = "15m",
  ): MarketStructureState {
    const effectivePrices =
      bars && bars.length >= 6
        ? bars.map((b) => b.close)
        : inputPrices;

    const effectiveVolumes =
      bars && bars.length >= 6
        ? bars.map((b) => b.volume ?? 0)
        : volumes;

    const currentPrice =
      priceAnchor && priceAnchor > 0
        ? priceAnchor
        : effectivePrices && effectivePrices.length > 0
        ? effectivePrices[effectivePrices.length - 1]
        : 84000;

    const prices =
      effectivePrices && effectivePrices.length >= 10
        ? effectivePrices
        : generateDynamicPrices(currentPrice);

    // 1. Detect Support & Resistance Levels strictly relative to current price
    const { supportLevels, resistanceLevels } = supportResistanceService.analyze(
      prices,
      3,
      1.2,
      currentPrice,
    );

    // 2. Detect Institutional Supply & Demand Order Blocks
    const { demandBlocks, supplyBlocks } = supplyDemandService.analyze(prices);

    // 3. Detect Liquidity Sweeps & Unmitigated Pools
    const liquidity =
      bars && bars.length >= 6
        ? liquidityService.analyze(bars, timeframe)
        : liquidityService.analyze(prices, timeframe);

    // 4. Calculate Volume Profile (POC, VAH, VAL)
    const volumeProfile = volumeProfileService.analyze(prices, effectiveVolumes);

    // 5. Calculate Volatility Risk & Suggested R/R
    const nearestSupport =
      supportLevels.length > 0 ? supportLevels[0] : Math.round(currentPrice * 0.975);
    const nearestResistance =
      resistanceLevels.length > 0 ? resistanceLevels[0] : Math.round(currentPrice * 1.025);
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

    if (high2 > high1 && low2 > low1 && currentPrice >= firstHalf[firstHalf.length - 1]) {
      structure = "bullish";
    } else if (high2 < high1 && low2 < low1 && currentPrice <= firstHalf[firstHalf.length - 1]) {
      structure = "bearish";
    } else {
      structure = "ranging";
    }

    // 8. Compute Full Confluence Indicator Suite (Year 1 to Veteran Edge)
    const rsi = calculateRSI(prices, 14);
    const macdData = calculateMACD(prices);
    const supertrendData = calculateSupertrend(bars && bars.length > 0 ? bars : prices);
    const bbData = calculateBollingerBands(prices);
    const vwapData = calculateVWAP(
      bars && bars.length > 0
        ? bars.map((b) => ({ high: b.high, low: b.low, close: b.close, volume: b.volume || 1 }))
        : prices.map((p) => ({ high: p, low: p, close: p, volume: 1 }))
    );
    const ichiData = calculateIchimoku(prices);
    const stochData = calculateStochastic(prices);
    const adxData = calculateADX(prices);
    const elliottData = calculateElliottWave(prices);
    const maxP = Math.max(...prices);
    const minP = Math.min(...prices);
    const fibData = calculateFibonacciRetracement(maxP, minP);
    const crossData = calculateCrossovers(prices);

    const indicators = {
      rsi,
      macd: {
        macd: macdData.macd,
        signal: macdData.signal,
        histogram: macdData.histogram,
        trend: (macdData.histogram >= 0 ? "bullish" : "bearish") as "bullish" | "bearish",
      },
      supertrend: {
        direction: supertrendData.direction,
        stop: supertrendData.stop,
      },
      bollinger: {
        upper: bbData.upper,
        lower: bbData.lower,
        bandwidth: bbData.bandwidth,
        percentB: bbData.percentB,
      },
      vwap: vwapData,
      ichimoku: {
        tenkan: ichiData.tenkan,
        kijun: ichiData.kijun,
        senkouA: ichiData.senkouA,
        senkouB: ichiData.senkouB,
        sentiment: currentPrice >= ichiData.senkouA ? "Bullish Kumo" : "Bearish Kumo",
      },
      stochastic: {
        k: stochData.k,
        d: stochData.d,
        signal: stochData.k > 80 ? "Overbought" : stochData.k < 20 ? "Oversold" : "Neutral",
      },
      adx: {
        adx: adxData.adx,
        plusDI: adxData.plusDI,
        minusDI: adxData.minusDI,
        trendStrength: adxData.adx >= 25 ? "Strong Trend" : "Weak / Ranging",
      },
      elliottWave: {
        currentWave: elliottData.currentWave,
        phase: elliottData.phase,
        direction: elliottData.direction,
        targetPrice: elliottData.projection.targetPrice,
        description: elliottData.projection.description,
      },
      fibonacci: {
        p236: fibData.r0236,
        p382: fibData.r0382,
        p500: fibData.r0500,
        p618: fibData.r0618,
        p786: fibData.r0786,
      },
      crossovers: {
        goldenCross: crossData.goldenCross,
        deathCross: crossData.deathCross,
        summary: crossData.goldenCross ? "Golden Cross Active" : crossData.deathCross ? "Death Cross Active" : "Neutral Moving Averages",
      },
    };

    return {
      timeframe,
      structure,
      bars: bars && bars.length > 0 ? bars : undefined,
      supportLevels,
      resistanceLevels,
      demandBlocks,
      supplyBlocks,
      liquidity,
      volumeProfile,
      riskMetrics,
      psychology,
      indicators,
    };
  }
}

export const marketStructureService = new MarketStructureService();
