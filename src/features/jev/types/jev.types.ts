import type { MarketData } from "@/features/market";
import type { NetworkData, NetworkAnomaly } from "@/features/network";
import type { NewsItem } from "@/features/news";
import type { TechnicalState } from "@/features/technical-analysis";
import type { MultiTimeframeAlignment } from "@/features/multi-timeframe";
import type { WhaleIntelligenceSummary } from "@/features/whale-intelligence";
import type { DerivativesSnapshot } from "@/features/derivatives";
import type { MacroSnapshot } from "@/features/macro";
import type { SentimentTimelineSummary } from "@/features/news-sentiment";

export type MarketRegime = "bullish" | "bearish" | "ranging" | "uncertain";
export type NewsDirection = "bullish" | "bearish" | "neutral";

export interface JevInputContext {
  readonly market: MarketData;
  readonly technicals: TechnicalState;
  readonly network: NetworkData;
  readonly networkAnomaly: NetworkAnomaly;
  readonly news: readonly NewsItem[];
  readonly multiTimeframe?: MultiTimeframeAlignment;
  readonly whale?: WhaleIntelligenceSummary;
  readonly derivatives?: DerivativesSnapshot;
  readonly macro?: MacroSnapshot;
  readonly newsSentiment?: SentimentTimelineSummary;
}

export interface JevAnalysisResult {
  readonly marketRegime: MarketRegime;
  readonly regimeConfidence: number;
  readonly newsDirection: NewsDirection;
  readonly newsImpactScore: number; // 0 to 10 scale
  readonly setupQualityScore: number; // 0 to 10 scale
  readonly networkAnomalyScore: number; // 0 to 1 scale
  readonly isNetworkAnomaly: boolean;
  readonly summary: string;
  readonly isDegraded: boolean;
  readonly degradedReason?: string;
  readonly timestamp: string;
}

export interface JevProvider {
  analyze(context: JevInputContext): Promise<JevAnalysisResult>;
}
