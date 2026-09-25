import { prisma } from "@/shared/database/prisma";
import { logger } from "@/shared/logger/logger";
import { newsSentimentService } from "./sentiment.service";
import type { NewsItem } from "@/features/news";
import type { HistoricalDataPoint } from "@/features/market";
import type {
  NewsSentiment,
  NewsImpact,
  SentimentNewsItem,
  SentimentTimelineSummary,
  NewsPriceCorrelation,
} from "../types/sentiment.types";

const IMPACT_NUMERIC_WEIGHTS: Record<NewsImpact, number> = {
  exceptional: 10.0,
  high: 7.5,
  moderate: 5.0,
  low: 2.5,
  negligible: 1.0,
};

export class NewsTimelineService {
  /**
   * Correlates news items with Bitcoin market price at publication and checks
   * for 1h, 4h, and 24h outcomes once elapsed.
   */
  public correlateNewsWithPrices(
    items: readonly SentimentNewsItem[],
    currentPrice: number,
    historicalChart?: readonly HistoricalDataPoint[],
    currentTimeMs: number = Date.now(),
  ): SentimentNewsItem[] {
    return items.map((item) => {
      const pubTime = new Date(item.publishedAt).getTime();
      const elapsedMs = currentTimeMs - pubTime;

      // 1. Determine Price at Publication
      let btcPriceAtPub = item.btcPriceAtPub;
      if (btcPriceAtPub === undefined) {
        if (historicalChart && historicalChart.length > 0) {
          const closest = this.findClosestPrice(historicalChart, pubTime);
          btcPriceAtPub = closest ?? currentPrice;
        } else {
          btcPriceAtPub = currentPrice;
        }
      }

      // 2. Determine 1h Price Outcome (3,600,000 ms)
      let btcPriceAfter1h = item.btcPriceAfter1h;
      if (btcPriceAfter1h === undefined || btcPriceAfter1h === null) {
        if (elapsedMs >= 60 * 60 * 1000) {
          if (historicalChart && historicalChart.length > 0) {
            btcPriceAfter1h = this.findClosestPrice(historicalChart, pubTime + 60 * 60 * 1000) ?? currentPrice;
          } else {
            btcPriceAfter1h = currentPrice;
          }
        }
      }

      // 3. Determine 4h Price Outcome (14,400,000 ms)
      let btcPriceAfter4h = item.btcPriceAfter4h;
      if (btcPriceAfter4h === undefined || btcPriceAfter4h === null) {
        if (elapsedMs >= 4 * 60 * 60 * 1000) {
          if (historicalChart && historicalChart.length > 0) {
            btcPriceAfter4h = this.findClosestPrice(historicalChart, pubTime + 4 * 60 * 60 * 1000) ?? currentPrice;
          } else {
            btcPriceAfter4h = currentPrice;
          }
        }
      }

      // 4. Determine 24h Price Outcome (86,400,000 ms)
      let btcPriceAfter24h = item.btcPriceAfter24h;
      if (btcPriceAfter24h === undefined || btcPriceAfter24h === null) {
        if (elapsedMs >= 24 * 60 * 60 * 1000) {
          if (historicalChart && historicalChart.length > 0) {
            btcPriceAfter24h = this.findClosestPrice(historicalChart, pubTime + 24 * 60 * 60 * 1000) ?? currentPrice;
          } else {
            btcPriceAfter24h = currentPrice;
          }
        }
      }

      return {
        ...item,
        btcPriceAtPub: btcPriceAtPub ? Number(btcPriceAtPub.toFixed(2)) : undefined,
        btcPriceAfter1h: btcPriceAfter1h ? Number(btcPriceAfter1h.toFixed(2)) : undefined,
        btcPriceAfter4h: btcPriceAfter4h ? Number(btcPriceAfter4h.toFixed(2)) : undefined,
        btcPriceAfter24h: btcPriceAfter24h ? Number(btcPriceAfter24h.toFixed(2)) : undefined,
      };
    });
  }

