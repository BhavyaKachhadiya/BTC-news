import { NextResponse } from "next/server";
import { marketStructureService } from "@/features/market-structure/market-structure.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = marketStructureService.analyze();
  return NextResponse.json({
    success: true,
    data,
  });
}
