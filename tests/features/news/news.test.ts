import { describe, it, expect } from "vitest";
import { newsItemSchema } from "@/features/news/schemas/news.schema";
import { NewsAggregatorService } from "@/features/news/services/news.service";
import { DEFAULT_FEEDS } from "@/features/news/services/rss.service";
import type { NewsItem, NewsProvider } from "@/features/news/types/news.types";

describe("News Feature", () => {
  it("validates valid NewsItem", () => {
    const item = {
      title: "Bitcoin hits new high",
      description: "BTC has surged past resistance",
      url: "https://example.com/news/1",
      publishedAt: new Date().toISOString(),
      source: "CoinDesk",
    };

    const parsed = newsItemSchema.safeParse(item);
    expect(parsed.success).toBe(true);
  });

  it("includes expanded top 11 crypto & Bitcoin media RSS feeds", () => {
    expect(DEFAULT_FEEDS.length).toBeGreaterThanOrEqual(11);
    const feedNames = DEFAULT_FEEDS.map((f) => f.name);

    expect(feedNames).toContain("Cointelegraph");
    expect(feedNames).toContain("CoinDesk");
    expect(feedNames).toContain("Decrypt");
    expect(feedNames).toContain("Bitcoin Magazine");
    expect(feedNames).toContain("The Daily Hodl");
    expect(feedNames).toContain("CryptoSlate");
    expect(feedNames).toContain("Bitcoinist");
    expect(feedNames).toContain("NewsBTC");
    expect(feedNames).toContain("BeInCrypto");
    expect(feedNames).toContain("U.Today");
    expect(feedNames).toContain("Google News");
  });

  it("deduplicates identical URLs and titles in NewsAggregatorService", async () => {
    const mockItem1: NewsItem = {
      title: "Bitcoin rally continues",
      url: "https://example.com/btc1",
      publishedAt: "2026-03-01T10:00:00.000Z",
      source: "SourceA",
    };
    const mockItem2: NewsItem = {
      title: "Bitcoin rally continues", // same title
      url: "https://example.com/btc2",
      publishedAt: "2026-03-01T11:00:00.000Z",
      source: "SourceB",
    };
    const mockItem3: NewsItem = {
      title: "Ethereum update",
      url: "https://example.com/eth",
      publishedAt: "2026-03-01T09:00:00.000Z",
      source: "SourceC",
    };

    const mockPrimary: NewsProvider = {
      getRecentNews: async () => [mockItem1],
    };
    const mockSecondary: NewsProvider = {
      getRecentNews: async () => [mockItem2, mockItem3],
    };

    const aggregator = new NewsAggregatorService(mockPrimary, mockSecondary);
    const aggregated = await aggregator.getRecentNews();

    expect(aggregated.length).toBe(2); // mockItem2 filtered out due to duplicate title
    expect(aggregated[0].title).toBe("Bitcoin rally continues");
    expect(aggregated[1].title).toBe("Ethereum update");
  });

  it("supports retaining up to 40 items by default", async () => {
    const mockItems: NewsItem[] = Array.from({ length: 50 }, (_, i) => ({
      title: `Bitcoin News Headline #${i + 1}`,
      url: `https://example.com/news/${i + 1}`,
      publishedAt: new Date(Date.now() - i * 60000).toISOString(),
      source: i % 2 === 0 ? "CoinDesk" : "Cointelegraph",
    }));

    const mockProvider: NewsProvider = {
      getRecentNews: async () => mockItems,
    };

    const aggregator = new NewsAggregatorService(mockProvider, {
      getRecentNews: async () => [],
    });

    const aggregated = await aggregator.getRecentNews();
    expect(aggregated.length).toBe(40);
  });
});
