import { NextResponse } from "next/server";
import { orchestratorService } from "@/features/analysis/services/orchestrator.service";
import { logger } from "@/shared/logger/logger";

export async function POST() {
  try {
    const result = await orchestratorService.runPipeline();
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error("POST /api/analyze execution error", "API", { error: String(error) });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Pipeline execution failed" },
      { status: 500 },
    );
  }
}
