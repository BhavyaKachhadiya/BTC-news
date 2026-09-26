import { calculateRSI, calculateEMA } from "@/features/technical-analysis";
import type { PsychologyState } from "./types";

export class PsychologyService {
  /**
   * Analyzes crowd psychology, retail FOMO risk, and Wyckoff market phase.
   *
   * @param prices Array of sequential closing prices.
   */
  public analyze(prices: readonly number[]): PsychologyState {
    if (!prices || prices.length < 15) {
      return {
        sentiment: "Neutral Phase",
        fomoScore: 30,
        overextensionHazard: false,
        patienceFilter: false,
      };
    }

    const currentPrice = prices[prices.length - 1];
    const rsi = calculateRSI(prices, Math.min(14, prices.length - 2));
    const ema20 = calculateEMA(prices, Math.min(20, prices.length - 1));
    const ema50 = calculateEMA(prices, Math.min(50, prices.length - 1));

    const priceVsEma20 = ((currentPrice - ema20) / ema20) * 100;
    const priceVsEma50 = ((currentPrice - ema50) / ema50) * 100;

    let sentiment = "Neutral Consolidation";
    let fomoScore = 35;
    let overextensionHazard = false;
    let patienceFilter = false;

    // Overextended Bullish Euphoria
    if (rsi >= 75 || priceVsEma20 > 8.0) {
      sentiment = "Euphoria / Overbought Risk";
      fomoScore = 88;
      overextensionHazard = true;
      patienceFilter = true;
    }
    // Strong Bullish Expansion / Markup
    else if (currentPrice > ema20 && ema20 > ema50 && rsi >= 55) {
      sentiment = "Bullish Expansion Phase";
      fomoScore = 55;
      overextensionHazard = false;
      patienceFilter = false;
    }
    // Accumulation / Compression
    else if (Math.abs(priceVsEma20) < 1.5 && rsi >= 45 && rsi <= 55) {
      sentiment = "Institutional Accumulation";
      fomoScore = 20;
      overextensionHazard = false;
      patienceFilter = true; // Wait for breakout
    }
    // Severe Capitulation / Oversold
    else if (rsi <= 25 || priceVsEma20 < -8.0) {
      sentiment = "Capitulation / Liquidation Flush";
      fomoScore = 12;
      overextensionHazard = false;
      patienceFilter = false; // High opportunity mean reversion
    }
    // Markdown / Bearish Trend
    else if (currentPrice < ema20 && ema20 < ema50) {
      sentiment = "Markdown / Bearish Distribution";
      fomoScore = 18;
      overextensionHazard = false;
      patienceFilter = true;
    }

    return {
      sentiment,
      fomoScore,
      overextensionHazard,
      patienceFilter,
    };
  }
}

export const psychologyService = new PsychologyService();
