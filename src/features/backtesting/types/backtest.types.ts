import type { StrategyParameters } from "@/features/strategy-lab/types/strategy.types";
import type { IntelligenceFeatures } from "@/config/features";

export interface BacktestConfig {
  readonly startDate: string;
  readonly endDate: string;
  readonly initialBalance: number;
  readonly feeBps: number;
  readonly strategyParams: StrategyParameters;
  readonly featureFlags: IntelligenceFeatures;
}

export interface BacktestTrade {
  readonly entryTimestamp: string;
  readonly exitTimestamp: string;
  readonly side: "LONG" | "SHORT";
  readonly entryPrice: number;
  readonly exitPrice: number;
  readonly sizeBtc: number;
  readonly pnlUsd: number;
  readonly pnlPercent: number;
  readonly exitReason: string;
}

export interface BacktestEquityPoint {
  readonly timestamp: string;
  readonly equity: number;
}

export interface BacktestResult {
  readonly totalTrades: number;
  readonly winningTrades: number;
  readonly losingTrades: number;
  readonly winRate: number;
  readonly totalReturnPercent: number;
  readonly maxDrawdownPercent: number;
  readonly sharpeRatio: number;
  readonly profitFactor: number;
  readonly equityCurve: { timestamp: string; equity: number }[];
  readonly trades: BacktestTrade[];
}

export interface BacktestCandle {
  readonly timestamp: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume?: number;
}

export type BacktestAction = "LONG" | "SHORT" | "HOLD";
