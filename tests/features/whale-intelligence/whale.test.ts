import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateWhaleBullRatio,
  calculateBullBearRatio,
  calculateWhaleMetrics,
  isLargeTransaction,
  filterLargeTransactions,
  classifyBtcTransaction,
  mapMempoolTxToWhaleTx,
  LARGE_BTC_TRANSACTION_THRESHOLD,
  SATS_PER_BTC,
  hyperbotTraderSchema,
  hyperbotDiscoverResponseSchema,
  mempoolRecentTxSchema,
  mempoolRecentTxsSchema,
  HyperbotService,
  TransactionService,
  WhaleService,
  type HyperliquidWhaleTrader,
  type WhaleTransaction,
} from "@/features/whale-intelligence";

describe("Whale & On-Chain Intelligence Feature", () => {
  describe("1. Whale Bull Ratio & Metrics Calculation", () => {
    it("calculates 50/50 ratio when long and short exposures are equal", () => {
      const ratio = calculateWhaleBullRatio(50_000_000, 50_000_000);
      expect(ratio).toBe(0.5);
    });

    it("calculates correct ratio for heavy bullish positioning", () => {
      // 75M Long / (75M Long + 25M Short) = 0.75
      const ratio = calculateWhaleBullRatio(75_000_000, 25_000_000);
      expect(ratio).toBe(0.75);
    });

    it("calculates correct ratio for heavy bearish positioning", () => {
      // 20M Long / (20M Long + 80M Short) = 0.20
      const ratio = calculateWhaleBullRatio(20_000_000, 80_000_000);
      expect(ratio).toBe(0.2);
    });

    it("handles zero total exposure gracefully without NaN", () => {
      const ratio = calculateWhaleBullRatio(0, 0);
      expect(ratio).toBe(0.5);
      expect(Number.isNaN(ratio)).toBe(false);
    });

    it("handles negative values defensively by clamping to zero", () => {
      const ratio = calculateWhaleBullRatio(-100, -200);
      expect(ratio).toBe(0.5);
    });

    it("calculates direct bull/bear ratio", () => {
      expect(calculateBullBearRatio(100, 50)).toBe(2);
      expect(calculateBullBearRatio(100, 0)).toBe(100);
      expect(calculateBullBearRatio(0, 0)).toBe(1);
    });

    it("aggregates traders and determines correct whale bias", () => {
      const mockTraders: HyperliquidWhaleTrader[] = [
        {
          address: "0x1111111111111111111111111111111111111111",
          winRate: 0.7,
          totalPnl: 1_000_000,
          longPnl: 1_000_000,
          shortPnl: 0,
          avgLeverage: 10,
          snapLongPositionValue: 6_000_000,
          snapShortPositionValue: 1_000_000,
          snapLongPositionCount: 2,
          snapShortPositionCount: 1,
          snapTotalValue: 3_000_000,
        },
        {
          address: "0x2222222222222222222222222222222222222222",
          winRate: 0.6,
          totalPnl: 500_000,
          longPnl: 500_000,
          shortPnl: 0,
          avgLeverage: 5,
          snapLongPositionValue: 4_000_000,
          snapShortPositionValue: 2_000_000,
          snapLongPositionCount: 1,
          snapShortPositionCount: 1,
          snapTotalValue: 2_000_000,
        },
      ];

      const metrics = calculateWhaleMetrics(mockTraders);
      expect(metrics.totalWhaleLongUsd).toBe(10_000_000);
      expect(metrics.totalWhaleShortUsd).toBe(3_000_000);
      // 10 / 13 ~= 0.7692
      expect(metrics.whaleBullRatio).toBeCloseTo(0.7692, 3);
      expect(metrics.whaleBias).toBe("BULLISH");
      expect(metrics.activeWhalesCount).toBe(2);
    });

    it("identifies BEARISH bias when short positions dominate", () => {
      const mockBearishTraders: HyperliquidWhaleTrader[] = [
        {
          address: "0x3333333333333333333333333333333333333333",
          winRate: 0.5,
          totalPnl: 200_000,
          longPnl: 0,
          shortPnl: 200_000,
          avgLeverage: 8,
          snapLongPositionValue: 1_000_000,
          snapShortPositionValue: 9_000_000,
          snapLongPositionCount: 1,
          snapShortPositionCount: 3,
          snapTotalValue: 2_500_000,
        },
      ];

      const metrics = calculateWhaleMetrics(mockBearishTraders);
      expect(metrics.whaleBullRatio).toBe(0.1);
      expect(metrics.whaleBias).toBe("BEARISH");
    });
  });

  describe("2. Mempool Large Transaction Threshold Filtering", () => {
    it("correctly identifies transactions above 10 BTC threshold", () => {
      expect(isLargeTransaction(10.01)).toBe(true);
      expect(isLargeTransaction(10.0)).toBe(false); // strictly greater than 10 BTC
      expect(isLargeTransaction(9.99)).toBe(false);
      expect(isLargeTransaction(150)).toBe(true);
    });

    it("filters list of transactions with default 10 BTC threshold", () => {
      const sampleTxs = [
        { amountBtc: 5.5, id: "1" },
        { amountBtc: 10.0, id: "2" },
        { amountBtc: 10.5, id: "3" },
        { amountBtc: 54.2, id: "4" },
        { amountBtc: 0.25, id: "5" },
        { amountBtc: 120.0, id: "6" },
      ];

      const filtered = filterLargeTransactions(sampleTxs);
      expect(filtered.length).toBe(3);
      expect(filtered.map((t) => t.id)).toEqual(["3", "4", "6"]);
    });

    it("supports custom thresholds", () => {
      const sampleTxs = [
        { amountBtc: 25.0, id: "1" },
        { amountBtc: 55.0, id: "2" },
        { amountBtc: 110.0, id: "3" },
      ];

      const filtered = filterLargeTransactions(sampleTxs, 50);
      expect(filtered.length).toBe(2);
      expect(filtered.map((t) => t.id)).toEqual(["2", "3"]);
    });

    it("correctly classifies transaction size tiers", () => {
      expect(classifyBtcTransaction(150)).toBe("Mega Whale Transfer");
      expect(classifyBtcTransaction(100)).toBe("Mega Whale Transfer");
      expect(classifyBtcTransaction(75)).toBe("Whale Transfer");
      expect(classifyBtcTransaction(50)).toBe("Whale Transfer");
      expect(classifyBtcTransaction(25)).toBe("Large Transfer");
      expect(classifyBtcTransaction(10.5)).toBe("Large Transfer");
    });

    it("maps raw mempool satoshi transactions to WhaleTransaction structure", () => {
      const rawTx = {
        txid: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        fee: 5400,
        vsize: 140,
        value: 2_500_000_000, // 25 BTC
      };

      const whaleTx = mapMempoolTxToWhaleTx(rawTx, 100_000, "2026-03-01T00:00:00.000Z");

      expect(whaleTx.transactionId).toBe(rawTx.txid);
      expect(whaleTx.amountBtc).toBe(25);
      expect(whaleTx.amountUsd).toBe(2_500_000);
      expect(whaleTx.classification).toBe("Large Transfer");
      expect(whaleTx.source).toBe("Mempool (Unconfirmed)");
      expect(whaleTx.destination).toBe("Pending Block");
    });
  });

  describe("3. Zod Schema Validation", () => {
    it("parses valid Hyperbot trader object with coerced string numbers", () => {
      const rawTrader = {
        address: "0xbf732ea04197942783e34730ed6e0f6099575d58",
        winRate: 0.64,
        totalPnl: "6149799.4040520000",
        longPnl: "6148245.0053970000",
        shortPnl: "1554.3986550000",
        avgLeverage: "11.555555",
        snapLongPositionValue: "16282378.4248000000",
        snapShortPositionValue: "0.0000000000",
        snapLongPositionCount: 2,
        snapShortPositionCount: 0,
        snapTotalValue: "7276642.74727302660373",
      };

      const parsed = hyperbotTraderSchema.safeParse(rawTrader);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.address).toBe(rawTrader.address);
        expect(typeof parsed.data.totalPnl).toBe("number");
        expect(parsed.data.totalPnl).toBeCloseTo(6149799.404, 2);
        expect(parsed.data.avgLeverage).toBeCloseTo(11.555, 2);
        expect(parsed.data.snapLongPositionValue).toBeCloseTo(16282378.42, 2);
      }
    });

    it("handles null and empty numeric values in trader schema safely", () => {
      const rawWithNulls = {
        address: "0x1234567890123456789012345678901234567890",
        winRate: null,
        totalPnl: "",
        longPnl: null,
        shortPnl: undefined,
        avgLeverage: null,
        snapLongPositionValue: "",
        snapShortPositionValue: null,
        snapLongPositionCount: null,
        snapShortPositionCount: null,
        snapTotalValue: null,
      };

      const parsed = hyperbotTraderSchema.safeParse(rawWithNulls);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.winRate).toBe(0);
        expect(parsed.data.totalPnl).toBe(0);
        expect(parsed.data.avgLeverage).toBe(1);
        expect(parsed.data.snapLongPositionValue).toBe(0);
      }
    });

    it("parses Hyperbot wrapped discover envelope", () => {
      const rawEnvelope = {
        code: "0",
        msg: "success",
        data: {
          list: [
            {
              address: "0xbf732ea04197942783e34730ed6e0f6099575d58",
              winRate: 0.5,
              totalPnl: "1000000",
              longPnl: "800000",
              shortPnl: "200000",
              avgLeverage: "5",
              snapLongPositionValue: "5000000",
              snapShortPositionValue: "1000000",
              snapLongPositionCount: 2,
              snapShortPositionCount: 1,
              snapTotalValue: "3000000",
            },
          ],
          total: 1,
        },
      };

      const parsed = hyperbotDiscoverResponseSchema.safeParse(rawEnvelope);
      expect(parsed.success).toBe(true);
    });

    it("parses direct array envelope", () => {
      const rawArray = [
        {
          address: "0xbf732ea04197942783e34730ed6e0f6099575d58",
          winRate: 0.5,
          totalPnl: 1000000,
          longPnl: 800000,
          shortPnl: 200000,
          avgLeverage: 5,
          snapLongPositionValue: 5000000,
          snapShortPositionValue: 1000000,
          snapLongPositionCount: 2,
          snapShortPositionCount: 1,
          snapTotalValue: 3000000,
        },
      ];

      const parsed = hyperbotDiscoverResponseSchema.safeParse(rawArray);
      expect(parsed.success).toBe(true);
    });

    it("parses mempool recent transactions correctly", () => {
      const rawMempoolTxs = [
        {
          txid: "101a8f821d361fc407a21fa05358590f6b03574fce245d89f74825ad7925e61e",
          fee: 1489,
          vsize: 139,
          value: 16232,
        },
        {
          txid: "adba5ae526f8ee90043f8cf808d4a53e0ec6a99430e34add6fe0e5bdc6ba60da",
          fee: 1615,
          vsize: 180,
          value: 1500000000, // 15 BTC
        },
      ];

      const parsed = mempoolRecentTxsSchema.safeParse(rawMempoolTxs);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.length).toBe(2);
        expect(parsed.data[1].value).toBe(1500000000);
      }
    });

    it("rejects mempool tx with invalid structure", () => {
      const invalidTx = {
        txid: "",
        fee: -10,
        vsize: 0,
        value: -500,
      };

      const parsed = mempoolRecentTxSchema.safeParse(invalidTx);
      expect(parsed.success).toBe(false);
    });
  });

  describe("4. Service Orchestration & Freshness Tracking", () => {
    let whaleServiceInstance: WhaleService;

    beforeEach(() => {
      whaleServiceInstance = new WhaleService({
        cacheTtlMs: 5000, // 5s TTL for test
      });
      whaleServiceInstance.clearCache();
    });

    it("tracks freshness accurately from uninitialized to fetched state", async () => {
      expect(whaleServiceInstance.getFreshness()).toBe("No data fetched yet");
      expect(whaleServiceInstance.getLastFetchedAt()).toBeNull();
      expect(whaleServiceInstance.isCacheStale()).toBe(true);

      const summary = await whaleServiceInstance.getWhaleIntelligence();

      expect(summary).toBeDefined();
      expect(summary.topTraders.length).toBeGreaterThan(0);
      expect(summary.largeTransactions.length).toBeGreaterThan(0);
      expect(typeof summary.totalWhaleLongUsd).toBe("number");
      expect(typeof summary.totalWhaleShortUsd).toBe("number");
      expect(typeof summary.whaleBullRatio).toBe("number");
      expect(summary.freshness).toBeDefined();

      expect(whaleServiceInstance.getFreshness()).toBe("Just now");
      expect(whaleServiceInstance.getLastFetchedAt()).toBeInstanceOf(Date);
      expect(whaleServiceInstance.isCacheStale()).toBe(false);
    });

    it("returns cached summary within TTL without re-fetching", async () => {
      const first = await whaleServiceInstance.getWhaleIntelligence();
      const second = await whaleServiceInstance.getWhaleIntelligence();

      expect(first.freshness).toBe(second.freshness);
      expect(first.topTraders).toBe(second.topTraders);
    });

    it("forces refresh when forceRefresh flag is provided", async () => {
      const first = await whaleServiceInstance.getWhaleIntelligence();
      // Wait a tiny delay to ensure distinct timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const refreshed = await whaleServiceInstance.getWhaleIntelligence({
        forceRefresh: true,
      });

      expect(refreshed).toBeDefined();
      expect(refreshed.freshness).not.toBe("");
    });
  });
});
