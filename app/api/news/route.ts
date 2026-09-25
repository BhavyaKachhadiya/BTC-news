import { NextResponse } from "next/server";
import { newsService } from "@/features/news";
import { logger } from "@/shared/logger/logger";

export async function GET() {
  try {
    const news = await newsService.getRecentNews(40);
    return NextResponse.json({ success: true, data: news });
  } catch (error: unknown) {
    logger.error("GET /api/news error", "API", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to fetch news feed" },
      { status: 502 },
    );
  }
}
