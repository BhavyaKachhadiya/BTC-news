import { orchestratorService } from "@/features/analysis/services/orchestrator.service";
import { formatCurrency, formatPercent } from "@/shared/utils/formatters";

async function main() {
  console.log("==================================================");
  console.log("   BTC Signal Engine - Intelligence Pipeline     ");
  console.log("==================================================");

  try {
    const result = await orchestratorService.runPipeline();

    console.log("\n📊 MARKET SNAPSHOT:");
    console.log(`• BTC Price:       ${formatCurrency(result.market.price)}`);
    console.log(`• 24h Change:      ${formatPercent(result.market.change24h)}`);
    console.log(`• 24h Volume:      ${formatCurrency(result.market.volume24h, 0)}`);
    console.log(`• Market Cap:      ${formatCurrency(result.market.marketCap, 0)}`);

    console.log("\n📈 TECHNICAL INDICATORS:");
    console.log(`• RSI(14):         ${result.technicals.rsi14}`);
    console.log(`• EMA(20):         ${formatCurrency(result.technicals.ema20)}`);
    console.log(`• EMA(50):         ${formatCurrency(result.technicals.ema50)}`);
    console.log(`• ATR(14):         ${formatCurrency(result.technicals.atr14)}`);
    console.log(`• Volatility:      ${result.technicals.volatility}%`);

    console.log("\n🤖 JEV INTERPRETATION (TypeSafe AI):");
    console.log(`• Market Regime:   ${result.jev.marketRegime.toUpperCase()} (${(result.jev.regimeConfidence * 100).toFixed(0)}% confidence)`);
    console.log(`• News Direction:  ${result.jev.newsDirection.toUpperCase()}`);
    console.log(`• Setup Quality:   ${result.jev.setupQualityScore}/10`);
    console.log(`• Network Anomaly: ${result.jev.isNetworkAnomaly ? "YES" : "NO"}`);
    if (result.jev.isDegraded) {
      console.log(`• [NOTICE]:        ${result.jev.summary}`);
    }

    if (result.multiTimeframe) {
      console.log("\n⏱️ MULTI-TIMEFRAME ALIGNMENT:");
      console.log(`• Overall Trend:   ${result.multiTimeframe.overallTrend.toUpperCase()}`);
      console.log(`• Alignment Status:${result.multiTimeframe.alignmentStatus.toUpperCase()} (${result.multiTimeframe.alignedCount}/5 aligned)`);
      for (const tf of result.multiTimeframe.timeframes) {
        console.log(`   - [${tf.timeframe}]: ${tf.trend.toUpperCase()} (RSI: ${tf.rsi}, EMA20: ${formatCurrency(tf.ema20)}, Price: ${formatCurrency(tf.price)})`);
      }
    }

    if (result.whale) {
      console.log("\n🐋 WHALE & ON-CHAIN INTELLIGENCE (Hyperbot & Mempool):");
      console.log(`• Whale Bull Ratio:${(result.whale.whaleBullRatio * 100).toFixed(1)}%`);
      console.log(`• Top Whales Long: ${formatCurrency(result.whale.totalWhaleLongUsd, 0)}`);
      console.log(`• Top Whales Short:${formatCurrency(result.whale.totalWhaleShortUsd, 0)}`);
      console.log(`• Active Traders:  ${result.whale.topTraders.length} Hyperliquid whales monitored`);
      console.log(`• Large Mempool Tx:${result.whale.largeTransactions.length} transfers > 10 BTC`);
    }

    if (result.derivatives) {
      console.log("\n📈 DERIVATIVES INTELLIGENCE:");
      console.log(`• Funding Rate:    ${(result.derivatives.fundingRate * 100).toFixed(4)}%`);
      console.log(`• Open Interest:   ${result.derivatives.openInterest.toLocaleString()} BTC`);
      console.log(`• Long/Short Ratio:${result.derivatives.longShortRatio.toFixed(2)}`);
      console.log(`• Funding Spike:   ${result.derivatives.eventFlags.isFundingSpike ? "YES ⚠️" : "NO"}`);
    }

    if (result.macro) {
      console.log("\n🌐 MACROECONOMIC INTELLIGENCE:");
      console.log(`• Freshness:       ${result.macro.freshness}`);
      if (result.macro.dxy) console.log(`• DXY:             ${result.macro.dxy.value} (${result.macro.dxy.changePercent > 0 ? "+" : ""}${result.macro.dxy.changePercent.toFixed(2)}%)`);
      if (result.macro.treasury?.tenYear) console.log(`• US 10Y Yield:    ${result.macro.treasury.tenYear.toFixed(2)}%`);
      if (result.macro.equities?.sp500) console.log(`• S&P 500:         ${result.macro.equities.sp500}`);
      if (result.macro.gold?.price) console.log(`• Gold:            $${result.macro.gold.price}`);
    }

    if (result.newsSentiment) {
      console.log("\n📰 NEWS SENTIMENT TIMELINE:");
      console.log(`• Overall Bias:    ${result.newsSentiment.overallSentiment.toUpperCase()}`);
      console.log(`• Avg Impact Score:${result.newsSentiment.averageImpactScore}/10`);
      console.log(`• Articles Tracked:${result.newsSentiment.items.length}`);
    }

    console.log("\n⚡ DETERMINISTIC SIGNAL:");
    console.log(`• Action:          [ ${result.signal.action} ]`);
    console.log(`• Confidence:      ${result.signal.confidence}%`);
    console.log("• Key Reasons:");
    for (const reason of result.signal.reasons) {
      console.log(`   - ${reason}`);
    }

    console.log("\n==================================================");
    console.log("Run completed successfully.");
    process.exit(0);
  } catch (error: unknown) {
    console.error("\n❌ Pipeline execution failed:", error);
    process.exit(1);
  }
}

main();
