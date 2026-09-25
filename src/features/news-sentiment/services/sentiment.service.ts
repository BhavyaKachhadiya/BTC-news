import type { NewsItem } from "@/features/news";
import type {
  NewsSentiment,
  NewsImpact,
  SentimentNewsItem,
  SentimentClassificationResult,
} from "../types/sentiment.types";

interface KeywordDefinition {
  readonly term: string;
  readonly weight: number;
}

const BULLISH_KEYWORDS: readonly KeywordDefinition[] = [
  // High impact / strong bullish (weight 3.0)
  { term: "all-time high", weight: 3.0 },
  { term: "all time high", weight: 3.0 },
  { term: "ath", weight: 3.0 },
  { term: "spot etf approval", weight: 3.0 },
  { term: "etf approval", weight: 3.0 },
  { term: "etf approved", weight: 3.0 },
  { term: "mega rally", weight: 3.0 },
  { term: "institutional adoption", weight: 3.0 },
  { term: "strategic reserve", weight: 3.0 },
  { term: "strategic bitcoin reserve", weight: 3.0 },
  { term: "legal tender", weight: 3.0 },
  { term: "bull run", weight: 3.0 },
  { term: "breaks record", weight: 3.0 },
  { term: "surges to new high", weight: 3.0 },

  // Moderate bullish (weight 2.0)
  { term: "rally", weight: 2.0 },
  { term: "surge", weight: 2.0 },
  { term: "surges", weight: 2.0 },
  { term: "surging", weight: 2.0 },
  { term: "breakout", weight: 2.0 },
  { term: "bullish", weight: 2.0 },
  { term: "accumulate", weight: 2.0 },
  { term: "accumulation", weight: 2.0 },
  { term: "halving", weight: 2.0 },
  { term: "inflow", weight: 2.0 },
  { term: "inflows", weight: 2.0 },
  { term: "skyrocket", weight: 2.0 },
  { term: "skyrockets", weight: 2.0 },
  { term: "outperform", weight: 2.0 },
  { term: "buy signal", weight: 2.0 },
  { term: "buying spree", weight: 2.0 },
  { term: "buying", weight: 1.5 },
  { term: "soar", weight: 2.0 },
  { term: "soars", weight: 2.0 },
  { term: "soaring", weight: 2.0 },
  { term: "jump", weight: 1.5 },
  { term: "jumps", weight: 1.5 },

  // Mild bullish (weight 1.0)
  { term: "gains", weight: 1.0 },
  { term: "gain", weight: 1.0 },
  { term: "bounce", weight: 1.0 },
  { term: "bounces", weight: 1.0 },
  { term: "recovery", weight: 1.0 },
  { term: "upside", weight: 1.0 },
  { term: "uptrend", weight: 1.0 },
  { term: "optimistic", weight: 1.0 },
  { term: "growth", weight: 1.0 },
  { term: "support holds", weight: 1.0 },
  { term: "climbs", weight: 1.0 },
  { term: "positive", weight: 1.0 },
];

const BEARISH_KEYWORDS: readonly KeywordDefinition[] = [
  // High impact / strong bearish (weight 3.0)
  { term: "sec sues", weight: 3.0 },
  { term: "emergency ban", weight: 3.0 },
  { term: "criminal charges", weight: 3.0 },
  { term: "bank run", weight: 3.0 },
  { term: "massive exploit", weight: 3.0 },
  { term: "liquidation cascade", weight: 3.0 },
  { term: "market crash", weight: 3.0 },
  { term: "crypto crash", weight: 3.0 },
  { term: "massive sell-off", weight: 3.0 },
  { term: "massive selloff", weight: 3.0 },
  { term: "all-time low", weight: 3.0 },

  // Moderate bearish (weight 2.0)
  { term: "crash", weight: 2.0 },
  { term: "crashes", weight: 2.0 },
  { term: "crashing", weight: 2.0 },
  { term: "collapse", weight: 2.0 },
  { term: "collapses", weight: 2.0 },
  { term: "collapsing", weight: 2.0 },
  { term: "insolvent", weight: 2.0 },
  { term: "insolvency", weight: 2.0 },
  { term: "bankruptcy", weight: 2.0 },
  { term: "hacked", weight: 2.0 },
  { term: "hack", weight: 2.0 },
  { term: "exploit", weight: 2.0 },
  { term: "exploited", weight: 2.0 },
  { term: "crackdown", weight: 2.0 },
  { term: "plunge", weight: 2.0 },
  { term: "plunges", weight: 2.0 },
  { term: "plunging", weight: 2.0 },
  { term: "plummet", weight: 2.0 },
  { term: "plummeting", weight: 2.0 },
  { term: "dump", weight: 2.0 },
  { term: "dumps", weight: 2.0 },
  { term: "dumping", weight: 2.0 },
  { term: "bearish", weight: 2.0 },
  { term: "liquidation", weight: 2.0 },
  { term: "liquidated", weight: 2.0 },
  { term: "selloff", weight: 2.0 },
  { term: "sell-off", weight: 2.0 },
  { term: "outflow", weight: 2.0 },
  { term: "outflows", weight: 2.0 },
  { term: "lawsuit", weight: 2.0 },
  { term: "subpoena", weight: 2.0 },
  { term: "panic", weight: 2.0 },
  { term: "fraud", weight: 2.0 },
  { term: "scam", weight: 2.0 },
  { term: "bear market", weight: 2.0 },

  // Mild bearish (weight 1.0)
  { term: "drop", weight: 1.0 },
  { term: "drops", weight: 1.0 },
  { term: "dropping", weight: 1.0 },
  { term: "slump", weight: 1.0 },
  { term: "slumps", weight: 1.0 },
  { term: "fall", weight: 1.0 },
  { term: "falls", weight: 1.0 },
  { term: "falling", weight: 1.0 },
  { term: "losses", weight: 1.0 },
  { term: "loss", weight: 1.0 },
  { term: "downtrend", weight: 1.0 },
  { term: "weakness", weight: 1.0 },
  { term: "struggles", weight: 1.0 },
  { term: "pessimistic", weight: 1.0 },
  { term: "fine", weight: 1.0 },
  { term: "penalty", weight: 1.0 },
  { term: "correction", weight: 1.0 },
  { term: "declines", weight: 1.0 },
  { term: "decline", weight: 1.0 },
  { term: "fear", weight: 1.0 },
];

