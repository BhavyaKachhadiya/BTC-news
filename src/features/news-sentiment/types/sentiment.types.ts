export type NewsSentiment = "bullish" | "bearish" | "neutral" | "mixed";

export type NewsImpact = "negligible" | "low" | "moderate" | "high" | "exceptional";

export interface SentimentNewsItem {
  readonly id: string;
  readonly title: string;
  readonly source?: string;
  readonly publishedAt: string;
  readonly url: string;
  readonly sentiment: NewsSentiment;
  readonly impact: NewsImpact;
  readonly score: number; // Polarity score normalized between -1.0 and 1.0 (or -10 to +10)
  readonly btcPriceAtPub?: number;
  readonly btcPriceAfter1h?: number;
  readonly btcPriceAfter4h?: number;
  readonly btcPriceAfter24h?: number;
}

export interface SentimentTimelineSummary {
  readonly items: SentimentNewsItem[];
  readonly overallSentiment: NewsSentiment;
  readonly averageImpactScore: number;
}

export interface SentimentClassificationResult {
  readonly sentiment: NewsSentiment;
  readonly impact: NewsImpact;
  readonly score: number;
  readonly impactScore: number; // 1 to 10 numerical scale
  readonly confidence: number;
  readonly detectedKeywords: {
    readonly bullish: readonly string[];
    readonly bearish: readonly string[];
    readonly highImpact: readonly string[];
  };
}

export interface NewsPriceCorrelation {
  readonly btcPriceAtPub?: number;
  readonly btcPriceAfter1h?: number;
  readonly btcPriceAfter4h?: number;
  readonly btcPriceAfter24h?: number;
  readonly pnlPercent1h?: number;
  readonly pnlPercent4h?: number;
  readonly pnlPercent24h?: number;
  readonly isResolved1h: boolean;
  readonly isResolved4h: boolean;
  readonly isResolved24h: boolean;
}

export interface SentimentFilterOptions {
  readonly sentiment?: NewsSentiment | "all";
  readonly impact?: NewsImpact | "all";
  readonly searchQuery?: string;
  readonly sortBy?: "date-desc" | "date-asc" | "impact-desc" | "score-desc";
}
