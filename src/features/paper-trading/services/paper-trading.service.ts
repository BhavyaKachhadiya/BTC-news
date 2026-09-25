import { prisma } from "@/shared/database/prisma";
import { env } from "@/config/env";
import { logger } from "@/shared/logger/logger";
import type { SignalResult } from "@/features/signal";
import type {
  PaperPosition,
  PortfolioSummary,
  RiskManagementConfig,
  PositionSide,
  ExitReason,
} from "../types/paper-trading.types";

export const DEFAULT_RISK_CONFIG: RiskManagementConfig = {
  allocationPercentPerTrade: 0.2, // 20% of portfolio per position
  takeProfitPercent: 3.5, // +3.5%
  stopLossPercent: 1.8, // -1.8%
};

export class PaperTradingService {
  private readonly startingBalance: number;
  private readonly riskConfig: RiskManagementConfig;

  constructor(
    startingBalance = env.PAPER_STARTING_BALANCE,
    riskConfig = DEFAULT_RISK_CONFIG,
  ) {
    this.startingBalance = startingBalance;
    this.riskConfig = riskConfig;
  }

  /**
   * Processes a newly evaluated signal and updates open paper positions.
   */
  public async processSignal(signal: SignalResult, currentPrice: number): Promise<void> {
    logger.debug(`Processing paper trading response to ${signal.action} signal at $${currentPrice}`, "PaperTradingService");

    try {
      // 1. Check existing open positions against SL/TP thresholds
      await this.evaluateOpenPositions(currentPrice);

      // 2. Fetch current open positions
      const openPositions = await prisma.paperTrade.findMany({
        where: { status: "OPEN" },
      });

      // 3. Handle signal actions
      if (signal.action === "LONG") {
        // If an open SHORT exists, close it
        for (const pos of openPositions.filter((p) => p.side === "SHORT")) {
          await this.closePosition(pos.id, currentPrice, "OPPOSITE_SIGNAL");
        }

        // If no open LONG exists, consider opening a new LONG position
        const hasOpenLong = openPositions.some((p) => p.side === "LONG");
        if (!hasOpenLong && signal.confidence >= 55) {
          await this.openPosition("LONG", currentPrice);
        }
      } else if (signal.action === "SHORT") {
        // If an open LONG exists, close it
        for (const pos of openPositions.filter((p) => p.side === "LONG")) {
          await this.closePosition(pos.id, currentPrice, "OPPOSITE_SIGNAL");
        }

        // If no open SHORT exists, consider opening a new SHORT position
        const hasOpenShort = openPositions.some((p) => p.side === "SHORT");
        if (!hasOpenShort && signal.confidence >= 55) {
          await this.openPosition("SHORT", currentPrice);
        }
      }
    } catch (err: unknown) {
      logger.warn("Paper trading processSignal encountered an error (continuing if DB offline)", "PaperTradingService", {
        error: String(err),
      });
    }
  }

  public async evaluateOpenPositions(currentPrice: number): Promise<void> {
    try {
      const openPositions = await prisma.paperTrade.findMany({
        where: { status: "OPEN" },
      });

      for (const pos of openPositions) {
        const sideMultiplier = pos.side === "LONG" ? 1 : -1;
        const currentPnlPercent = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100 * sideMultiplier;

        if (currentPnlPercent >= this.riskConfig.takeProfitPercent) {
          await this.closePosition(pos.id, currentPrice, "TAKE_PROFIT");
        } else if (currentPnlPercent <= -this.riskConfig.stopLossPercent) {
          await this.closePosition(pos.id, currentPrice, "STOP_LOSS");
        }
      }
    } catch (err: unknown) {
      logger.warn("Error evaluating open paper positions", "PaperTradingService", { error: String(err) });
    }
  }

  public async openPosition(side: PositionSide, entryPrice: number): Promise<string | null> {
    if (entryPrice <= 0) return null;

    try {
      const allocatedUsd = this.startingBalance * this.riskConfig.allocationPercentPerTrade;
      const amountBtc = Number((allocatedUsd / entryPrice).toFixed(6));

      const position = await prisma.paperTrade.create({
        data: {
          side,
          entryPrice,
          amountBtc,
          allocatedUsd,
          status: "OPEN",
          openedAt: new Date(),
        },
      });

      logger.info(
        `[PAPER TRADE OPENED] ${side} ${amountBtc} BTC @ $${entryPrice} (Allocated: $${allocatedUsd})`,
        "PaperTradingService",
      );

      return position.id;
    } catch (err: unknown) {
      logger.error("Failed to open paper position", "PaperTradingService", { error: String(err) });
      return null;
    }
  }

