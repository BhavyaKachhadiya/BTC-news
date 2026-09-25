import { NextResponse } from "next/server";
import { alignmentService } from "@/features/multi-timeframe";
import { logger } from "@/shared/logger/logger";

export async function GET() {
  try {
    const alignment = await alignmentService.getAlignment("BTCUSDT");
    return NextResponse.json({ success: true, data: alignment });
  } catch (error: unknown) {
    logger.error("GET /api/timeframes error", "API", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to fetch multi-timeframe alignment" },
      { status: 502 },
    );
  }
}
