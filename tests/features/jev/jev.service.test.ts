import { describe, it, expect } from "vitest";
import { JevService } from "@/features/jev/services/jev.service";
import { jevAnalysisResultSchema } from "@/features/jev/schemas/jev.schema";
import type { JevInputContext } from "@/features/jev/types/jev.types";

describe("Jev Feature", () => {
  const dummyContext: JevInputContext = {
    market: {
      price: 84000,
      change24h: 1.5,
      volume24h: 30000000000,
      marketCap: 1650000000000,
      timestamp: "2026-03-01T12:00:00.000Z",
      provider: "coingecko",
    },
    technicals: {
      rsi14: 55,
      ema20: 83500,
      ema50: 82000,
      sma20: 83000,
      atr14: 1200,
      volatility: 2.1,
      priceChange: 0.8,
      currentPrice: 84000,
      timestamp: "2026-03-01T12:00:00.000Z",
    },
    network: {
      blockHeight: 850000,
      txCount: 60000,
      mempoolSize: 30000000,
      fastestFee: 15,
      halfHourFee: 12,
      hourFee: 10,
      timestamp: "2026-03-01T12:00:00.000Z",
      provider: "mempool.space",
    },
    networkAnomaly: {
      isAnomaly: false,
      reasons: [],
      feeSurgeLevel: "NORMAL",
    },
    news: [
      {
        title: "Bitcoin institutional adoption accelerates",
        url: "https://example.com/news/1",
        publishedAt: "2026-03-01T11:00:00.000Z",
        source: "CoinDesk",
      },
    ],
  };

  it("validates well-formed Jev analysis result schema", () => {
    const valid = {
      marketRegime: "bullish",
      regimeConfidence: 0.85,
      newsDirection: "bullish",
      newsImpactScore: 7.5,
      setupQualityScore: 8.0,
      networkAnomalyScore: 0.1,
      isNetworkAnomaly: false,
      summary: "Bullish alignment across factors",
      isDegraded: false,
      timestamp: new Date().toISOString(),
    };

    const parsed = jevAnalysisResultSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("gracefully returns degraded neutral state when TYPESAFE_API_KEY is omitted", async () => {
    // Explicitly create service without API key
    const service = new JevService("");
    const result = await service.analyze(dummyContext);

    expect(result.isDegraded).toBe(true);
    expect(result.marketRegime).toBe("uncertain");
    expect(result.newsDirection).toBe("neutral");
    expect(result.degradedReason).toBeDefined();
    // Validate schema compliance even in degraded state
    const parsed = jevAnalysisResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });
});