  public async closePosition(
    positionId: string,
    exitPrice: number,
    exitReason: ExitReason,
  ): Promise<void> {
    try {
      const pos = await prisma.paperTrade.findUnique({ where: { id: positionId } });
      if (!pos || pos.status !== "OPEN") return;

      const sideMultiplier = pos.side === "LONG" ? 1 : -1;
      const realizedPnl = (exitPrice - pos.entryPrice) * pos.amountBtc * sideMultiplier;
      const pnlPercent = (realizedPnl / pos.allocatedUsd) * 100;
      const now = new Date();
      const holdingPeriodMinutes = Math.max(1, Math.round((now.getTime() - pos.openedAt.getTime()) / 60000));

      await prisma.paperTrade.update({
        where: { id: positionId },
        data: {
          status: "CLOSED",
          closedAt: now,
          exitPrice,
          realizedPnl: Number(realizedPnl.toFixed(2)),
          pnlPercent: Number(pnlPercent.toFixed(2)),
          holdingPeriodMinutes,
          exitReason,
        },
      });

      logger.info(
        `[PAPER TRADE CLOSED] ${pos.side} @ $${exitPrice} | PnL: ${realizedPnl >= 0 ? "+" : ""}$${realizedPnl.toFixed(2)} (${pnlPercent.toFixed(2)}%) | Reason: ${exitReason}`,
        "PaperTradingService",
      );
    } catch (err: unknown) {
      logger.error("Failed to close paper position", "PaperTradingService", { error: String(err) });
    }
  }

  public async getPortfolioSummary(currentPrice: number): Promise<PortfolioSummary> {
    try {
      const allTrades = await prisma.paperTrade.findMany({
        orderBy: { openedAt: "desc" },
      });

      const openPositions: PaperPosition[] = [];
      const closedPositions: PaperPosition[] = [];
      let totalRealizedPnl = 0;
      let totalUnrealizedPnl = 0;
      let winningTrades = 0;

      for (const t of allTrades) {
        const item: PaperPosition = {
          id: t.id,
          openedAt: t.openedAt.toISOString(),
          closedAt: t.closedAt?.toISOString() ?? null,
          side: t.side as PositionSide,
          entryPrice: t.entryPrice,
          exitPrice: t.exitPrice,
          amountBtc: t.amountBtc,
          allocatedUsd: t.allocatedUsd,
          realizedPnl: t.realizedPnl,
          pnlPercent: t.pnlPercent,
          holdingPeriodMinutes: t.holdingPeriodMinutes,
          status: t.status as "OPEN" | "CLOSED",
          exitReason: t.exitReason,
        };

        if (t.status === "OPEN") {
          openPositions.push(item);
          const sideMultiplier = t.side === "LONG" ? 1 : -1;
          const uPnl = (currentPrice - t.entryPrice) * t.amountBtc * sideMultiplier;
          totalUnrealizedPnl += uPnl;
        } else {
          closedPositions.push(item);
          if (t.realizedPnl != null) {
            totalRealizedPnl += t.realizedPnl;
            if (t.realizedPnl > 0) winningTrades++;
          }
        }
      }

      const totalClosed = closedPositions.length;
      const winRate = totalClosed > 0 ? Number(((winningTrades / totalClosed) * 100).toFixed(1)) : 0;
      const cashBalance = this.startingBalance + totalRealizedPnl;
      const equity = cashBalance + totalUnrealizedPnl;

      return {
        startingBalance: this.startingBalance,
        cashBalance: Number(cashBalance.toFixed(2)),
        equity: Number(equity.toFixed(2)),
        totalRealizedPnl: Number(totalRealizedPnl.toFixed(2)),
        totalUnrealizedPnl: Number(totalUnrealizedPnl.toFixed(2)),
        totalTrades: allTrades.length,
        winningTrades,
        winRate,
        openPositions,
        closedPositions,
      };
    } catch (err: unknown) {
      logger.warn("Failed to query portfolio from database (fallback to empty)", "PaperTradingService", {
        error: String(err),
      });
      return {
        startingBalance: this.startingBalance,
        cashBalance: this.startingBalance,
        equity: this.startingBalance,
        totalRealizedPnl: 0,
        totalUnrealizedPnl: 0,
        totalTrades: 0,
        winningTrades: 0,
        winRate: 0,
        openPositions: [],
        closedPositions: [],
      };
    }
  }
}

export const paperTradingService = new PaperTradingService();
