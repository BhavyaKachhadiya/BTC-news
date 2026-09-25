import { describe, it, expect } from "vitest";
import {
  newsSentimentService,
  newsTimelineService,
  sentimentNewsItemSchema,
  sentimentTimelineSummarySchema,
} from "@/features/news-sentiment";
import type {
  NewsSentiment,
  NewsImpact,
  SentimentNewsItem,
} from "@/features/news-sentiment";
import type { NewsItem } from "@/features/news";
import type { HistoricalDataPoint } from "@/features/market";

describe("News Sentiment & Timeline Feature", () => {
  describe("Sentiment Classification (newsSentimentService)", () => {
    it("correctly classifies strong bullish headlines", () => {
      const headline = "Bitcoin surges past resistance to hit new all-time high with massive ETF inflows";
      const result = newsSentimentService.classifyHeadline(headline);

      expect(result.sentiment).toBe("bullish");
      expect(result.score).toBeGreaterThan(0.4);
      expect(result.detectedKeywords.bullish).toContain("all-time high");
    });

    it("correctly classifies strong bearish headlines", () => {
      const headline = "SEC sues major crypto exchange; Bitcoin crashes in massive sell-off";
      const result = newsSentimentService.classifyHeadline(headline);

      expect(result.sentiment).toBe("bearish");
      expect(result.score).toBeLessThan(-0.4);
      expect(result.detectedKeywords.bearish).toContain("sec sues");
    });

    it("correctly classifies mixed sentiment headlines", () => {
      const headline = "Bitcoin displays mixed signals as institutional ETF inflows clash with severe liquidation panic";
      const result = newsSentimentService.classifyHeadline(headline);

      expect(result.sentiment).toBe("mixed");
    });

    it("correctly classifies routine neutral headlines", () => {
      const headline = "Routine node upgrade v27.1 released by core contributors";
      const result = newsSentimentService.classifyHeadline(headline);

      expect(result.sentiment).toBe("neutral");
      expect(result.score).toBe(0);
    });

    it("handles negation phrases by not blindly tagging bullish", () => {
      const headline = "Bitcoin rally fails and price is not bullish as buyers disappear";
      const result = newsSentimentService.classifyHeadline(headline);

      expect(result.sentiment).not.toBe("bullish");
    });
  });

  describe("Impact Scoring (newsSentimentService)", () => {
    it("assigns exceptional impact to landmark regulatory/reserve events", () => {
      const headline = "US Senate proposes strategic bitcoin reserve alongside spot etf approval";
      const result = newsSentimentService.classifyHeadline(headline);

      expect(result.impact).toBe("exceptional");
      expect(result.impactScore).toBe(10);
    });

    it("assigns high impact to major macro and institutional catalysts", () => {
      const headline = "Federal Reserve interest rate cut triggers massive BlackRock ETF inflow";
      const result = newsSentimentService.classifyHeadline(headline);

      expect(["exceptional", "high"]).toContain(result.impact);
      expect(result.impactScore).toBeGreaterThanOrEqual(7.5);
    });

    it("assigns moderate impact to typical price movements and breakouts", () => {
      const headline = "Bitcoin miner hashrate rebound leads to minor price surge";
      const result = newsSentimentService.classifyHeadline(headline);

      expect(result.impact).toBe("moderate");
      expect(result.impactScore).toBe(5);
    });

    it("assigns low or negligible impact to opinion and routine commentary", () => {
      const headline = "Analyst predicts potential chart pattern for Bitcoin next month";
      const result = newsSentimentService.classifyHeadline(headline);

      expect(["low", "negligible"]).toContain(result.impact);
      expect(result.impactScore).toBeLessThanOrEqual(2.5);
    });
  });

  describe("Timeline Correlation & Price Tracking (newsTimelineService)", () => {
    const fixedNow = 1770000000000; // Reference timestamp in ms

    const mockChart: readonly HistoricalDataPoint[] = [
      { timestamp: fixedNow - 30 * 3600 * 1000, price: 90000 },
      { timestamp: fixedNow - 29 * 3600 * 1000, price: 91000 }, // +1h for item 30h ago
      { timestamp: fixedNow - 26 * 3600 * 1000, price: 92500 }, // +4h for item 30h ago
      { timestamp: fixedNow - 6 * 3600 * 1000, price: 94000 },  // +24h for item 30h ago
      { timestamp: fixedNow - 8 * 3600 * 1000, price: 93000 },
      { timestamp: fixedNow - 7 * 3600 * 1000, price: 93500 }, // +1h for item 8h ago
      { timestamp: fixedNow - 4 * 3600 * 1000, price: 94200 }, // +4h for item 8h ago
      { timestamp: fixedNow - 30 * 60 * 1000, price: 95000 },  // 30 min ago
      { timestamp: fixedNow, price: 95200 },
    ];

    it("resolves outcomes according to elapsed time", () => {
      const itemRecent: SentimentNewsItem = {
        id: "item-recent",
        title: "Breaking: Bitcoin test news",
        url: "https://example.com/recent",
        publishedAt: new Date(fixedNow - 30 * 60 * 1000).toISOString(), // 30 min ago
        sentiment: "bullish",
        impact: "high",
        score: 0.8,
      };

      const item8hAgo: SentimentNewsItem = {
        id: "item-8h",
        title: "Bitcoin ETF inflows surge",
        url: "https://example.com/8h",
        publishedAt: new Date(fixedNow - 8 * 3600 * 1000).toISOString(), // 8 hours ago
        sentiment: "bullish",
        impact: "high",
        score: 0.75,
      };

      const item30hAgo: SentimentNewsItem = {
        id: "item-30h",
        title: "Bitcoin institutional adoption milestone",
        url: "https://example.com/30h",
        publishedAt: new Date(fixedNow - 30 * 3600 * 1000).toISOString(), // 30 hours ago
        sentiment: "bullish",
        impact: "exceptional",
        score: 0.9,
      };

      const correlated = newsTimelineService.correlateNewsWithPrices(
        [itemRecent, item8hAgo, item30hAgo],
        95200,
        mockChart,
        fixedNow,
      );

      // Recent item (< 1 hour elapsed): 1h, 4h, 24h outcomes must remain undefined
      expect(correlated[0].btcPriceAtPub).toBeDefined();
      expect(correlated[0].btcPriceAfter1h).toBeUndefined();
      expect(correlated[0].btcPriceAfter4h).toBeUndefined();
      expect(correlated[0].btcPriceAfter24h).toBeUndefined();

      // 8 hours ago item: 1h and 4h resolved, 24h undefined
      expect(correlated[1].btcPriceAfter1h).toBe(93500);
      expect(correlated[1].btcPriceAfter4h).toBe(94200);
      expect(correlated[1].btcPriceAfter24h).toBeUndefined();

      // 30 hours ago item: 1h, 4h, and 24h all resolved
      expect(correlated[2].btcPriceAfter1h).toBe(91000);
      expect(correlated[2].btcPriceAfter4h).toBe(92500);
      expect(correlated[2].btcPriceAfter24h).toBe(94000);
    });

    it("calculates outcome percentage returns correctly", () => {
      const item: SentimentNewsItem = {
        id: "test-metrics",
        title: "Bitcoin breakout",
        url: "https://example.com/metrics",
        publishedAt: new Date(fixedNow - 24 * 3600 * 1000).toISOString(),
        sentiment: "bullish",
        impact: "high",
        score: 0.8,
        btcPriceAtPub: 100000,
        btcPriceAfter1h: 102000, // +2%
        btcPriceAfter4h: 105000, // +5%
        btcPriceAfter24h: 98000, // -2%
      };

      const metrics = newsTimelineService.calculateOutcomeMetrics(item);

      expect(metrics.pnlPercent1h).toBe(2.0);
      expect(metrics.pnlPercent4h).toBe(5.0);
      expect(metrics.pnlPercent24h).toBe(-2.0);
      expect(metrics.isResolved1h).toBe(true);
      expect(metrics.isResolved4h).toBe(true);
      expect(metrics.isResolved24h).toBe(true);
    });
  });

  describe("Timeline Ordering & Aggregation (buildTimelineSummary)", () => {
    it("orders items reverse-chronologically (newest first)", () => {
      const items: SentimentNewsItem[] = [
        {
          id: "old",
          title: "Old News",
          url: "https://example.com/old",
          publishedAt: "2026-03-01T10:00:00Z",
          sentiment: "neutral",
          impact: "low",
          score: 0,
        },
        {
          id: "newest",
          title: "Newest News",
          url: "https://example.com/newest",
          publishedAt: "2026-03-01T15:00:00Z",
          sentiment: "bullish",
          impact: "high",
          score: 0.8,
        },
        {
          id: "mid",
          title: "Mid News",
          url: "https://example.com/mid",
          publishedAt: "2026-03-01T12:00:00Z",
          sentiment: "bearish",
          impact: "moderate",
          score: -0.5,
        },
      ];

      const summary = newsTimelineService.buildTimelineSummary(items);

      expect(summary.items[0].id).toBe("newest");
      expect(summary.items[1].id).toBe("mid");
      expect(summary.items[2].id).toBe("old");
    });

    it("calculates accurate overall sentiment and average impact score", () => {
      const items: SentimentNewsItem[] = [
        {
          id: "1",
          title: "Rally 1",
          url: "https://example.com/1",
          publishedAt: "2026-03-01T12:00:00Z",
          sentiment: "bullish",
          impact: "exceptional", // 10
          score: 0.9,
        },
        {
          id: "2",
          title: "Rally 2",
          url: "https://example.com/2",
          publishedAt: "2026-03-01T13:00:00Z",
          sentiment: "bullish",
          impact: "high", // 7.5
          score: 0.8,
        },
        {
          id: "3",
          title: "Routine Update",
          url: "https://example.com/3",
          publishedAt: "2026-03-01T14:00:00Z",
          sentiment: "neutral",
          impact: "negligible", // 1.0
          score: 0,
        },
      ];

      const summary = newsTimelineService.buildTimelineSummary(items);

      expect(summary.overallSentiment).toBe("bullish");
      // (10 + 7.5 + 1.0) / 3 = 18.5 / 3 = 6.166... -> 6.2
      expect(summary.averageImpactScore).toBeCloseTo(6.2, 1);
    });
  });

  describe("Zod Schema Validation", () => {
    it("validates a valid SentimentNewsItem", () => {
      const validItem: SentimentNewsItem = {
        id: "item-123",
        title: "Bitcoin hits $100,000",
        source: "CoinDesk",
        publishedAt: "2026-03-01T12:00:00.000Z",
        url: "https://coindesk.com/btc-100k",
        sentiment: "bullish",
        impact: "exceptional",
        score: 0.95,
        btcPriceAtPub: 100000,
        btcPriceAfter1h: 101200,
        btcPriceAfter4h: 103500,
        btcPriceAfter24h: 105000,
      };

      const parsed = sentimentNewsItemSchema.safeParse(validItem);
      expect(parsed.success).toBe(true);
    });

    it("rejects invalid sentiment or impact literals", () => {
      const invalidItem = {
        id: "item-bad",
        title: "Test",
        publishedAt: "2026-03-01T12:00:00.000Z",
        url: "https://example.com",
        sentiment: "super-bullish", // Invalid enum
        impact: "extreme", // Invalid enum
        score: 0,
      };

      const parsed = sentimentNewsItemSchema.safeParse(invalidItem);
      expect(parsed.success).toBe(false);
    });

    it("validates a valid SentimentTimelineSummary", () => {
      const validSummary = {
        items: [
          {
            id: "i1",
            title: "Test Title",
            publishedAt: "2026-03-01T12:00:00.000Z",
            url: "https://example.com/1",
            sentiment: "bullish" as NewsSentiment,
            impact: "high" as NewsImpact,
            score: 0.7,
          },
        ],
        overallSentiment: "bullish" as NewsSentiment,
        averageImpactScore: 7.5,
      };

      const parsed = sentimentTimelineSummarySchema.safeParse(validSummary);
      expect(parsed.success).toBe(true);
    });
  });
});
