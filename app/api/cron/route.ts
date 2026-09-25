import { NextResponse } from "next/server";
import { orchestratorService } from "@/features/analysis/services/orchestrator.service";
import { logger } from "@/shared/logger/logger";

export async function GET() {
  logger.info("Cron trigger invoked for BTC Signal Engine", "CronRoute");
  try {
    const result = await orchestratorService.runPipeline();
    return NextResponse.json({
      success: true,
      message: "Analysis pipeline executed via cron",
      action: result.signal.action,
      confidence: result.signal.confidence,
      timestamp: result.timestamp,
    });
  } catch (error: unknown) {
    logger.error("Cron analysis execution failed", "CronRoute", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Cron execution failed" },
      { status: 500 },
    );
  }
}
