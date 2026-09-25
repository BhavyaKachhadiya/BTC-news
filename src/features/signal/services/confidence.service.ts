import type { SignalAction, SignalContext, ConfidenceBreakdown } from "../types/signal.types";

/**
 * Deterministic Confidence Engine.
 *
 * Formula components:
 * 1. Technical Alignment (max 35 pts)
 *    - EMA trend alignment: 15 pts
 *    - RSI momentum zone (45-65 for LONG, 35-55 for SHORT): 10 pts
 *    - Volatility moderation (< 3.5%): 10 pts
 * 2. Jev Regime & Setup Quality (max 30 pts)
 *    - Explicit regime match with action: 20 pts
 *    - Setup quality score scaling (0-10 scaled to 0-10): 10 pts
 * 3. News Context (max 20 pts)
 *    - News direction harmony: 15 pts (neutral gives 8 pts)
 *    - News impact alignment: 5 pts
 * 4. Network Health (max 15 pts)
 *    - Clean mempool & normal fees: 15 pts
 *
 * Deductions:
 * - Network Anomaly: -25 pts
 * - Extreme Volatility (> 5%): -20 pts
 * - Jev Degraded Mode: -35 pts
 * - RSI Extreme Exhaustion (> 75 for LONG, < 25 for SHORT): -20 pts
 */
