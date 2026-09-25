import { prisma } from "@/shared/database/prisma";
import { logger } from "@/shared/logger/logger";
import type { SignalContext, SignalResult, SignalAction } from "@/features/signal";
import type { HistoryQueryFilters, HistoricalSignalRecord } from "../types/history.types";

export class HistoryService {
  /**
   * Persists a complete decision snapshot along with sub-layer snapshots to MongoDB.
   */
  public async saveSignalDecision(
    signal: SignalResult,
    context: SignalContext,
  ): Promise<string | undefined> {
    logger.debug("Persisting signal decision to MongoDB", "HistoryService");

    try {
      const { market, technicals, network, anomaly, jev } = context;

      // 1. Create Decision Record
      const decision = await prisma.signalDecision.create({
        data: {
          timestamp: new Date(signal.timestamp),
          action: signal.action,
          confidence: signal.confidence,
          reasons: [...signal.reasons],
          btcPrice: market.price,
          rsi14: technicals.rsi14,
          ema20: technicals.ema20,
          ema50: technicals.ema50,
          atr14: technicals.atr14,
          volatility: technicals.volatility,
          marketRegime: jev.marketRegime,
          newsDirection: jev.newsDirection,
          newsImpactScore: jev.newsImpactScore,
          setupQualityScore: jev.setupQualityScore,
          isNetworkAnomaly: anomaly.isAnomaly,
        },
      });

      // 2. Initialize pending SignalOutcome record for future evaluation
      await prisma.signalOutcome.create({
        data: {
          signalDecisionId: decision.id,
          entryPrice: market.price,
          isCompleted: false,
        },
      });

      // 3. Prepare snapshots to persist concurrently
      const snapshotPromises: Promise<unknown>[] = [
        prisma.marketSnapshot.create({
          data: {
            timestamp: new Date(market.timestamp),
            price: market.price,
            change24h: market.change24h,
            volume24h: market.volume24h,
            marketCap: market.marketCap,
            provider: market.provider,
          },
        }),
        prisma.networkSnapshot.create({
          data: {
            timestamp: new Date(network.timestamp),
            blockHeight: network.blockHeight,
            txCount: network.txCount,
            mempoolSize: network.mempoolSize,
            fastestFee: network.fastestFee,
            halfHourFee: network.halfHourFee,
            hourFee: network.hourFee,
            isAnomaly: anomaly.isAnomaly,
            anomalyReasons: [...anomaly.reasons],
            provider: network.provider,
          },
        }),
        prisma.technicalIndicator.create({
          data: {
            timestamp: new Date(technicals.timestamp),
            rsi14: technicals.rsi14,
            ema20: technicals.ema20,
            ema50: technicals.ema50,
            sma20: technicals.sma20,
            atr14: technicals.atr14,
            volatility: technicals.volatility,
            priceChange: technicals.priceChange,
            volumeChange: technicals.volumeChange,
          },
        }),
        prisma.jevAnalysis.create({
          data: {
            timestamp: new Date(jev.timestamp),
            marketRegime: jev.marketRegime,
            regimeConfidence: jev.regimeConfidence,
            newsImpactScore: jev.newsImpactScore,
            newsDirection: jev.newsDirection,
            setupQualityScore: jev.setupQualityScore,
            networkAnomaly: jev.isNetworkAnomaly,
          },
        }),
      ];

      // Multi-timeframe snapshots
      if (context.multiTimeframe?.timeframes) {
        for (const tf of context.multiTimeframe.timeframes) {
          snapshotPromises.push(
            prisma.timeframeSnapshot.create({
              data: {
                timestamp: new Date(),
                timeframe: tf.timeframe,
                price: tf.price,
                rsi: tf.rsi,
                ema20: tf.ema20,
                ema50: tf.ema50,
                atr: tf.atr,
                volatility: tf.volatility,
                trend: tf.trend,
              },
            }),
          );
        }
      }

      // Whale & Onchain snapshot
      if (context.whale) {
        snapshotPromises.push(
          prisma.onchainSnapshot.create({
            data: {
              timestamp: new Date(),
              largeTxCount: context.whale.largeTransactions?.length ?? 0,
              whaleLongVolume: context.whale.totalWhaleLongUsd,
              whaleShortVolume: context.whale.totalWhaleShortUsd,
              whaleBullRatio: context.whale.whaleBullRatio,
              source: "Hyperbot/Hyperliquid",
            },
          }),
        );
      }

      // Derivatives snapshot
      if (context.derivatives) {
        snapshotPromises.push(
          prisma.derivativesSnapshot.create({
            data: {
              timestamp: new Date(context.derivatives.timestamp),
              fundingRate: context.derivatives.fundingRate,
              openInterest: context.derivatives.openInterest,
              longShortRatio: context.derivatives.longShortRatio,
              source: context.derivatives.provider ?? "Binance/Hyperliquid",
            },
          }),
        );
      }

      // Macro snapshot
      if (context.macro) {
        snapshotPromises.push(
          prisma.macroSnapshot.create({
            data: {
              timestamp: new Date(context.macro.timestamp),
              dxyValue: context.macro.dxy?.value,
              dxyChangePercent: context.macro.dxy?.changePercent,
              treasury10Y: context.macro.treasury?.tenYear,
              treasury2Y: context.macro.treasury?.twoYear,
              sp500: context.macro.equities?.sp500,
              goldPrice: context.macro.gold?.price,
              goldChangePercent: context.macro.gold?.changePercent,
              freshnessStatus: context.macro.freshness,
            },
          }),
        );
      }

      await Promise.allSettled(snapshotPromises);

      return decision.id;
    } catch (err: unknown) {
      logger.warn("Failed to persist signal decision to database (handled gracefully)", "HistoryService", {
        error: String(err),
      });
      return undefined;
    }
  }

