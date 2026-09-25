import { describe, it, expect } from "vitest";
import { signalService } from "@/features/signal/services/signal.service";
import type { SignalContext } from "@/features/signal/types/signal.types";

describe("Signal Engine Feature", () => {
  const baseContext: SignalContext = {
    market: {
      price: 85000,
      change24h: 3.2,
      volume24h: 32000000000,
      marketCap: 1680000000000,
      timestamp: "2026-03-01T12:00:00.000Z",
      provider: "coingecko",
    },
    technicals: {
      rsi14: 58,
      ema20: 84000,
      ema50: 82000,
      sma20: 83500,
      atr14: 1100,
      volatility: 2.2,
      priceChange: 1.1,
      currentPrice: 85000,
      timestamp: "2026-03-01T12:00:00.000Z",
    },
    network: {
      blockHeight: 850000,
      txCount: 65000,
      mempoolSize: 32000000,
      fastestFee: 16,
      halfHourFee: 14,
      hourFee: 12,
      timestamp: "2026-03-01T12:00:00.000Z",
      provider: "mempool.space",
    },
    anomaly: {
      isAnomaly: false,
      reasons: [],
      feeSurgeLevel: "NORMAL",
    },
    news: [],
    jev: {
      marketRegime: "bullish",
      regimeConfidence: 0.88,
      newsDirection: "bullish",
      newsImpactScore: 7.5,
      setupQualityScore: 8.5,
      networkAnomalyScore: 0.1,
      isNetworkAnomaly: false,
      summary: "Strong bullish context",
      isDegraded: false,
      timestamp: "2026-03-01T12:00:00.000Z",
    },
  };

  it("produces LONG signal when technicals and Jev agree bullishly", () => {
    const result = signalService.generateSignal(baseContext);
    expect(result.action).toBe("LONG");
    expect(result.confidence).toBeGreaterThan(60);
    expect(result.reasons.some((r) => r.includes("golden trend structure"))).toBe(true);
  });

  it("produces SHORT signal when technicals and Jev agree bearishly", () => {
    const bearishContext: SignalContext = {
      ...baseContext,
      market: { ...baseContext.market, price: 79000 },
      technicals: {
        ...baseContext.technicals,
        currentPrice: 79000,
        ema20: 80000,
        ema50: 82000,
        rsi14: 38,
      },
      jev: {
        ...baseContext.jev,
        marketRegime: "bearish",
        newsDirection: "bearish",
        setupQualityScore: 8.0,
      },
    };

    const result = signalService.generateSignal(bearishContext);
    expect(result.action).toBe("SHORT");
    expect(result.confidence).toBeGreaterThan(60);
    expect(result.reasons.some((r) => r.includes("breakdown structure"))).toBe(true);
  });

  it("resolves to WAIT when technicals and Jev conflict", () => {
    const conflictContext: SignalContext = {
      ...baseContext,
      // Technicals are bullish (price > ema20 > ema50), but Jev is bearish
      jev: {
        ...baseContext.jev,
        marketRegime: "bearish",
        newsDirection: "bearish",
      },
    };

    const result = signalService.generateSignal(conflictContext);
    expect(result.action).toBe("WAIT");
    expect(result.reasons.some((r) => r.includes("Conflict detected"))).toBe(true);
  });

  it("produces LONG signal in Pure Deterministic Mode when Jev is degraded and technicals are bullish", () => {
    const degradedContext: SignalContext = {
      ...baseContext,
      jev: {
        ...baseContext.jev,
        isDegraded: true,
        degradedReason: "API Key omitted",
      },
    };

    const result = signalService.generateSignal(degradedContext);
    expect(result.action).toBe("LONG");
    expect(result.confidence).toBeGreaterThanOrEqual(70);
    expect(result.reasons.some((r) => r.includes("Pure Deterministic Mode"))).toBe(true);
  });

  it("resolves to WAIT in Pure Deterministic Mode when market is ranging / neutral", () => {
    const neutralContext: SignalContext = {
      ...baseContext,
      market: { ...baseContext.market, price: 83000 },
      technicals: {
        ...baseContext.technicals,
        currentPrice: 83000,
        ema20: 84000,
        ema50: 82000, // Price 83k < ema20 84k, but ema20 > ema50 82k -> ranging / neutral
        rsi14: 50,
      },
      jev: {
        ...baseContext.jev,
        isDegraded: true,
        degradedReason: "API Key omitted",
      },
    };

    const result = signalService.generateSignal(neutralContext);
    expect(result.action).toBe("WAIT");
    expect(result.reasons.some((r) => r.includes("Pure Deterministic Mode"))).toBe(true);
  });

  it("resolves to WAIT when network anomaly is detected", () => {
    const anomalyContext: SignalContext = {
      ...baseContext,
      anomaly: {
        isAnomaly: true,
        reasons: ["Critical fee spike 120 sat/vB"],
        feeSurgeLevel: "EXTREME",
      },
    };

    const result = signalService.generateSignal(anomalyContext);
    expect(result.action).toBe("WAIT");
    expect(result.reasons.some((r) => r.includes("Network stress detected"))).toBe(true);
  });

  it("resolves to WAIT when RSI is exhausted / overbought (> 78)", () => {
    const overboughtContext: SignalContext = {
      ...baseContext,
      technicals: {
        ...baseContext.technicals,
        rsi14: 82,
      },
    };

    const result = signalService.generateSignal(overboughtContext);
    expect(result.action).toBe("WAIT");
    expect(result.reasons.some((r) => r.includes("RSI severely overbought"))).toBe(true);
  });

  describe("Advanced Intelligence Rules: Multi-Timeframe Alignment", () => {
    it("suppresses LONG to WAIT when higher timeframe alignment is bearish", () => {
      const mtfBearishContext: SignalContext = {
        ...baseContext,
        multiTimeframe: {
          overallTrend: "bearish",
          alignedCount: 3,
          alignmentStatus: "aligned bearish",
          timeframes: [],
        },
      };

      const result = signalService.generateSignal(mtfBearishContext);
      expect(result.action).toBe("WAIT");
      expect(
        result.reasons.some((r) =>
          r.includes("Higher timeframe alignment is bearish; suppressing LONG signal."),
        ),
      ).toBe(true);
    });

    it("suppresses SHORT to WAIT when higher timeframe alignment is bullish", () => {
      const bearishContext: SignalContext = {
        ...baseContext,
        market: { ...baseContext.market, price: 79000 },
        technicals: {
          ...baseContext.technicals,
          currentPrice: 79000,
          ema20: 80000,
          ema50: 82000,
          rsi14: 38,
        },
        jev: {
          ...baseContext.jev,
          marketRegime: "bearish",
          newsDirection: "bearish",
          setupQualityScore: 8.0,
        },
        multiTimeframe: {
          overallTrend: "bullish",
          alignedCount: 4,
          alignmentStatus: "aligned bullish",
          timeframes: [],
        },
      };

      const result = signalService.generateSignal(bearishContext);
      expect(result.action).toBe("WAIT");
      expect(
        result.reasons.some((r) =>
          r.includes("Higher timeframe alignment is bullish; suppressing SHORT signal."),
        ),
      ).toBe(true);
    });
  });

  describe("Advanced Intelligence Rules: Derivatives Funding Spike", () => {
    it("suppresses LONG to WAIT when funding spike > 0.05% indicates long squeeze risk", () => {
      const longSqueezeContext: SignalContext = {
        ...baseContext,
        derivatives: {
          timestamp: new Date().toISOString(),
          fundingRate: 0.08,
          openInterest: 50000,
          longShortRatio: 1.5,
          eventFlags: {
            isFundingSpike: true,
            isOiExpansion: false,
            isPositionImbalance: false,
          },
        },
      };

      const result = signalService.generateSignal(longSqueezeContext);
      expect(result.action).toBe("WAIT");
      expect(
        result.reasons.some((r) =>
          r.includes("Derivatives funding spike detected (>0.05%): Long squeeze hazard."),
        ),
      ).toBe(true);
    });

    it("suppresses SHORT to WAIT when funding spike < -0.02% indicates short squeeze risk", () => {
      const shortSqueezeContext: SignalContext = {
        ...baseContext,
        market: { ...baseContext.market, price: 79000 },
        technicals: {
          ...baseContext.technicals,
          currentPrice: 79000,
          ema20: 80000,
          ema50: 82000,
          rsi14: 38,
        },
        jev: {
          ...baseContext.jev,
          marketRegime: "bearish",
          newsDirection: "bearish",
          setupQualityScore: 8.0,
        },
        derivatives: {
          timestamp: new Date().toISOString(),
          fundingRate: -0.04,
          openInterest: 52000,
          longShortRatio: 0.8,
          eventFlags: {
            isFundingSpike: true,
            isOiExpansion: false,
            isPositionImbalance: false,
          },
        },
      };

      const result = signalService.generateSignal(shortSqueezeContext);
      expect(result.action).toBe("WAIT");
      expect(
        result.reasons.some((r) =>
          r.includes("Derivatives funding spike detected (<-0.02%): Short squeeze hazard."),
        ),
      ).toBe(true);
    });
  });

  describe("Advanced Intelligence Rules: Whale Positioning", () => {
    it("suppresses LONG to WAIT when top whale positioning is heavily short (< 30% bull ratio)", () => {
      const whaleShortContext: SignalContext = {
        ...baseContext,
        whale: {
          topTraders: [],
          totalWhaleLongUsd: 20000000,
          totalWhaleShortUsd: 80000000,
          whaleBullRatio: 0.2,
          largeTransactions: [],
          freshness: "FRESH",
        },
      };

      const result = signalService.generateSignal(whaleShortContext);
      expect(result.action).toBe("WAIT");
      expect(
        result.reasons.some((r) =>
          r.includes("Top whale positioning heavily short (<30% bull ratio); suppressing LONG signal."),
        ),
      ).toBe(true);
    });

    it("suppresses SHORT to WAIT when top whale positioning is heavily long (> 70% bull ratio)", () => {
      const whaleLongContext: SignalContext = {
        ...baseContext,
        market: { ...baseContext.market, price: 79000 },
        technicals: {
          ...baseContext.technicals,
          currentPrice: 79000,
          ema20: 80000,
          ema50: 82000,
          rsi14: 38,
        },
        jev: {
          ...baseContext.jev,
          marketRegime: "bearish",
          newsDirection: "bearish",
          setupQualityScore: 8.0,
        },
        whale: {
          topTraders: [],
          totalWhaleLongUsd: 90000000,
          totalWhaleShortUsd: 10000000,
          whaleBullRatio: 0.9,
          largeTransactions: [],
          freshness: "FRESH",
        },
      };

      const result = signalService.generateSignal(whaleLongContext);
      expect(result.action).toBe("WAIT");
      expect(
        result.reasons.some((r) =>
          r.includes("Top whale positioning heavily long (>70% bull ratio); suppressing SHORT signal."),
        ),
      ).toBe(true);
    });
  });

  describe("Confidence Engine with Advanced Intelligence Features", () => {
    it("boosts confidence when multi-timeframe, whale, derivatives, and macro are aligned", () => {
      const baseResult = signalService.generateSignal(baseContext);

      const alignedContext: SignalContext = {
        ...baseContext,
        multiTimeframe: {
          overallTrend: "bullish",
          alignedCount: 4,
          alignmentStatus: "aligned bullish",
          timeframes: [],
        },
        whale: {
          topTraders: [],
          totalWhaleLongUsd: 70000000,
          totalWhaleShortUsd: 30000000,
          whaleBullRatio: 0.7,
          largeTransactions: [],
          freshness: "FRESH",
        },
        derivatives: {
          timestamp: new Date().toISOString(),
          fundingRate: 0.01,
          openInterest: 40000,
          longShortRatio: 1.2,
          eventFlags: {
            isFundingSpike: false,
            isOiExpansion: false,
            isPositionImbalance: false,
          },
        },
        macro: {
          timestamp: new Date().toISOString(),
          dxy: { value: 102.5, changePercent: -0.3 },
          equities: { sp500: 5200 },
          freshness: "available",
        },
        newsSentiment: {
          overallSentiment: "bullish",
          averageImpactScore: 7.2,
          items: [],
        },
      };

      const alignedResult = signalService.generateSignal(alignedContext);
      expect(alignedResult.action).toBe("LONG");
      expect(alignedResult.confidence).toBeGreaterThan(baseResult.confidence);
      expect(alignedResult.confidence).toBeLessThanOrEqual(100);
    });
  });
});
