import { NextResponse } from "next/server";
import { derivativesService } from "@/features/derivatives";
import { macroService } from "@/features/macro/services/macro.service";
import { logger } from "@/shared/logger/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [derivatives, macro] = await Promise.all([
      derivativesService.getDerivativesSnapshot().catch((err: unknown) => {
        logger.warn("Derivatives snapshot fetch failed", "API", { error: String(err) });
        return undefined;
      }),
      macroService.getMacroSnapshot().catch((err: unknown) => {
        logger.warn("Macro snapshot fetch failed", "API", { error: String(err) });
        return undefined;
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        derivatives,
        macro,
      },
    });
  } catch (error: unknown) {
    logger.error("GET /api/derivatives-macro error", "API", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to fetch derivatives & macro telemetry" },
      { status: 502 },
    );
  }
}
