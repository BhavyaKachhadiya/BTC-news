import { NextResponse } from "next/server";
import { whaleService } from "@/features/whale-intelligence/services/whale.service";
import { logger } from "@/shared/logger/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const whale = await whaleService.getWhaleIntelligence();
    return NextResponse.json({ success: true, data: whale });
  } catch (error: unknown) {
    logger.error("GET /api/whale error", "API", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to fetch whale intelligence" },
      { status: 502 },
    );
  }
}
