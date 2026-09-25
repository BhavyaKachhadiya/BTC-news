import { logger } from "@/shared/logger/logger";
import { prisma } from "@/shared/database/prisma";
import { coingeckoService } from "@/features/market/services/coingecko.service";
import { mempoolService } from "@/features/network/services/mempool.service";
import { fundingService } from "@/features/derivatives/services/funding.service";
import { whaleService } from "@/features/whale-intelligence/services/whale.service";
import { macroService } from "@/features/macro/services/macro.service";
import type {
  ProviderHealthDetail,
  ProviderHealthStatus,
  SystemHealthSummary,
} from "../types/health.types";

export class HealthMonitoringService {
  /**
   * Probes all upstream external providers and the local database concurrently,
   * measuring real latency and assessing freshness.
   */
  public async checkSystemHealth(): Promise<SystemHealthSummary> {
    logger.info("Executing comprehensive provider health & freshness check", "HealthMonitoringService");
    const checkStart = Date.now();

    const [coingeckoRes, mempoolRes, binanceRes, hyperliquidRes, yahooMacroRes, dbRes] =
      await Promise.allSettled([
        this.checkMarketProvider(),
        this.checkMempoolProvider(),
        this.checkDerivativesProvider(),
        this.checkWhaleProvider(),
        this.checkMacroProvider(),
        this.checkDatabase(),
      ]);

    const providers: ProviderHealthDetail[] = [
      this.resolveResult(coingeckoRes, "coingecko", "CoinGecko Market API", "market"),
      this.resolveResult(mempoolRes, "mempool", "Mempool.space Network API", "network"),
      this.resolveResult(binanceRes, "binance", "Binance Futures Derivatives API", "derivatives"),
      this.resolveResult(hyperliquidRes, "hyperliquid", "Hyperliquid / Hyperbot API", "whale"),
      this.resolveResult(yahooMacroRes, "yahoo-macro", "Yahoo Finance Macro API", "macro"),
      this.resolveResult(dbRes, "mongodb", "MongoDB / Prisma Database", "database"),
    ];

    const healthyCount = providers.filter((p) => p.status === "healthy").length;
    const degradedCount = providers.filter((p) => p.status === "degraded").length;
    const downCount = providers.filter((p) => p.status === "down").length;

    let overallStatus: ProviderHealthStatus = "healthy";
    if (downCount > 0) {
      overallStatus = downCount >= 3 ? "down" : "degraded";
    } else if (degradedCount > 0) {
      overallStatus = "degraded";
    }

    logger.info(
      `Health check completed in ${Date.now() - checkStart}ms: Overall=${overallStatus} (Healthy: ${healthyCount}, Degraded: ${degradedCount}, Down: ${downCount})`,
      "HealthMonitoringService"
    );

    return {
      overallStatus,
      checkedAt: new Date().toISOString(),
      totalProviders: providers.length,
      healthyCount,
      degradedCount,
      downCount,
      providers,
    };
  }

  private async checkMarketProvider(): Promise<Omit<ProviderHealthDetail, "id" | "name" | "category">> {
    const start = Date.now();
    try {
      const data = await coingeckoService.getCurrentMarketData();
      const latencyMs = Date.now() - start;
      const isSlow = latencyMs > 2500;
      return {
        status: isSlow ? "degraded" : "healthy",
        latencyMs,
        lastUpdated: data.timestamp,
        isStale: false,
        message: `BTC Price: $${data.price.toLocaleString()} (${data.change24h >= 0 ? "+" : ""}${data.change24h.toFixed(2)}%)`,
      };
    } catch (err) {
      return {
        status: "down",
        latencyMs: Date.now() - start,
        lastUpdated: new Date().toISOString(),
        isStale: true,
        message: err instanceof Error ? err.message : "Market API unavailable",
      };
    }
  }

  private async checkMempoolProvider(): Promise<Omit<ProviderHealthDetail, "id" | "name" | "category">> {
    const start = Date.now();
    try {
      const data = await mempoolService.getCurrentNetworkData();
      const latencyMs = Date.now() - start;
      return {
        status: latencyMs > 3000 ? "degraded" : "healthy",
        latencyMs,
        lastUpdated: new Date().toISOString(),
        isStale: false,
        message: `Tip: #${data.blockHeight}, Fast Fee: ${data.fastestFee} sat/vB`,
      };
    } catch (err) {
      return {
        status: "down",
        latencyMs: Date.now() - start,
        lastUpdated: new Date().toISOString(),
        isStale: true,
        message: err instanceof Error ? err.message : "Mempool API unavailable",
      };
    }
  }