  /**
   * Helper to find the price point closest in time to target timestamp.
   */
  public findClosestPrice(chart: readonly HistoricalDataPoint[], targetTimeMs: number): number | undefined {
    if (!chart || chart.length === 0) return undefined;

    let closest = chart[0];
    let minDiff = Math.abs(closest.timestamp - targetTimeMs);

    for (let i = 1; i < chart.length; i++) {
      const diff = Math.abs(chart[i].timestamp - targetTimeMs);
      if (diff < minDiff) {
        minDiff = diff;
        closest = chart[i];
      }
    }

    return closest.price;
  }

  /**
   * Calculates performance outcome metrics for a sentiment item.
   */
  public calculateOutcomeMetrics(item: SentimentNewsItem): NewsPriceCorrelation {
    const pub = item.btcPriceAtPub;
    const p1 = item.btcPriceAfter1h;
    const p4 = item.btcPriceAfter4h;
    const p24 = item.btcPriceAfter24h;

    return {
      btcPriceAtPub: pub,
      btcPriceAfter1h: p1,
      btcPriceAfter4h: p4,
      btcPriceAfter24h: p24,
      pnlPercent1h: pub && p1 ? Number((((p1 - pub) / pub) * 100).toFixed(2)) : undefined,
      pnlPercent4h: pub && p4 ? Number((((p4 - pub) / pub) * 100).toFixed(2)) : undefined,
      pnlPercent24h: pub && p24 ? Number((((p24 - pub) / pub) * 100).toFixed(2)) : undefined,
      isResolved1h: p1 != null,
      isResolved4h: p4 != null,
      isResolved24h: p24 != null,
    };
  }

  /**
   * Builds an overall timeline summary from sentiment news items,
   * sorted reverse-chronologically (latest news first).
   */
  public buildTimelineSummary(items: readonly SentimentNewsItem[]): SentimentTimelineSummary {
    if (!items || items.length === 0) {
      return {
        items: [],
        overallSentiment: "neutral",
        averageImpactScore: 0,
      };
    }

    // Sort items reverse-chronologically
    const sorted = [...items].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    let bullishCount = 0;
    let bearishCount = 0;
    let mixedCount = 0;
    let neutralCount = 0;
    let totalImpact = 0;
    let totalScore = 0;

    for (const item of sorted) {
      if (item.sentiment === "bullish") bullishCount++;
      else if (item.sentiment === "bearish") bearishCount++;
      else if (item.sentiment === "mixed") mixedCount++;
      else neutralCount++;

      totalImpact += IMPACT_NUMERIC_WEIGHTS[item.impact] ?? 1.0;
      totalScore += item.score;
    }

    const averageImpactScore = Number((totalImpact / sorted.length).toFixed(1));

    // Determine overall sentiment direction
    let overallSentiment: NewsSentiment = "neutral";
    const directionalDominance = bullishCount - bearishCount;

    if (mixedCount > bullishCount + bearishCount) {
      overallSentiment = "mixed";
    } else if (bullishCount >= 2 && bearishCount >= 2 && Math.abs(bullishCount - bearishCount) <= 1) {
      overallSentiment = "mixed";
    } else if (directionalDominance >= 2 || (directionalDominance > 0 && totalScore > 0.5)) {
      overallSentiment = "bullish";
    } else if (directionalDominance <= -2 || (directionalDominance < 0 && totalScore < -0.5)) {
      overallSentiment = "bearish";
    } else if (bullishCount > bearishCount) {
      overallSentiment = "bullish";
    } else if (bearishCount > bullishCount) {
      overallSentiment = "bearish";
    } else {
      overallSentiment = "neutral";
    }

    return {
      items: sorted,
      overallSentiment,
      averageImpactScore,
    };
  }

  /**
   * Processes raw NewsItem objects into correlated SentimentNewsItems and builds summary.
   */
  public processNewsToTimeline(
    news: readonly NewsItem[],
    currentBtcPrice: number,
    historicalChart?: readonly HistoricalDataPoint[],
  ): SentimentTimelineSummary {
    const sentimentItems = newsSentimentService.classifyNewsBatch(news);
    const correlatedItems = this.correlateNewsWithPrices(sentimentItems, currentBtcPrice, historicalChart);
    return this.buildTimelineSummary(correlatedItems);
  }

