import { NextResponse } from "next/server";
import { mempoolService, detectNetworkAnomaly } from "@/features/network";
import { logger } from "@/shared/logger/logger";

export async function GET() {
  try {
    const network = await mempoolService.getCurrentNetworkData();
    const anomaly = detectNetworkAnomaly(network, null);
    return NextResponse.json({ success: true, data: { network, anomaly } });
  } catch (error: unknown) {
    logger.error("GET /api/network error", "API", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to fetch network data" },
      { status: 502 },
    );
  }
}
