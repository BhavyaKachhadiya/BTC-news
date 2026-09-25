import { prisma } from "@/shared/database/prisma";
import { coingeckoService } from "@/features/market";
import { technicalAnalysisService } from "@/features/technical-analysis";
import { signalService } from "@/features/signal";
import { formatCurrency, formatPercent } from "@/shared/utils/formatters";
import type { SignalContext } from "@/features/signal/types/signal.types";

async function seed() {
  console.log("==================================================");
  console.log("   Seeding Historical Signals & Evaluated Outcomes");
  console.log("==================================================");

  try {
    // 1. Fetch real hourly price series for the past 7 days
    console.log("Fetching 7 days of hourly historical price data from CoinGecko...");
    const chart = await coingeckoService.getHistoricalChart({ days: 7, interval: "hourly" });

    if (chart.length < 50) {
      console.log("Insufficient historical hourly data, attempting daily data...");
      return;
    }

    console.log(`Received ${chart.length} hourly data points.`);

    // Pick 3 test points from the past:
    // 1. Point ~30 hours ago (has 1h, 4h, and 24h outcomes)
    // 2. Point ~8 hours ago (has 1h and 4h outcomes, 24h pending)
    // 3. Point ~2 hours ago (has 1h outcome, 4h & 24h pending)
    const pointsToSeed = [
      { offsetFromEnd: 30, desc: "Signal from ~30h ago (All 1h, 4h, 24h outcomes resolved)" },
      { offsetFromEnd: 8, desc: "Signal from ~8h ago (1h and 4h resolved, 24h pending)" },
      { offsetFromEnd: 2, desc: "Signal from ~2h ago (1h resolved, 4h & 24h pending)" },
    ];

    for (const item of pointsToSeed) {
      const targetIndex = chart.length - 1 - item.offsetFromEnd;
      if (targetIndex < 25) continue;

      const historicalSlice = chart.slice(0, targetIndex + 1);
      const pricesSoFar = historicalSlice.map((p) => p.price);
      const decisionPoint = chart[targetIndex];
      const entryPrice = decisionPoint.price;
      const decisionDate = new Date(decisionPoint.timestamp);

      // Compute deterministic technical state up to this point
      const technicals = technicalAnalysisService.analyze({ prices: pricesSoFar });

      // Build simulated context with realistic regime based on EMA alignment
      const isGolden = technicals.ema20 > technicals.ema50 && entryPrice > technicals.ema20;
      const isDeath = technicals.ema20 < technicals.ema50 && entryPrice < technicals.ema20;
      const regime = isGolden ? "bullish" : isDeath ? "bearish" : "ranging";

      const mockContext: SignalContext = {
        market: {
          price: entryPrice,
          change24h: 1.8,
          volume24h: 35000000000,
          marketCap: entryPrice * 19700000,
          timestamp: decisionDate.toISOString(),
          provider: "coingecko",
        },
        technicals,
        network: {
          blockHeight: 850000,
          txCount: 65000,
          mempoolSize: 30000000,
          fastestFee: 18,
          halfHourFee: 14,
          hourFee: 12,
          timestamp: decisionDate.toISOString(),
          provider: "mempool.space",
        },
        anomaly: {
          isAnomaly: false,
          reasons: [],
          feeSurgeLevel: "NORMAL",
        },
        news: [],
        jev: {
          marketRegime: regime,
          regimeConfidence: 0.82,
          newsDirection: isGolden ? "bullish" : isDeath ? "bearish" : "neutral",
          newsImpactScore: 6.5,
          setupQualityScore: 7.5,
          networkAnomalyScore: 0.1,
          isNetworkAnomaly: false,
          summary: `Historical context classified as ${regime.toUpperCase()}`,
          isDegraded: false,
          timestamp: decisionDate.toISOString(),
        },
      };

      const signal = signalService.generateSignal(mockContext);

      // Look up real future prices from subsequent hourly points
      const point1h = chart[targetIndex + 1];
      const point4h = chart[targetIndex + 4];
      const point24h = chart[targetIndex + 24];

      const priceAfter1h = point1h?.price ?? null;
      const priceAfter4h = point4h?.price ?? null;
      const priceAfter24h = point24h?.price ?? null;

      const sideMult = signal.action === "SHORT" ? -1 : 1;
      const pnlPercent1h = priceAfter1h
        ? Number((((priceAfter1h - entryPrice) / entryPrice) * 100 * sideMult).toFixed(2))
        : null;
      const pnlPercent4h = priceAfter4h
        ? Number((((priceAfter4h - entryPrice) / entryPrice) * 100 * sideMult).toFixed(2))
        : null;
      const pnlPercent24h = priceAfter24h
        ? Number((((priceAfter24h - entryPrice) / entryPrice) * 100 * sideMult).toFixed(2))
        : null;

      const isCompleted = priceAfter24h != null;

      // Persist Decision
      const decision = await prisma.signalDecision.create({
        data: {
          timestamp: decisionDate,
          action: signal.action,
          confidence: signal.confidence,
          reasons: [...signal.reasons],
          btcPrice: entryPrice,
          rsi14: technicals.rsi14,
          ema20: technicals.ema20,
          ema50: technicals.ema50,
          atr14: technicals.atr14,
          volatility: technicals.volatility,
          marketRegime: regime,
          newsDirection: mockContext.jev.newsDirection,
          newsImpactScore: mockContext.jev.newsImpactScore,
          setupQualityScore: mockContext.jev.setupQualityScore,
          isNetworkAnomaly: false,
        },
      });

      // Persist Outcome with real observed future prices
      await prisma.signalOutcome.create({
        data: {
          signalDecisionId: decision.id,
          entryPrice,
          priceAfter1h,
          pnlPercent1h,
          priceAfter4h,
          pnlPercent4h,
          priceAfter24h,
          pnlPercent24h,
          isCompleted,
        },
      });

      console.log(`\n✔ Seeded: ${item.desc}`);
      console.log(`  • Timestamp:    ${decisionDate.toLocaleString()}`);
      console.log(`  • Signal:       [ ${signal.action} ] (Confidence: ${signal.confidence}%)`);
      console.log(`  • Entry Price:  ${formatCurrency(entryPrice)}`);
      console.log(
        `  • 1h Outcome:   ${priceAfter1h ? `${formatCurrency(priceAfter1h)} (${formatPercent(pnlPercent1h ?? 0)})` : "Pending"}`,
      );
      console.log(
        `  • 4h Outcome:   ${priceAfter4h ? `${formatCurrency(priceAfter4h)} (${formatPercent(pnlPercent4h ?? 0)})` : "Pending"}`,
      );
      console.log(
        `  • 24h Outcome:  ${priceAfter24h ? `${formatCurrency(priceAfter24h)} (${formatPercent(pnlPercent24h ?? 0)})` : "Pending"}`,
      );
    }

    // Seed simulated paper trade to display portfolio metrics
    const existingTrades = await prisma.paperTrade.count();
    if (existingTrades === 0) {
      await prisma.paperTrade.create({
        data: {
          side: "LONG",
          entryPrice: 83500,
          exitPrice: 85200,
          amountBtc: 0.023952,
          allocatedUsd: 2000,
          realizedPnl: 40.72,
          pnlPercent: 2.04,
          holdingPeriodMinutes: 180,
          status: "CLOSED",
          exitReason: "TAKE_PROFIT",
          openedAt: new Date(Date.now() - 24 * 3600 * 1000),
          closedAt: new Date(Date.now() - 21 * 3600 * 1000),
        },
      });
      console.log("\n✔ Seeded sample closed paper trade ($40.72 realized PnL).");
    }

    console.log("\n==================================================");
    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (err: unknown) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
