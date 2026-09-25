import type { MarketData } from "@/features/market";
import type { NetworkData, NetworkAnomaly } from "@/features/network";
import type { NewsItem } from "@/features/news";
import type { TechnicalState } from "@/features/technical-analysis";
import type { MultiTimeframeAlignment } from "@/features/multi-timeframe";
import type { WhaleIntelligenceSummary } from "@/features/whale-intelligence";
import type { DerivativesSnapshot } from "@/features/derivatives";
import type { MacroSnapshot } from "@/features/macro";
import type { SentimentTimelineSummary } from "@/features/news-sentiment";
import type { IntelligenceFeatures } from "@/config/features";

export interface BTCIntelligenceState {
  readonly timestamp: string;
  readonly market: MarketData;
  readonly network: NetworkData;
  readonly anomaly: NetworkAnomaly;
  readonly news: readonly NewsItem[];
  readonly technical: TechnicalState;
  readonly multiTimeframe?: MultiTimeframeAlignment;
  readonly whale?: WhaleIntelligenceSummary;
  readonly derivatives?: DerivativesSnapshot;
  readonly macro?: MacroSnapshot;
  readonly newsSentiment?: SentimentTimelineSummary;
  readonly features: IntelligenceFeatures;
}
