import { NextResponse } from "next/server";
import { historyService } from "@/features/history";
import { orchestratorService } from "@/features/analysis/services/orchestrator.service";
import { logger } from "@/shared/logger/logger";

export async function GET() {
  try {
    const historical = await historyService.getHistoricalSignals({ limit: 1 });
    if (historical.length > 0) {
      return NextResponse.json({ success: true, data: historical[0] });
    }

    // If no stored decision exists yet, evaluate on demand
    const fresh = await orchestratorService.runPipeline();
    return NextResponse.json({ success: true, data: fresh.signal });
  } catch (error: unknown) {
    logger.error("GET /api/signals error", "API", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to retrieve signal" },
      { status: 500 },
    );
  }
}
