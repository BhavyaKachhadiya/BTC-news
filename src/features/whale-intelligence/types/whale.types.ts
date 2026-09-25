/**
 * Whale & On-Chain Intelligence Type Definitions
 * Following Sections 39 & 40 of Master Architecture Specification.
 */

export interface HyperliquidWhaleTrader {
  address: string;
  winRate: number;
  totalPnl: number;
  longPnl: number;
  shortPnl: number;
  avgLeverage: number;
  snapLongPositionValue: number;
  snapShortPositionValue: number;
  snapLongPositionCount: number;
  snapShortPositionCount: number;
  snapTotalValue: number;
}

export interface WhaleTransaction {
  transactionId: string;
  timestamp: string;
  amountBtc: number;
  amountUsd: number;
  source: string;
  destination: string;
  classification: string;
}

export interface WhaleIntelligenceSummary {
  topTraders: HyperliquidWhaleTrader[];
  totalWhaleLongUsd: number;
  totalWhaleShortUsd: number;
  whaleBullRatio: number;
  largeTransactions: WhaleTransaction[];
  freshness: string;
}

export type WhaleBias = "BULLISH" | "BEARISH" | "NEUTRAL";

export interface WhaleMetrics {
  totalWhaleLongUsd: number;
  totalWhaleShortUsd: number;
  whaleBullRatio: number;
  whaleBias: WhaleBias;
  activeWhalesCount: number;
}

export interface WhaleProvider {
  getWhaleIntelligence(options?: {
    forceRefresh?: boolean;
    btcPrice?: number;
  }): Promise<WhaleIntelligenceSummary>;
  getFreshness(): string;
}
