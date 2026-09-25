import { NextRequest, NextResponse } from "next/server";
import { historyService } from "@/features/history";
import { logger } from "@/shared/logger/logger";
import type { SignalAction } from "@/features/signal/types/signal.types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") as SignalAction | undefined;
    const minConfidenceStr = searchParams.get("minConfidence");
    const minConfidence = minConfidenceStr ? Number(minConfidenceStr) : undefined;
    const fromDate = searchParams.get("fromDate") ?? undefined;
    const toDate = searchParams.get("toDate") ?? undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;

    const history = await historyService.getHistoricalSignals({
      action: action && ["LONG", "SHORT", "WAIT"].includes(action) ? action : undefined,
      minConfidence,
      fromDate,
      toDate,
      limit,
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error: unknown) {
    logger.error("GET /api/signals/history error", "API", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to fetch historical signals" },
      { status: 500 },
    );
  }
}
