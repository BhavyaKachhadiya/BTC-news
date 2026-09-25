import { logger } from "@/shared/logger/logger";
import { hyperbotService, calculateWhaleMetrics } from "./hyperbot.service";
import { transactionService, LARGE_BTC_TRANSACTION_THRESHOLD } from "./transaction.service";
import type {
  WhaleIntelligenceSummary,
  WhaleProvider,
  HyperliquidWhaleTrader,
  WhaleTransaction,
} from "../types/whale.types";

export interface WhaleServiceConfig {
  readonly cacheTtlMs?: number;
  readonly defaultBtcPrice?: number;
  readonly minLargeBtcThreshold?: number;
}

export class WhaleService implements WhaleProvider {
  private readonly cacheTtlMs: number;
  private readonly defaultBtcPrice: number;
  private readonly minLargeBtcThreshold: number;

  private cachedSummary: WhaleIntelligenceSummary | null = null;
  private lastFetchedAt: Date | null = null;

  constructor(config: WhaleServiceConfig = {}) {
    this.cacheTtlMs = config.cacheTtlMs ?? 60_000; // 1 minute cache TTL
    this.defaultBtcPrice = config.defaultBtcPrice ?? 95_000;
    this.minLargeBtcThreshold = config.minLargeBtcThreshold ?? LARGE_BTC_TRANSACTION_THRESHOLD;
  }

  /**
   * Retrieves aggregated whale positioning and on-chain telemetry.
   * Leverages caching according to freshness TTL.
   */
  public async getWhaleIntelligence(options?: {
    forceRefresh?: boolean;
    btcPrice?: number;
  }): Promise<WhaleIntelligenceSummary> {
    const now = Date.now();
    const isStale =
      !this.cachedSummary ||
      !this.lastFetchedAt ||
      now - this.lastFetchedAt.getTime() > this.cacheTtlMs;

    if (!options?.forceRefresh && !isStale && this.cachedSummary) {
      logger.debug("Returning cached whale intelligence summary", "WhaleService");
      return this.cachedSummary;
    }

    logger.info("Refreshing whale intelligence telemetry", "WhaleService");

    const effectiveBtcPrice = options?.btcPrice ?? this.defaultBtcPrice;

    // Concurrently fetch Hyperbot traders and Mempool large txs
    const [topTraders, largeTransactions] = await Promise.all([
      hyperbotService.getTopWhaleTraders(20),
      transactionService.getLargeTransactions(this.minLargeBtcThreshold, effectiveBtcPrice),
    ]);

    const metrics = calculateWhaleMetrics(topTraders);
    this.lastFetchedAt = new Date();

    const summary: WhaleIntelligenceSummary = {
      topTraders,
      totalWhaleLongUsd: metrics.totalWhaleLongUsd,
      totalWhaleShortUsd: metrics.totalWhaleShortUsd,
      whaleBullRatio: metrics.whaleBullRatio,
      largeTransactions,
      freshness: this.lastFetchedAt.toISOString(),
    };

    this.cachedSummary = summary;
    return summary;
  }

  /**
   * Returns a human-readable or ISO freshness indicator.
   */
  public getFreshness(): string {
    if (!this.lastFetchedAt) {
      return "No data fetched yet";
    }

    const elapsedSeconds = Math.floor((Date.now() - this.lastFetchedAt.getTime()) / 1000);
    if (elapsedSeconds < 5) {
      return "Just now";
    }
    if (elapsedSeconds < 60) {
      return `${elapsedSeconds}s ago`;
    }
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    return `${elapsedMinutes}m ago (${this.lastFetchedAt.toISOString()})`;
  }

  public getLastFetchedAt(): Date | null {
    return this.lastFetchedAt;
  }

  public isCacheStale(): boolean {
    if (!this.lastFetchedAt) return true;
    return Date.now() - this.lastFetchedAt.getTime() > this.cacheTtlMs;
  }

  public clearCache(): void {
    this.cachedSummary = null;
    this.lastFetchedAt = null;
  }
}

export const whaleService = new WhaleService();
