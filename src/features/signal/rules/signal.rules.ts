import type { SignalAction, SignalContext } from "../types/signal.types";

export interface EvaluatedRule {
  readonly action: SignalAction;
  readonly reasons: readonly string[];
}

export function evaluateSignalRules(context: SignalContext): EvaluatedRule {
  const { market, technicals, anomaly, jev } = context;
  const reasons: string[] = [];

  // Safety Gate 1: Network Anomaly & Congestion
  if (anomaly.isAnomaly) {
    reasons.push(`Network stress detected: ${anomaly.reasons.join(", ")}.`);
    reasons.push("Safety protocol: Delaying directional signal until network normalizes.");
    return { action: "WAIT", reasons };
  }

  // Safety Gate 2: Extreme Volatility
  if (technicals.volatility > 6.0) {
    reasons.push(`Extreme return volatility (${technicals.volatility}%): High liquidation risk.`);
    return { action: "WAIT", reasons };
  }

  // Safety Gate 3: Extreme RSI exhaustion
  if (technicals.rsi14 >= 78) {
    reasons.push(`RSI severely overbought (${technicals.rsi14}): Bullish momentum exhausted.`);
    return { action: "WAIT", reasons };
  }
  if (technicals.rsi14 <= 22) {
    reasons.push(`RSI severely oversold (${technicals.rsi14}): Bearish momentum extended.`);
    return { action: "WAIT", reasons };
  }

  // Directional Technical Conditions
  const isTechBullish =
    market.price > technicals.ema20 &&
    technicals.ema20 > technicals.ema50 &&
    technicals.rsi14 >= 48 &&
    technicals.rsi14 <= 74;

  const isTechBearish =
    market.price < technicals.ema20 &&
    technicals.ema20 < technicals.ema50 &&
    technicals.rsi14 >= 26 &&
    technicals.rsi14 <= 52;

  // Option A: Pure Deterministic Mode Branch (when Jev is degraded or bypassed)
  if (jev.isDegraded) {
    reasons.push(
      "[Pure Deterministic Mode]: Jev AI is bypassed or running in degraded mode. Signal evaluated purely from mathematical indicators, multi-timeframe alignment, and on-chain telemetry.",
    );

    const isMtfAlignedBearish = Boolean(
      context.multiTimeframe &&
        (context.multiTimeframe.alignmentStatus === "aligned bearish" ||
          context.multiTimeframe.overallTrend === "bearish"),
    );

    const isMtfAlignedBullish = Boolean(
      context.multiTimeframe &&
        (context.multiTimeframe.alignmentStatus === "aligned bullish" ||
          context.multiTimeframe.overallTrend === "bullish"),
    );

    const isOverheatedLongFundingSpike = Boolean(
      context.derivatives?.eventFlags.isFundingSpike &&
        context.derivatives.fundingRate &&
        context.derivatives.fundingRate > 0.05,
    );

    const isCrowdedShortFundingSpike = Boolean(
      context.derivatives?.eventFlags.isFundingSpike &&
        context.derivatives.fundingRate &&
        context.derivatives.fundingRate < -0.02,
    );

    const isWhaleHeavilyShort = Boolean(
      context.whale && context.whale.whaleBullRatio < 0.35,
    );

    const isWhaleHeavilyLong = Boolean(
      context.whale && context.whale.whaleBullRatio > 0.65,
    );

    // Bullish Candidate Check (Pure Deterministic)
    if (isTechBullish && !isMtfAlignedBearish && !isWhaleHeavilyShort && !isOverheatedLongFundingSpike) {
      reasons.push("Technical alignment: Price > EMA20 > EMA50 golden trend structure.");
      reasons.push(`Momentum healthy: RSI(14) at ${technicals.rsi14} in ideal bullish expansion band.`);
      if (context.multiTimeframe) {
        reasons.push(
          `Multi-timeframe confirmed: ${context.multiTimeframe.overallTrend.toUpperCase()} trend (${context.multiTimeframe.alignmentStatus}).`,
        );
      }
      if (context.whale) {
        reasons.push(
          `Whale positioning supportive: ${(context.whale.whaleBullRatio * 100).toFixed(1)}% bull ratio.`,
        );
      }
      return { action: "LONG", reasons };
    }

    // Bearish Candidate Check (Pure Deterministic)
    if (isTechBearish && !isMtfAlignedBullish && !isWhaleHeavilyLong && !isCrowdedShortFundingSpike) {
      reasons.push("Technical alignment: Price < EMA20 < EMA50 breakdown structure.");
      reasons.push(`Momentum healthy: RSI(14) at ${technicals.rsi14} in active downward expansion band.`);
      if (context.multiTimeframe) {
        reasons.push(
          `Multi-timeframe confirmed: ${context.multiTimeframe.overallTrend.toUpperCase()} trend (${context.multiTimeframe.alignmentStatus}).`,
        );
      }
      if (context.whale) {
        reasons.push(
          `Whale positioning supportive: ${(context.whale.whaleBullRatio * 100).toFixed(1)}% bull ratio.`,
        );
      }
      return { action: "SHORT", reasons };
    }

    // Fallback to WAIT with detailed deterministic diagnostics
    reasons.push("Market conditions do not meet high-conviction criteria for either LONG or SHORT in Pure Deterministic Mode.");
    if (isTechBullish && isMtfAlignedBearish) {
      reasons.push("Higher timeframe alignment is bearish; suppressing LONG signal.");
    }
    if (isTechBullish && isWhaleHeavilyShort) {
      reasons.push("Top whale positioning heavily short (<35% bull ratio); suppressing LONG signal.");
    }
    if (isTechBullish && isOverheatedLongFundingSpike) {
      reasons.push("Derivatives funding spike detected (>0.05%): Long squeeze hazard.");
    }
    if (isTechBearish && isMtfAlignedBullish) {
      reasons.push("Higher timeframe alignment is bullish; suppressing SHORT signal.");
    }
    if (isTechBearish && isWhaleHeavilyLong) {
      reasons.push("Top whale positioning heavily long (>65% bull ratio); suppressing SHORT signal.");
    }
    if (isTechBearish && isCrowdedShortFundingSpike) {
      reasons.push("Derivatives funding spike detected (<-0.02%): Short squeeze hazard.");
    }
    if (!isTechBullish && !isTechBearish) {
      reasons.push(
        `Price relative to EMAs: Price $${market.price.toLocaleString()} vs EMA20 $${technicals.ema20.toLocaleString()} and EMA50 $${technicals.ema50.toLocaleString()}.`,
      );
      reasons.push(`RSI(14) neutral: ${technicals.rsi14}.`);
    }

    return { action: "WAIT", reasons };
  }

  // --- Option C / Hybrid Mode: Full Jev AI Verification ---

  // Jev Interpretation Harmony
  const isJevBullish = jev.marketRegime === "bullish" && jev.newsDirection !== "bearish";
  const isJevBearish = jev.marketRegime === "bearish" && jev.newsDirection !== "bullish";

  // Check for Conflicts (Prompt: Conflicting evidence should generally result in WAIT)
  if ((isTechBullish && isJevBearish) || (isTechBearish && isJevBullish)) {
    reasons.push("Conflict detected: Technical indicators and Jev interpretation point in opposite directions.");
    reasons.push(
      `Technical: ${isTechBullish ? "Bullish" : "Bearish"} vs Jev Regime: ${jev.marketRegime.toUpperCase()}, News: ${jev.newsDirection.toUpperCase()}.`,
    );
    return { action: "WAIT", reasons };
  }

  // LONG Candidate Check
  if (isTechBullish && isJevBullish && jev.setupQualityScore >= 6.0) {
    reasons.push("Technical alignment: Price > EMA20 > EMA50 golden trend structure.");
    reasons.push(`Momentum healthy: RSI(14) at ${technicals.rsi14} in ideal bullish expansion band.`);
    reasons.push(`Jev regime verified: ${jev.marketRegime.toUpperCase()} with ${(jev.regimeConfidence * 100).toFixed(0)}% confidence.`);
    reasons.push(`Contextual setup quality rated high: ${jev.setupQualityScore}/10.`);
    if (jev.newsDirection === "bullish") {
      reasons.push("News sentiment strongly supportive of upside.");
    }

    let isSuppressed = false;

    // Advanced Intelligence Checks: Multi-timeframe
    if (context.multiTimeframe) {
      if (
        context.multiTimeframe.alignmentStatus === "aligned bearish" ||
        context.multiTimeframe.overallTrend === "bearish"
      ) {
        reasons.push("Higher timeframe alignment is bearish; suppressing LONG signal.");
        isSuppressed = true;
      }
    }

    // Advanced Intelligence Checks: Derivatives Funding Spike
    if (context.derivatives?.eventFlags.isFundingSpike) {
      if (context.derivatives.fundingRate && context.derivatives.fundingRate > 0.05) {
        reasons.push("Derivatives funding spike detected (>0.05%): Long squeeze hazard.");
        isSuppressed = true;
      }
    }

    // Advanced Intelligence Checks: Whale Positioning
    if (context.whale) {
      if (context.whale.whaleBullRatio < 0.3) {
        reasons.push("Top whale positioning heavily short (<30% bull ratio); suppressing LONG signal.");
        isSuppressed = true;
      }
    }

    if (isSuppressed) {
      return { action: "WAIT", reasons };
    }

    return { action: "LONG", reasons };
  }

  // SHORT Candidate Check
  if (isTechBearish && isJevBearish && jev.setupQualityScore >= 6.0) {
    reasons.push("Technical alignment: Price < EMA20 < EMA50 breakdown structure.");
    reasons.push(`Momentum healthy: RSI(14) at ${technicals.rsi14} in active downward expansion band.`);
    reasons.push(`Jev regime verified: ${jev.marketRegime.toUpperCase()} with ${(jev.regimeConfidence * 100).toFixed(0)}% confidence.`);
    reasons.push(`Contextual setup quality rated high: ${jev.setupQualityScore}/10.`);
    if (jev.newsDirection === "bearish") {
      reasons.push("News catalyst indicates continued downward pressure.");
    }

    let isSuppressed = false;

    // Advanced Intelligence Checks: Multi-timeframe
    if (context.multiTimeframe) {
      if (
        context.multiTimeframe.alignmentStatus === "aligned bullish" ||
        context.multiTimeframe.overallTrend === "bullish"
      ) {
        reasons.push("Higher timeframe alignment is bullish; suppressing SHORT signal.");
        isSuppressed = true;
      }
    }

    // Advanced Intelligence Checks: Derivatives Funding Spike
    if (context.derivatives?.eventFlags.isFundingSpike) {
      if (context.derivatives.fundingRate && context.derivatives.fundingRate < -0.02) {
        reasons.push("Derivatives funding spike detected (<-0.02%): Short squeeze hazard.");
        isSuppressed = true;
      }
    }

    // Advanced Intelligence Checks: Whale Positioning
    if (context.whale) {
      if (context.whale.whaleBullRatio > 0.7) {
        reasons.push("Top whale positioning heavily long (>70% bull ratio); suppressing SHORT signal.");
        isSuppressed = true;
      }
    }

    if (isSuppressed) {
      return { action: "WAIT", reasons };
    }

    return { action: "SHORT", reasons };
  }

  // Fallback to WAIT with informative reasons
  reasons.push("Market conditions do not meet high-conviction criteria for either LONG or SHORT.");
  if (jev.marketRegime === "ranging") {
    reasons.push("Market regime characterized as ranging / consolidating.");
  } else if (jev.marketRegime === "uncertain") {
    reasons.push("Market regime classified as uncertain.");
  }
  if (!isTechBullish && !isTechBearish) {
    reasons.push(
      `Price relative to EMAs: Price $${market.price.toLocaleString()} vs EMA20 $${technicals.ema20.toLocaleString()} and EMA50 $${technicals.ema50.toLocaleString()}.`,
    );
    reasons.push(`RSI(14) neutral: ${technicals.rsi14}.`);
  }
  if (jev.setupQualityScore < 6.0) {
    reasons.push(`Setup quality score (${jev.setupQualityScore}/10) is below the threshold of 6.0.`);
  }

  return { action: "WAIT", reasons };
}