export function calculateConfidence(action: SignalAction, context: SignalContext): ConfidenceBreakdown {
  if (action === "WAIT") {
    // For WAIT signals, confidence reflects conviction to stay on the sidelines
    return calculateWaitConfidence(context);
  }

  const { market, technicals, network, anomaly, jev } = context;
  let technicalScore = 0;
  let regimeScore = 0;
  let newsScore = 0;
  let networkScore = 0;
  let deductions = 0;

  // 1. Technical Score
  if (action === "LONG") {
    if (market.price > technicals.ema20 && technicals.ema20 > technicals.ema50) {
      technicalScore += 15;
    } else if (market.price > technicals.ema20) {
      technicalScore += 8;
    }

    if (technicals.rsi14 >= 48 && technicals.rsi14 <= 68) {
      technicalScore += 10;
    } else if (technicals.rsi14 >= 40 && technicals.rsi14 < 75) {
      technicalScore += 5;
    }

    if (technicals.volatility < 3.5) {
      technicalScore += 10;
    } else if (technicals.volatility < 5.0) {
      technicalScore += 5;
    }
  } else if (action === "SHORT") {
    if (market.price < technicals.ema20 && technicals.ema20 < technicals.ema50) {
      technicalScore += 15;
    } else if (market.price < technicals.ema20) {
      technicalScore += 8;
    }

    if (technicals.rsi14 >= 32 && technicals.rsi14 <= 52) {
      technicalScore += 10;
    } else if (technicals.rsi14 > 25 && technicals.rsi14 <= 60) {
      technicalScore += 5;
    }

    if (technicals.volatility < 3.5) {
      technicalScore += 10;
    } else if (technicals.volatility < 5.0) {
      technicalScore += 5;
    }
  }

  // 2. Regime Score
  if (jev.isDegraded) {
    // In Pure Deterministic Mode, derive regime score from Multi-Timeframe alignment & structure
    const isMtfAligned =
      context.multiTimeframe &&
      ((action === "LONG" &&
        (context.multiTimeframe.alignmentStatus === "aligned bullish" ||
          context.multiTimeframe.overallTrend === "bullish")) ||
        (action === "SHORT" &&
          (context.multiTimeframe.alignmentStatus === "aligned bearish" ||
            context.multiTimeframe.overallTrend === "bearish")));

    const isMtfMixed = context.multiTimeframe?.alignmentStatus === "mixed";

    if (isMtfAligned) {
      regimeScore += 15;
    } else if (isMtfMixed) {
      regimeScore += 8;
    } else {
      regimeScore += 10; // Baseline technical trend conviction
    }

    regimeScore += 8; // Deterministic setup quality
  } else {
    if (action === "LONG") {
      if (jev.marketRegime === "bullish") {
        regimeScore += 20 * jev.regimeConfidence;
      } else if (jev.marketRegime === "ranging") {
        regimeScore += 8;
      }
    } else if (action === "SHORT") {
      if (jev.marketRegime === "bearish") {
        regimeScore += 20 * jev.regimeConfidence;
      } else if (jev.marketRegime === "ranging") {
        regimeScore += 8;
      }
    }
    regimeScore += Math.min(10, Math.max(0, jev.setupQualityScore));
  }

  // 3. News Score
  if (action === "LONG") {
    if (jev.newsDirection === "bullish") newsScore += 15;
    else if (jev.newsDirection === "neutral") newsScore += 8;
    else newsScore -= 10; // Bearish news penalty
  } else if (action === "SHORT") {
    if (jev.newsDirection === "bearish") newsScore += 15;
    else if (jev.newsDirection === "neutral") newsScore += 8;
    else newsScore -= 10; // Bullish news penalty
  }

  if (jev.newsImpactScore > 6) {
    newsScore += 5;
  }

  // 4. Network Score
  if (!anomaly.isAnomaly && anomaly.feeSurgeLevel === "NORMAL") {
    networkScore += 15;
  } else if (anomaly.feeSurgeLevel === "ELEVATED") {
    networkScore += 7;
  }

  // 5. Multi-Timeframe Alignment (+10 for aligned, -15 for opposite)
  let multiTimeframeScore = 0;
  if (context.multiTimeframe) {
    const isBullishMtf =
      context.multiTimeframe.alignmentStatus === "aligned bullish" ||
      context.multiTimeframe.overallTrend === "bullish";
    const isBearishMtf =
      context.multiTimeframe.alignmentStatus === "aligned bearish" ||
      context.multiTimeframe.overallTrend === "bearish";

    if (action === "LONG") {
      if (isBullishMtf) {
        multiTimeframeScore += 10;
      } else if (isBearishMtf) {
        deductions += 15;
      }
    } else if (action === "SHORT") {
      if (isBearishMtf) {
        multiTimeframeScore += 10;
      } else if (isBullishMtf) {
        deductions += 15;
      }
    }
  }

  // 6. Whale Positioning (+8 for harmonious, -10 for opposed)
  let whaleScore = 0;
  if (context.whale) {
    const isHarmonious =
      (action === "LONG" && context.whale.whaleBullRatio >= 0.55) ||
      (action === "SHORT" && context.whale.whaleBullRatio <= 0.45);
    const isOpposed =
      (action === "LONG" && context.whale.whaleBullRatio <= 0.45) ||
      (action === "SHORT" && context.whale.whaleBullRatio >= 0.55);

    if (isHarmonious) {
      whaleScore += 8;
    } else if (isOpposed) {
      deductions += 10;
    }
  }

  // 7. Derivatives Stability (+5 for calm, -15 for funding spike / extreme imbalance)
  let derivativesScore = 0;
  if (context.derivatives) {
    const isSpikeOrImbalance =
      context.derivatives.eventFlags.isFundingSpike ||
      context.derivatives.eventFlags.isPositionImbalance;

    if (isSpikeOrImbalance) {
      deductions += 15;
    } else {
      derivativesScore += 5;
    }
  }

  // 8. Macro & Sentiment Tailwinds (+5 for favorable macro/sentiment)
  let macroScore = 0;
  let isMacroFavorable = false;
  if (context.macro) {
    const dxyChange = context.macro.dxy?.changePercent ?? 0;
    const isRiskOn =
      dxyChange < -0.1 ||
      (context.macro.equities?.sp500 !== undefined && context.macro.equities.sp500 > 5000);
    const isRiskOff = dxyChange > 0.2;

    if (action === "LONG" && isRiskOn) isMacroFavorable = true;
    if (action === "SHORT" && isRiskOff) isMacroFavorable = true;
  }

  let isSentimentFavorable = false;
  if (context.newsSentiment) {
    if (action === "LONG" && context.newsSentiment.overallSentiment === "bullish") {
      isSentimentFavorable = true;
    } else if (action === "SHORT" && context.newsSentiment.overallSentiment === "bearish") {
      isSentimentFavorable = true;
    }
  }

  if (isMacroFavorable || isSentimentFavorable) {
    macroScore += 5;
  }

  // Deductions
  if (anomaly.isAnomaly) deductions += 25;
  if (technicals.volatility >= 5.0) deductions += 20;
  if (action === "LONG" && technicals.rsi14 > 75) deductions += 20;
  if (action === "SHORT" && technicals.rsi14 < 25) deductions += 20;

  const rawTotal =
    technicalScore +
    regimeScore +
    newsScore +
    networkScore +
    multiTimeframeScore +
    whaleScore +
    derivativesScore +
    macroScore -
    deductions;
  const total = Math.max(0, Math.min(100, Math.round(rawTotal)));

  return {
    total,
    technicalScore: Math.round(technicalScore),
    regimeScore: Math.round(regimeScore),
    newsScore: Math.round(newsScore),
    networkScore: Math.round(networkScore),
    deductions: Math.round(deductions),
    multiTimeframeScore: Math.round(multiTimeframeScore),
    whaleScore: Math.round(whaleScore),
    derivativesScore: Math.round(derivativesScore),
    macroScore: Math.round(macroScore),
  };
}

function calculateWaitConfidence(context: SignalContext): ConfidenceBreakdown {
  const { anomaly, jev, technicals } = context;
  let waitConviction = 60; // Baseline conviction for waiting when no setup is present

  if (anomaly.isAnomaly) waitConviction += 20;
  if (jev.isDegraded || jev.marketRegime === "uncertain") waitConviction += 20;
  if (technicals.volatility > 4.5) waitConviction += 10;
  if (technicals.rsi14 > 75 || technicals.rsi14 < 25) waitConviction += 15;

  const total = Math.max(0, Math.min(100, waitConviction));
  return {
    total,
    technicalScore: 0,
    regimeScore: 0,
    newsScore: 0,
    networkScore: 0,
    deductions: 0,
    multiTimeframeScore: 0,
    whaleScore: 0,
    derivativesScore: 0,
    macroScore: 0,
  };
}
