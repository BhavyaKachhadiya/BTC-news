import { NextResponse } from "next/server";
import { coingeckoService } from "@/features/market";
import { logger } from "@/shared/logger/logger";

export async function GET() {
  try {
    const market = await coingeckoService.getCurrentMarketData();
    const chart = await coingeckoService.getHistoricalChart({ days: 14, interval: "daily" });
    return NextResponse.json({ success: true, data: { current: market, chart } });
  } catch (error: unknown) {
    logger.error("GET /api/market error", "API", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to fetch market data" },
      { status: 502 },
    );
  }
}
