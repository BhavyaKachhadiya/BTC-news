import { logger } from "@/shared/logger/logger";
import { rssNewsService } from "./rss.service";
import { cryptoPanicService } from "./cryptopanic.service";
import type { NewsItem, NewsProvider } from "../types/news.types";

export class NewsAggregatorService implements NewsProvider {
  constructor(
    private readonly primaryProvider: NewsProvider = rssNewsService,
    private readonly secondaryProvider: NewsProvider = cryptoPanicService,
  ) {}

  public async getRecentNews(limit = 40): Promise<readonly NewsItem[]> {
    logger.debug("Aggregating recent Bitcoin news from providers", "NewsAggregatorService");

    const [primaryItems, secondaryItems] = await Promise.all([
      this.primaryProvider.getRecentNews().catch((err: unknown) => {
        logger.warn("Primary news provider failed", "NewsAggregatorService", { error: String(err) });
        return [] as NewsItem[];
      }),
      this.secondaryProvider.getRecentNews().catch((err: unknown) => {
        logger.warn("Secondary news provider failed", "NewsAggregatorService", { error: String(err) });
        return [] as NewsItem[];
      }),
    ]);

    const combined = [...primaryItems, ...secondaryItems];
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    const uniqueItems: NewsItem[] = [];

    for (const item of combined) {
      const normalizedTitle = item.title.toLowerCase().trim();
      if (!seenUrls.has(item.url) && !seenTitles.has(normalizedTitle)) {
        seenUrls.add(item.url);
        seenTitles.add(normalizedTitle);
        uniqueItems.push(item);
      }
    }

    // Sort newest first
    uniqueItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return uniqueItems.slice(0, limit);
  }
}

export const newsService = new NewsAggregatorService();