const EXCEPTIONAL_IMPACT_KEYWORDS = [
  "spot etf approval",
  "etf approved",
  "legal tender",
  "strategic reserve",
  "strategic bitcoin reserve",
  "nation state",
  "emergency ban",
  "banning bitcoin",
  "doj",
  "fbi",
  "ftx collapse",
  "binance plea",
  "presidential",
];

const HIGH_IMPACT_KEYWORDS = [
  "etf inflow",
  "etf outflow",
  "interest rate",
  "rate cut",
  "rate hike",
  "cpi",
  "fomc",
  "federal reserve",
  "sec lawsuit",
  "sec sues",
  "subpoena",
  "hack",
  "exploited",
  "billion",
  "microstrategy",
  "blackrock",
  "fidelity",
  "halving",
  "liquidation cascade",
  "sec",
  "cftc",
];

const MODERATE_IMPACT_KEYWORDS = [
  "rally",
  "surge",
  "slump",
  "plunge",
  "correction",
  "miners",
  "hashrate",
  "million",
  "breakout",
  "resistance",
  "support",
  "inflow",
  "outflow",
  "adoption",
  "whale",
];

const LOW_IMPACT_KEYWORDS = [
  "analyst",
  "predicts",
  "forecast",
  "opinion",
  "indicator",
  "technical analysis",
  "chart",
  "targets",
  "speculation",
  "podcast",
];

const NEGATION_WORDS = new Set([
  "not",
  "no",
  "never",
  "won't",
  "cant",
  "cannot",
  "doesn't",
  "fails",
  "failed",
  "unlikely",
  "neither",
  "nor",
  "without",
]);

const MIXED_INDICATORS = [
  "mixed",
  "mixed signals",
  "conflicting",
  "divergence",
  "crossroads",
  "tug of war",
  "clash",
  "uncertainty",
  "indecision",
];

export class NewsSentimentService {
  /**
   * Classifies a news headline and optional body text into NewsSentiment and NewsImpact.
   */
  public classifyHeadline(
    title: string,
    description?: string,
    jevContext?: { readonly jevDirection?: "bullish" | "bearish" | "neutral"; readonly jevImpactScore?: number },
  ): SentimentClassificationResult {
    const rawText = `${title} ${description ?? ""}`.toLowerCase();
    const cleanWords = rawText.replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);

    let bullishScore = 0;
    let bearishScore = 0;
    const detectedBullish: string[] = [];
    const detectedBearish: string[] = [];
    const detectedHighImpact: string[] = [];

    // Helper to check if a word is negated by looking back up to 3 words
    const isNegated = (index: number): boolean => {
      const start = Math.max(0, index - 3);
      for (let i = start; i < index; i++) {
        if (NEGATION_WORDS.has(cleanWords[i])) {
          return true;
        }
      }
      return false;
    };

    // 1. Evaluate Bullish Keywords
    for (const item of BULLISH_KEYWORDS) {
      if (rawText.includes(item.term)) {
        const termFirstWord = item.term.split(" ")[0];
        const idx = cleanWords.indexOf(termFirstWord);
        const negated = idx !== -1 && isNegated(idx);

        if (negated) {
          bearishScore += item.weight * 0.75;
          detectedBearish.push(`not ${item.term}`);
        } else {
          bullishScore += item.weight;
          detectedBullish.push(item.term);
        }
      }
    }

    // 2. Evaluate Bearish Keywords
    for (const item of BEARISH_KEYWORDS) {
      if (rawText.includes(item.term)) {
        const termFirstWord = item.term.split(" ")[0];
        const idx = cleanWords.indexOf(termFirstWord);
        const negated = idx !== -1 && isNegated(idx);

        if (negated) {
          bullishScore += item.weight * 0.75;
          detectedBullish.push(`not ${item.term}`);
        } else {
          bearishScore += item.weight;
          detectedBearish.push(item.term);
        }
      }
    }

