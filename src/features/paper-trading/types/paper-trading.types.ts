export type PositionSide = "LONG" | "SHORT";
export type PositionStatus = "OPEN" | "CLOSED";
export type ExitReason = "TAKE_PROFIT" | "STOP_LOSS" | "TIME_EXPIRY" | "OPPOSITE_SIGNAL" | "MANUAL_CLOSE";

export interface PaperPosition {
  readonly id: string;
  readonly openedAt: string;
  readonly closedAt?: string | null;
  readonly side: PositionSide;
  readonly entryPrice: number;
  readonly exitPrice?: number | null;
  readonly amountBtc: number;
  readonly allocatedUsd: number;
  readonly realizedPnl?: number | null;
  readonly pnlPercent?: number | null;
  readonly holdingPeriodMinutes?: number | null;
  readonly status: PositionStatus;
  readonly exitReason?: ExitReason | string | null;
}

export interface PortfolioSummary {
  readonly startingBalance: number;
  readonly cashBalance: number;
  readonly equity: number;
  readonly totalRealizedPnl: number;
  readonly totalUnrealizedPnl: number;
  readonly totalTrades: number;
  readonly winningTrades: number;
  readonly winRate: number;
  readonly openPositions: readonly PaperPosition[];
  readonly closedPositions: readonly PaperPosition[];
}

export interface RiskManagementConfig {
  readonly allocationPercentPerTrade: number; // e.g. 0.20 for 20%
  readonly takeProfitPercent: number; // e.g. 4.0 for +4%
  readonly stopLossPercent: number; // e.g. 2.0 for -2%
}
