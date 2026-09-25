import { env } from "@/config/env";
import { fetchJson } from "@/shared/http/fetcher";
import { logger } from "@/shared/logger/logger";
import { cryptoPanicResponseSchema, newsItemSchema } from "../schemas/news.schema";
import type { NewsItem, NewsProvider } from "../types/news.types";

export class CryptoPanicService implements NewsProvider {
  private readonly apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.NEWS_API_KEY;
  }

  public async getRecentNews(): Promise<readonly NewsItem[]> {
    if (!this.apiKey) {
      return [];
    }

    const url = `https://cryptopanic.com/api/free/v1/posts/?auth_token=${this.apiKey}&currencies=BTC&filter=important`;
    try {
      const rawData = await fetchJson(url, { timeoutMs: 8000, providerName: "CryptoPanic" });
      const parsed = cryptoPanicResponseSchema.safeParse(rawData);
      if (!parsed.success) {
        return [];
      }

      const items: NewsItem[] = [];
      for (const post of parsed.data.results) {
        let publishedAt = new Date().toISOString();
        const dateObj = new Date(post.published_at);
        if (!Number.isNaN(dateObj.getTime())) {
          publishedAt = dateObj.toISOString();
        }

        const candidate = {
          title: post.title,
          url: post.url,
          publishedAt,
          source: post.source?.title ?? "CryptoPanic",
        };

        const validated = newsItemSchema.safeParse(candidate);
        if (validated.success) {
          items.push(validated.data);
        }
      }

      return items;
    } catch (err: unknown) {
      logger.warn("CryptoPanic fetch failed", "CryptoPanicService", { error: String(err) });
      return [];
    }
  }
}

export const cryptoPanicService = new CryptoPanicService();
