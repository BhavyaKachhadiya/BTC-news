export interface DerivativesEventFlags {
  readonly isFundingSpike: boolean;
  readonly isOiExpansion: boolean;
  readonly isPositionImbalance: boolean;
}

export interface DerivativesSnapshot {
  readonly timestamp: string;
  readonly fundingRate: number; // 8-hour funding rate as percentage (e.g. 0.01 = +0.01%)
  readonly openInterest: number; // Open interest in BTC contracts
  readonly openInterestUsd?: number; // Open interest in USD notional
  readonly longShortRatio: number; // Global long/short account ratio (e.g. 1.25)
  readonly liquidations?: number; // Estimated / observed liquidations in USD
  readonly eventFlags: DerivativesEventFlags;
  readonly reasons?: readonly string[]; // Diagnostic anomaly reasons
  readonly markPrice?: number; // Latest futures mark price in USD
  readonly provider?: string; // e.g. "binance" | "hyperliquid"
}

export interface FundingRateData {
  readonly symbol: string;
  readonly fundingRate: number; // 8-hour funding rate as percentage (e.g. 0.01 = 0.01%)
  readonly rawFundingRate: number; // Raw decimal value from API (e.g. 0.0001)
  readonly fundingTime: number; // Milliseconds timestamp
  readonly markPrice?: number;
  readonly provider: "binance" | "hyperliquid";
  readonly isSpike: boolean;
  readonly bias: "NEUTRAL" | "HIGH_LONGS" | "HIGH_SHORTS";
}

export interface OpenInterestData {
  readonly symbol: string;
  readonly openInterest: number; // In BTC contracts
  readonly openInterestUsd?: number; // In USD notional
  readonly timestamp: number; // Milliseconds timestamp
  readonly provider: "binance" | "hyperliquid";
  readonly isExpansion: boolean;
  readonly changePercent24h?: number;
}

export interface LongShortRatioData {
  readonly symbol: string;
  readonly longShortRatio: number; // Ratio e.g. 1.25
  readonly longAccount: number; // Long account ratio / percentage (e.g. 0.555 = 55.5%)
  readonly shortAccount: number; // Short account ratio / percentage (e.g. 0.445 = 44.5%)
  readonly timestamp: number; // Milliseconds timestamp
  readonly provider: "binance";
  readonly isImbalanced: boolean;
  readonly imbalanceSide: "LONG" | "SHORT" | "BALANCED";
}

export interface DerivativesAnomalyConfig {
  readonly fundingSpikeThreshold: number; // Positive spike in % (default: 0.05%)
  readonly fundingNegativeThreshold: number; // Negative spike in % (default: -0.02%)
  readonly lsRatioCrowdedLongThreshold: number; // Extreme long ratio (default: 1.8)
  readonly lsRatioCrowdedShortThreshold: number; // Extreme short ratio (default: 0.6)
  readonly oiExpansionPercentThreshold: number; // % surge in OI (default: 5.0%)
}

export interface DerivativesProvider {
  getSnapshot(symbol?: string): Promise<DerivativesSnapshot>;
  getFundingRate(symbol?: string): Promise<FundingRateData>;
  getOpenInterest(symbol?: string): Promise<OpenInterestData>;
  getLongShortRatio(symbol?: string): Promise<LongShortRatioData>;
}
