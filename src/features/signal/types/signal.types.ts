import type { MarketData } from "@/features/market";
import type { TechnicalState } from "@/features/technical-analysis";
import type { NetworkData, NetworkAnomaly } from "@/features/network";
import type { NewsItem } from "@/features/news";
import type { JevAnalysisResult } from "@/features/jev";

import type { MultiTimeframeAlignment } from "@/features/multi-timeframe";
import type { WhaleIntelligenceSummary } from "@/features/whale-intelligence";
import type { DerivativesSnapshot } from "@/features/derivatives";
import type { MacroSnapshot } from "@/features/macro";
import type { SentimentTimelineSummary } from "@/features/news-sentiment";

export type SignalAction = "LONG" | "SHORT" | "WAIT";

export interface SignalContext {
  readonly market: MarketData;
  readonly technicals: TechnicalState;
  readonly network: NetworkData;
  readonly anomaly: NetworkAnomaly;
  readonly news: readonly NewsItem[];
  readonly jev: JevAnalysisResult;
  readonly multiTimeframe?: MultiTimeframeAlignment;
  readonly whale?: WhaleIntelligenceSummary;
  readonly derivatives?: DerivativesSnapshot;
  readonly macro?: MacroSnapshot;
  readonly newsSentiment?: SentimentTimelineSummary;
}

export interface SignalResult {
  readonly action: SignalAction;
  readonly confidence: number; // 0 to 100
  readonly reasons: readonly string[];
  readonly timestamp: string;
  readonly metrics: {
    readonly btcPrice: number;
    readonly rsi: number;
    readonly ema20: number;
    readonly ema50: number;
    readonly atr: number;
    readonly volatility: number;
    readonly regime: string;
    readonly newsDirection: string;
    readonly setupQuality: number;
    readonly isNetworkAnomaly: boolean;
  };
}

export interface ConfidenceBreakdown {
  readonly total: number;
  readonly technicalScore: number;
  readonly regimeScore: number;
  readonly newsScore: number;
  readonly networkScore: number;
  readonly deductions: number;
  readonly multiTimeframeScore?: number;
  readonly whaleScore?: number;
  readonly derivativesScore?: number;
  readonly macroScore?: number;
}
