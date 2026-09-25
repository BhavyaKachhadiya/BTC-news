import { choice, score, noul } from "@typesafe-ai/sdk";
import type { JevInputContext } from "../types/jev.types";

export function buildJevQuestions() {
  return {
    regime: choice("What market regime does the supplied technical and market evidence resemble?", {
      bullish: "Clear uptrend, prices above EMAs, positive momentum, strong market cap expansion",
      bearish: "Clear downtrend, prices below EMAs, negative momentum, market cap contraction",
      ranging: "Price oscillating within boundaries, conflicting moving averages, consolidation",
      uncertain: "Mixed conflicting signals, high volatility spikes, inconclusive evidence",
    }),
    newsDirection: choice("Which directional bias does the recent Bitcoin news sentiment lean towards?", {
      bullish: "Predominantly positive adoption, regulatory clarity, institutional buying, or tech upgrades",
      bearish: "FUD, exploits, regulatory bans, macro headwinds, or massive exchange selloffs",
      neutral: "Routine news, balanced sentiment, or general crypto commentary without directional bias",
    }),
    newsImpact: score("How significant is the recent news impact on immediate Bitcoin market dynamics?", [
      "Negligible/No market impact",
      "Minor/Routine industry news",
      "Moderate/Relevant development",
      "High/Major market moving catalyst",
      "Extreme/Monumental event or black swan",
    ]),
    setupQuality: score("How strong is the overall alignment between technical indicators and macro/news context?", [
      "Very poor/Strongly contradictory evidence",
      "Weak/Low conviction, unconvincing pattern",
      "Average/Mixed signals with moderate clarity",
      "Strong/Good alignment across multiple factors",
      "Exceptional/High conviction harmony across all layers",
    ]),
    unusualNetworkActivity: noul(
      "Is there unusual or anomalous network or mempool activity indicating congestion, stress, or sudden surges?",
    ),
  };
}

export function formatContextState(context: JevInputContext) {
  const { market, technicals, network, networkAnomaly, news } = context;

  return {
    marketSummary: {
      price: market.price,
      change24h: `${market.change24h}%`,
      volume24hUsd: market.volume24h,
      marketCapUsd: market.marketCap,
    },
    technicalIndicators: {
      rsi14: technicals.rsi14,
      ema20: technicals.ema20,
      ema50: technicals.ema50,
      sma20: technicals.sma20,
      atr14: technicals.atr14,
      volatilityPercent: `${technicals.volatility}%`,
      priceAboveEma20: market.price > technicals.ema20,
      priceAboveEma50: market.price > technicals.ema50,
      ema20AboveEma50: technicals.ema20 > technicals.ema50,
    },
    networkMempool: {
      pendingTxs: network.txCount,
      mempoolSizeBytes: network.mempoolSize,
      fastestFeeSatVb: network.fastestFee,
      halfHourFeeSatVb: network.halfHourFee,
      isAnomalyDetected: networkAnomaly.isAnomaly,
      anomalyReasons: [...networkAnomaly.reasons] as string[],
    },
    recentHeadlines: news.slice(0, 8).map((n) => ({
      title: n.title,
      source: n.source ?? "Unknown",
      publishedAt: n.publishedAt,
    })),
    ...(context.multiTimeframe && {
      multiTimeframe: {
        overallTrend: context.multiTimeframe.overallTrend,
        alignmentStatus: context.multiTimeframe.alignmentStatus,
        alignedCount: context.multiTimeframe.alignedCount,
        timeframes: context.multiTimeframe.timeframes.map((tf) => ({
          timeframe: tf.timeframe,
          trend: tf.trend,
          rsi: tf.rsi,
          price: tf.price,
        })),
      },
    }),
    ...(context.whale && {
      whalePositioning: {
        totalWhaleLongUsd: context.whale.totalWhaleLongUsd,
        totalWhaleShortUsd: context.whale.totalWhaleShortUsd,
        whaleBullRatio: context.whale.whaleBullRatio,
      },
    }),
    ...(context.derivatives && {
      derivatives: {
        fundingRate: `${context.derivatives.fundingRate}%`,
        openInterest: context.derivatives.openInterest,
        openInterestUsd: context.derivatives.openInterestUsd ?? 0,
        longShortRatio: context.derivatives.longShortRatio,
        isFundingSpike: context.derivatives.eventFlags.isFundingSpike,
        isOiExpansion: context.derivatives.eventFlags.isOiExpansion,
        isPositionImbalance: context.derivatives.eventFlags.isPositionImbalance,
      },
    }),
    ...(context.macro && {
      macroIndicators: {
        freshness: context.macro.freshness,
        dxy: context.macro.dxy
          ? { value: context.macro.dxy.value, changePercent: `${context.macro.dxy.changePercent}%` }
          : null,
        treasury: context.macro.treasury
          ? {
              twoYear: context.macro.treasury.twoYear ?? null,
              tenYear: context.macro.treasury.tenYear ?? null,
            }
          : null,
        equities: context.macro.equities
          ? {
              sp500: context.macro.equities.sp500 ?? null,
              nasdaq: context.macro.equities.nasdaq ?? null,
            }
          : null,
        gold: context.macro.gold
          ? { price: context.macro.gold.price, changePercent: `${context.macro.gold.changePercent}%` }
          : null,
      },
    }),
    ...(context.newsSentiment && {
      newsSentimentTimeline: {
        overallSentiment: context.newsSentiment.overallSentiment,
        averageImpactScore: context.newsSentiment.averageImpactScore,
        itemCount: context.newsSentiment.items.length,
        recentItems: context.newsSentiment.items.slice(0, 5).map((item) => ({
          title: item.title,
          sentiment: item.sentiment,
          impact: item.impact,
          score: item.score,
        })),
      },
    }),
  };
}
