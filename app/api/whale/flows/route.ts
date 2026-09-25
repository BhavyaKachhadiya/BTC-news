import { NextResponse } from "next/server";
import { exchangeFlowService } from "@/features/whale-intelligence/services/exchange-flow.service";
import { coingeckoService } from "@/features/market/services/coingecko.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let btcPrice = 96_000;
    try {
      const market = await coingeckoService.getCurrentMarketData();
      btcPrice = market.price;
    } catch {
      // Use default price fallback if market API is rate limited
    }

    const flows = exchangeFlowService.getExchangeFlows(btcPrice);
    return NextResponse.json({
      success: true,
      data: flows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load exchange flows",
      },
      { status: 500 }
    );
  }
}