  /**
   * Persists news sentiment items to MongoDB NewsSentiment collection.
   */
  public async persistToDatabase(items: readonly SentimentNewsItem[]): Promise<number> {
    try {
      let saved = 0;
      for (const item of items) {
        // Upsert by URL if possible or create
        const existing = await prisma.newsSentiment.findFirst({
          where: { url: item.url },
        });

        if (!existing) {
          await prisma.newsSentiment.create({
            data: {
              timestamp: new Date(item.publishedAt),
              headline: item.title,
              source: item.source ?? null,
              url: item.url,
              sentiment: item.sentiment,
              impact: item.impact,
              btcPriceAtPub: item.btcPriceAtPub ?? 0,
              btcPriceAfter1h: item.btcPriceAfter1h ?? null,
              btcPriceAfter4h: item.btcPriceAfter4h ?? null,
              btcPriceAfter24h: item.btcPriceAfter24h ?? null,
            },
          });
          saved++;
        }
      }
      return saved;
    } catch (err: unknown) {
      logger.warn("Could not persist news sentiments to database (DB offline)", "NewsTimelineService", {
        error: String(err),
      });
      return 0;
    }
  }

  /**
   * Loads historical sentiment items from MongoDB.
   */
  public async loadFromDatabase(limit = 30): Promise<SentimentNewsItem[]> {
    try {
      const records = await prisma.newsSentiment.findMany({
        orderBy: { timestamp: "desc" },
        take: limit,
      });

      return records.map((r) => ({
        id: r.id,
        title: r.headline,
        source: r.source ?? undefined,
        publishedAt: r.timestamp.toISOString(),
        url: r.url,
        sentiment: r.sentiment as NewsSentiment,
        impact: r.impact as NewsImpact,
        score: r.sentiment === "bullish" ? 0.7 : r.sentiment === "bearish" ? -0.7 : 0,
        btcPriceAtPub: r.btcPriceAtPub,
        btcPriceAfter1h: r.btcPriceAfter1h ?? undefined,
        btcPriceAfter4h: r.btcPriceAfter4h ?? undefined,
        btcPriceAfter24h: r.btcPriceAfter24h ?? undefined,
      }));
    } catch (err: unknown) {
      logger.warn("Could not load news sentiments from DB (returning empty)", "NewsTimelineService", {
        error: String(err),
      });
      return [];
    }
  }

  /**
   * Evaluates and updates pending price outcomes (1h, 4h, 24h) in MongoDB.
   */
  public async evaluatePendingOutcomes(currentPrice: number): Promise<number> {
    try {
      const pending = await prisma.newsSentiment.findMany({
        where: { btcPriceAfter24h: null },
      });

      let updatedCount = 0;
      const now = Date.now();

      for (const record of pending) {
        const pubTime = new Date(record.timestamp).getTime();
        const elapsedHours = (now - pubTime) / (1000 * 60 * 60);

        let modified = false;
        const updates: {
          btcPriceAfter1h?: number;
          btcPriceAfter4h?: number;
          btcPriceAfter24h?: number;
        } = {};

        if (elapsedHours >= 1 && record.btcPriceAfter1h == null) {
          updates.btcPriceAfter1h = currentPrice;
          modified = true;
        }

        if (elapsedHours >= 4 && record.btcPriceAfter4h == null) {
          updates.btcPriceAfter4h = currentPrice;
          modified = true;
        }

        if (elapsedHours >= 24 && record.btcPriceAfter24h == null) {
          updates.btcPriceAfter24h = currentPrice;
          modified = true;
        }

        if (modified) {
          await prisma.newsSentiment.update({
            where: { id: record.id },
            data: updates,
          });
          updatedCount++;
        }
      }

      return updatedCount;
    } catch (err: unknown) {
      logger.warn("Pending news outcomes evaluation skipped (DB offline)", "NewsTimelineService", {
        error: String(err),
      });
      return 0;
    }
  }
}

export const newsTimelineService = new NewsTimelineService();
