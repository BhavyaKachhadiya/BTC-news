import { fetchWithTimeout } from "@/shared/http/fetcher";
import { logger } from "@/shared/logger/logger";
import { newsItemSchema } from "../schemas/news.schema";
import type { NewsItem, NewsProvider } from "../types/news.types";

export interface RSSFeedConfig {
  readonly name: string;
  readonly url: string;
}

export const DEFAULT_FEEDS: readonly RSSFeedConfig[] = [
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss" },
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { name: "Decrypt", url: "https://decrypt.co/feed" },
  { name: "Bitcoin Magazine", url: "https://bitcoinmagazine.com/feed" },
  { name: "The Daily Hodl", url: "https://dailyhodl.com/feed/" },
  { name: "CryptoSlate", url: "https://cryptoslate.com/feed/" },
  { name: "Bitcoinist", url: "https://bitcoinist.com/feed/" },
  { name: "NewsBTC", url: "https://www.newsbtc.com/feed/" },
  { name: "BeInCrypto", url: "https://beincrypto.com/feed/" },
  { name: "U.Today", url: "https://u.today/rss.php" },
  { name: "Google News", url: "https://news.google.com/rss/search?q=Bitcoin+when:24h&hl=en-US&gl=US&ceid=US:en" },
];

function cleanXmlText(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRssXml(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  // Match both RSS <item> and Atom <entry>
  const itemMatches = [
    ...xml.matchAll(/<item[\s>](.*?)<\/item>/gis),
    ...xml.matchAll(/<entry[\s>](.*?)<\/entry>/gis),
  ];

  for (const match of itemMatches) {
    const itemContent = match[1];

    const titleMatch = itemContent.match(/<title[^>]*>(.*?)<\/title>/is);
    let rawLink = "";
    const linkTagMatch = itemContent.match(/<link[^>]*>(.*?)<\/link>/is);
    if (linkTagMatch && linkTagMatch[1].trim()) {
      rawLink = cleanXmlText(linkTagMatch[1]);
    } else {
      const hrefMatch = itemContent.match(/<link[^>]*href=["']([^"']+)["']/is);
      if (hrefMatch) {
        rawLink = hrefMatch[1].trim();
      }
    }

    if (!titleMatch || !rawLink) continue;

    const title = cleanXmlText(titleMatch[1]);
    const url = rawLink.split("?")[0]; // remove query tracking
    if (!title || !url) continue;

    const descMatch =
      itemContent.match(/<description[^>]*>(.*?)<\/description>/is) ||
      itemContent.match(/<summary[^>]*>(.*?)<\/summary>/is);
    const description = descMatch ? cleanXmlText(descMatch[1]).slice(0, 300) : undefined;

    const pubDateMatch =
      itemContent.match(/<pubDate[^>]*>(.*?)<\/pubDate>/is) ||
      itemContent.match(/<dc:date[^>]*>(.*?)<\/dc:date>/is) ||
      itemContent.match(/<updated[^>]*>(.*?)<\/updated>/is) ||
      itemContent.match(/<published[^>]*>(.*?)<\/published>/is);

    let publishedAt = new Date().toISOString();
    if (pubDateMatch) {
      const parsedDate = new Date(pubDateMatch[1]);
      if (!Number.isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate.toISOString();
      }
    }

    const candidate = {
      title,
      description,
      url,
      publishedAt,
      source: sourceName,
    };

    const valid = newsItemSchema.safeParse(candidate);
    if (valid.success) {
      items.push(valid.data);
    }
  }

  return items;
}

export class RssNewsService implements NewsProvider {
  private readonly feeds: readonly RSSFeedConfig[];

  constructor(feeds = DEFAULT_FEEDS) {
    this.feeds = feeds;
  }

  public async getRecentNews(): Promise<readonly NewsItem[]> {
    logger.debug("Fetching Bitcoin news from expanded RSS feeds", "RssNewsService", {
      feedCount: this.feeds.length,
    });

    const feedPromises = this.feeds.map(async (feed) => {
      try {
        const response = await fetchWithTimeout(feed.url, {
          timeoutMs: 6000,
          providerName: `RSS-${feed.name}`,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; BTC-Signal-Engine/1.0)",
          },
        });
        const xml = await response.text();
        return parseRssXml(xml, feed.name);
      } catch (err: unknown) {
        logger.warn(`Failed to fetch RSS feed ${feed.name}`, "RssNewsService", {
          error: String(err),
        });
        return [] as NewsItem[];
      }
    });

    const results = await Promise.all(feedPromises);
    return results.flat();
  }
}

export const rssNewsService = new RssNewsService();