  private async checkDerivativesProvider(): Promise<Omit<ProviderHealthDetail, "id" | "name" | "category">> {
    const start = Date.now();
    try {
      const funding = await fundingService.getFundingRate();
      const latencyMs = Date.now() - start;
      const lastUpdated = funding.fundingTime
        ? new Date(funding.fundingTime).toISOString()
        : new Date().toISOString();
      return {
        status: latencyMs > 2500 ? "degraded" : "healthy",
        latencyMs,
        lastUpdated,
        isStale: false,
        message: `Funding Rate: ${(funding.fundingRate * 100).toFixed(4)}%`,
      };
    } catch (err) {
      return {
        status: "down",
        latencyMs: Date.now() - start,
        lastUpdated: new Date().toISOString(),
        isStale: true,
        message: err instanceof Error ? err.message : "Derivatives API unavailable",
      };
    }
  }

  private async checkWhaleProvider(): Promise<Omit<ProviderHealthDetail, "id" | "name" | "category">> {
    const start = Date.now();
    try {
      const whale = await whaleService.getWhaleIntelligence();
      const latencyMs = Date.now() - start;
      return {
        status: latencyMs > 3000 ? "degraded" : "healthy",
        latencyMs,
        lastUpdated: whale.freshness || new Date().toISOString(),
        isStale: whaleService.isCacheStale(),
        message: `Whale Bull Ratio: ${(whale.whaleBullRatio * 100).toFixed(1)}%`,
      };
    } catch (err) {
      return {
        status: "down",
        latencyMs: Date.now() - start,
        lastUpdated: new Date().toISOString(),
        isStale: true,
        message: err instanceof Error ? err.message : "Whale telemetry unavailable",
      };
    }
  }

  private async checkMacroProvider(): Promise<Omit<ProviderHealthDetail, "id" | "name" | "category">> {
    const start = Date.now();
    try {
      const macro = await macroService.getMacroSnapshot();
      const latencyMs = Date.now() - start;
      const isDegraded = macro.freshness !== "available" || latencyMs > 3500;
      const { regime } = macroService.interpretRegime(macro);
      return {
        status: isDegraded ? "degraded" : "healthy",
        latencyMs,
        lastUpdated: macro.timestamp || new Date().toISOString(),
        isStale: macro.freshness === "stale",
        message: `Regime: ${regime.toUpperCase()}, Freshness: ${macro.freshness}`,
      };
    } catch (err) {
      return {
        status: "down",
        latencyMs: Date.now() - start,
        lastUpdated: new Date().toISOString(),
        isStale: true,
        message: err instanceof Error ? err.message : "Macro API unavailable",
      };
    }
  }

  private async checkDatabase(): Promise<Omit<ProviderHealthDetail, "id" | "name" | "category">> {
    const start = Date.now();
    try {
      // Fast read test against Prisma
      await prisma.signalDecision.findFirst({
        select: { id: true },
      });
      const latencyMs = Date.now() - start;
      return {
        status: latencyMs > 1000 ? "degraded" : "healthy",
        latencyMs,
        lastUpdated: new Date().toISOString(),
        isStale: false,
        message: "Connected & operational",
      };
    } catch (err) {
      return {
        status: "degraded", // Degraded rather than hard down if DB URL is unconfigured
        latencyMs: Date.now() - start,
        lastUpdated: new Date().toISOString(),
        isStale: true,
        message: err instanceof Error ? err.message.slice(0, 100) : "Database disconnected",
      };
    }
  }

  private resolveResult(
    settled: PromiseSettledResult<Omit<ProviderHealthDetail, "id" | "name" | "category">>,
    id: string,
    name: string,
    category: ProviderHealthDetail["category"]
  ): ProviderHealthDetail {
    if (settled.status === "fulfilled") {
      return {
        id,
        name,
        category,
        ...settled.value,
      };
    }
    return {
      id,
      name,
      category,
      status: "down",
      latencyMs: 0,
      lastUpdated: new Date().toISOString(),
      isStale: true,
      message: settled.reason instanceof Error ? settled.reason.message : "Unknown error",
    };
  }
}

export const healthMonitoringService = new HealthMonitoringService();