  /**
   * Retrieves historical signals based on query filters.
   */
  public async getHistoricalSignals(filters: HistoryQueryFilters = {}): Promise<readonly HistoricalSignalRecord[]> {
    try {
      const { action, minConfidence, fromDate, toDate, limit = 50, skip = 0 } = filters;

      const where: Record<string, unknown> = {};

      if (action) {
        where.action = action;
      }

      if (minConfidence !== undefined) {
        where.confidence = { gte: minConfidence };
      }

      if (fromDate || toDate) {
        where.timestamp = {
          ...(fromDate && { gte: new Date(fromDate) }),
          ...(toDate && { lte: new Date(toDate) }),
        };
      }

      const records = await prisma.signalDecision.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: limit,
        skip,
        include: {
          outcome: true,
        },
      });

      return records.map((r) => ({
        id: r.id,
        timestamp: r.timestamp.toISOString(),
        action: r.action as SignalAction,
        confidence: r.confidence,
        reasons: r.reasons,
        btcPrice: r.btcPrice,
        rsi14: r.rsi14,
        ema20: r.ema20,
        ema50: r.ema50,
        atr14: r.atr14,
        volatility: r.volatility,
        marketRegime: r.marketRegime,
        newsDirection: r.newsDirection,
        newsImpactScore: r.newsImpactScore,
        setupQualityScore: r.setupQualityScore,
        isNetworkAnomaly: r.isNetworkAnomaly,
        outcome: r.outcome
          ? {
              priceAfter1h: r.outcome.priceAfter1h,
              pnlPercent1h: r.outcome.pnlPercent1h,
              priceAfter4h: r.outcome.priceAfter4h,
              pnlPercent4h: r.outcome.pnlPercent4h,
              priceAfter24h: r.outcome.priceAfter24h,
              pnlPercent24h: r.outcome.pnlPercent24h,
              isCompleted: r.outcome.isCompleted,
            }
          : null,
      }));
    } catch (err: unknown) {
      logger.warn("Database query failed; returning empty history if offline", "HistoryService", {
        error: String(err),
      });
      return [];
    }
  }
}

export const historyService = new HistoryService();
