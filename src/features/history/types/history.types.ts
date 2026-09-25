import type { SignalAction } from "@/features/signal";

export interface HistoryQueryFilters {
  readonly action?: SignalAction;
  readonly minConfidence?: number;
  readonly fromDate?: string;
  readonly toDate?: string;
  readonly limit?: number;
  readonly skip?: number;
}

export interface HistoricalSignalRecord {
  readonly id: string;
  readonly timestamp: string;
  readonly action: SignalAction;
  readonly confidence: number;
  readonly reasons: readonly string[];
  readonly btcPrice: number;
  readonly rsi14: number;
  readonly ema20: number;
  readonly ema50: number;
  readonly atr14: number;
  readonly volatility: number;
  readonly marketRegime: string;
  readonly newsDirection: string;
  readonly newsImpactScore: number;
  readonly setupQualityScore: number;
  readonly isNetworkAnomaly: boolean;
  readonly outcome?: {
    readonly priceAfter1h?: number | null;
    readonly pnlPercent1h?: number | null;
    readonly priceAfter4h?: number | null;
    readonly pnlPercent4h?: number | null;
    readonly priceAfter24h?: number | null;
    readonly pnlPercent24h?: number | null;
    readonly isCompleted: boolean;
  } | null;
}
