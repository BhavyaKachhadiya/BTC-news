import { NextResponse } from "next/server";
import { orchestratorService } from "@/features/analysis/services/orchestrator.service";
import { paperTradingService } from "@/features/paper-trading";
import { webAlertEngine } from "@/features/alerts/services/alert-engine.service";
import { logger } from "@/shared/logger/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || searchParams.get("tab") || "overview";

    if (scope === "full") {
      const analysis = await orchestratorService.runPipeline();
      webAlertEngine.evaluatePipeline(analysis);
      const portfolio = await paperTradingService.getPortfolioSummary(analysis.market.price);
      return NextResponse.json({ success: true, data: { analysis, portfolio, news: [] } });
    }

    const data = await orchestratorService.runOverviewPipeline();
    webAlertEngine.evaluatePipeline(data.analysis);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    logger.error("GET /api/analysis error", "API", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to run current analysis" },
      { status: 500 },
    );
  }
}
