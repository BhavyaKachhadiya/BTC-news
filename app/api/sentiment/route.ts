import { NextResponse } from "next/server";
import { newsService } from "@/features/news";
import { coingeckoService } from "@/features/market";
import { newsTimelineService } from "@/features/news-sentiment";
import { logger } from "@/shared/logger/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [news, market] = await Promise.all([
      newsService.getRecentNews(30).catch((err: unknown) => {
        logger.warn("News feed fetch failed in sentiment route", "API", { error: String(err) });
        return [];
      }),
      coingeckoService.getCurrentMarketData().catch(() => ({ price: 96_000 })),
    ]);

    const newsSentiment = newsTimelineService.processNewsToTimeline(news, market.price);

    return NextResponse.json({
      success: true,
      data: {
        newsSentiment,
        news,
      },
    });
  } catch (error: unknown) {
    logger.error("GET /api/sentiment error", "API", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to fetch sentiment analysis" },
      { status: 502 },
    );
  }
}
