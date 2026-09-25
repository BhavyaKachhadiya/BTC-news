import { NextRequest, NextResponse } from "next/server";
import { strategyStorageService } from "@/features/strategy-lab/services/strategy-storage.service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createStrategySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  description: z.string().max(200).optional(),
  preset: z.string(),
  parameters: z.object({
    rsiLongThreshold: z.number().min(10).max(90),
    rsiShortThreshold: z.number().min(10).max(90),
    emaFastPeriod: z.number().int().min(2).max(100),
    emaSlowPeriod: z.number().int().min(5).max(300),
    minConfidence: z.number().min(10).max(95),
    stopLossPercent: z.number().min(0.2).max(25),
    takeProfitPercent: z.number().min(0.5).max(50),
  }),
  features: z.record(z.boolean()).optional(),
});

export async function GET() {
  try {
    const strategies = await strategyStorageService.listStrategies();
    return NextResponse.json({
      success: true,
      data: strategies,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load strategies",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createStrategySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const created = await strategyStorageService.createStrategy({
      name: parsed.data.name,
      description: parsed.data.description,
      preset: parsed.data.preset as any,
      parameters: parsed.data.parameters,
      features: parsed.data.features as any,
    });

    return NextResponse.json(
      {
        success: true,
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save strategy",
      },
      { status: 500 }
    );
  }
}