    // 3. Optional Jev Context Blending
    if (jevContext?.jevDirection) {
      if (jevContext.jevDirection === "bullish") {
        bullishScore += 1.0;
      } else if (jevContext.jevDirection === "bearish") {
        bearishScore += 1.0;
      }
    }

    // 4. Determine Sentiment Direction
    const hasExplicitMixedWord = MIXED_INDICATORS.some((w) => rawText.includes(w));
    let sentiment: NewsSentiment;

    if (hasExplicitMixedWord && (bullishScore > 0 || bearishScore > 0)) {
      sentiment = "mixed";
    } else if (bullishScore >= 1.5 && bearishScore >= 1.5 && Math.abs(bullishScore - bearishScore) <= 1.5) {
      sentiment = "mixed";
    } else if (bullishScore > bearishScore + 0.6) {
      sentiment = "bullish";
    } else if (bearishScore > bullishScore + 0.6) {
      sentiment = "bearish";
    } else if (bullishScore === 0 && bearishScore === 0) {
      sentiment = "neutral";
    } else if (Math.abs(bullishScore - bearishScore) <= 0.6) {
      sentiment = bullishScore > 0 && bearishScore > 0 ? "mixed" : "neutral";
    } else {
      sentiment = "neutral";
    }

    // 5. Normalized Polarity Score (-1.0 to 1.0)
    let score: number;
    const totalWeight = bullishScore + bearishScore;
    if (totalWeight === 0) {
      score = 0;
    } else if (sentiment === "mixed") {
      score = Number(((bullishScore - bearishScore) / Math.max(totalWeight, 1) * 0.5).toFixed(2));
    } else {
      const rawPolarity = (bullishScore - bearishScore) / Math.max(totalWeight, 1);
      score = Number(Math.max(-1, Math.min(1, rawPolarity)).toFixed(2));
    }

    // 6. Impact Classification
    let impact: NewsImpact = "negligible";
    let impactScore = 1.0;

    const matchedExceptional = EXCEPTIONAL_IMPACT_KEYWORDS.filter((term) => rawText.includes(term));
    const matchedHigh = HIGH_IMPACT_KEYWORDS.filter((term) => rawText.includes(term));
    const matchedModerate = MODERATE_IMPACT_KEYWORDS.filter((term) => rawText.includes(term));
    const matchedLow = LOW_IMPACT_KEYWORDS.filter((term) => rawText.includes(term));

    detectedHighImpact.push(...matchedExceptional, ...matchedHigh);

    if (matchedExceptional.length > 0 || totalWeight >= 5.5) {
      impact = "exceptional";
      impactScore = 10.0;
    } else if (matchedHigh.length > 0 || totalWeight >= 3.0) {
      impact = "high";
      impactScore = 7.5;
    } else if (matchedModerate.length > 0 || totalWeight >= 1.5) {
      impact = "moderate";
      impactScore = 5.0;
    } else if (matchedLow.length > 0 || totalWeight >= 0.5) {
      impact = "low";
      impactScore = 2.5;
    } else {
      impact = "negligible";
      impactScore = 1.0;
    }

    // Blend Jev impact score if provided
    if (jevContext?.jevImpactScore !== undefined) {
      impactScore = Number(((impactScore * 0.7) + (jevContext.jevImpactScore * 0.3)).toFixed(1));
    }

    const confidence = totalWeight === 0 ? 0.5 : Math.min(0.98, Number((0.6 + (Math.abs(bullishScore - bearishScore) / (totalWeight + 2))).toFixed(2)));

    return {
      sentiment,
      impact,
      score,
      impactScore,
      confidence,
      detectedKeywords: {
        bullish: detectedBullish,
        bearish: detectedBearish,
        highImpact: detectedHighImpact,
      },
    };
  }

  /**
   * Converts a single NewsItem into a SentimentNewsItem.
   */
  public classifyNewsItem(item: NewsItem, idOverride?: string): SentimentNewsItem {
    const classification = this.classifyHeadline(item.title, item.description);
    const id = idOverride ?? this.generateItemId(item);

    return {
      id,
      title: item.title,
      source: item.source,
      publishedAt: item.publishedAt,
      url: item.url,
      sentiment: classification.sentiment,
      impact: classification.impact,
      score: classification.score,
    };
  }

  /**
   * Batch classifies a collection of NewsItem objects.
   */
  public classifyNewsBatch(items: readonly NewsItem[]): SentimentNewsItem[] {
    return items.map((item, idx) => this.classifyNewsItem(item, `news-${Date.now()}-${idx}`));
  }

  /**
   * Generates a reproducible deterministic ID from title and url.
   */
  private generateItemId(item: NewsItem): string {
    const seed = `${item.title}-${item.url}-${item.publishedAt}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `news-${Math.abs(hash).toString(16)}`;
  }
}

export const newsSentimentService = new NewsSentimentService();
