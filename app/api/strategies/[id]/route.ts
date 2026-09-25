import { NextRequest, NextResponse } from "next/server";
import { strategyStorageService } from "@/features/strategy-lab/services/strategy-storage.service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const strategy = await strategyStorageService.getStrategyById(id);
    if (!strategy) {
      return NextResponse.json(
        { success: false, error: "Strategy not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: strategy });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve strategy",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await strategyStorageService.deleteStrategy(id);
    return NextResponse.json({ success: true, data: { deleted: true, id } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete strategy",
      },
      { status: 500 }
    );
  }
}
