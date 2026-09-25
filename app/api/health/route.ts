import { NextResponse } from "next/server";
import { healthMonitoringService } from "@/features/monitoring/services/health.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await healthMonitoringService.checkSystemHealth();
    return NextResponse.json(
      {
        success: true,
        data: health,
      },
      {
        status: health.overallStatus === "down" ? 503 : 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal health check failure",
      },
      { status: 500 }
    );
  }
}
