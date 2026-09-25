import { coingeckoService } from "@/features/market";
import { mempoolService, detectNetworkAnomaly } from "@/features/network";
import { newsService } from "@/features/news";
import { technicalAnalysisService } from "@/features/technical-analysis";
import { jevService } from "@/features/jev";
import { signalService } from "@/features/signal";
import { historyService } from "@/features/history";
import { paperTradingService, outcomeEvaluator } from "@/features/paper-trading";
import { timeframeService, alignmentService } from "@/features/multi-timeframe";
import { whaleService } from "@/features/whale-intelligence";
import { derivativesService } from "@/features/derivatives";
import { macroService } from "@/features/macro";
import { newsTimelineService } from "@/features/news-sentiment";
import { logger } from "@/shared/logger/logger";
import type { SignalResult, SignalContext } from "@/features/signal/types/signal.types";
import type { TechnicalState } from "@/features/technical-analysis/types/technical.types";
import type { JevAnalysisResult, JevInputContext } from "@/features/jev/types/jev.types";
import type { MarketData } from "@/features/market/types/market.types";
import type { NetworkData, NetworkAnomaly } from "@/features/network/types/network.types";
import type { MultiTimeframeAlignment } from "@/features/multi-timeframe/types/timeframe.types";
import type { WhaleIntelligenceSummary } from "@/features/whale-intelligence/types/whale.types";
import type { DerivativesSnapshot } from "@/features/derivatives/types/derivatives.types";
import type { MacroSnapshot } from "@/features/macro/types/macro.types";
import type { SentimentTimelineSummary } from "@/features/news-sentiment/types/sentiment.types";

export interface AnalysisPipelineOutput {
  readonly success: boolean;
  readonly timestamp: string;
  readonly signal: SignalResult;
  readonly market: MarketData;
  readonly technicals: TechnicalState;
  readonly network: NetworkData;
  readonly anomaly: NetworkAnomaly;
  readonly jev: JevAnalysisResult;
  readonly recentNewsCount: number;
  readonly decisionId?: string;
  readonly multiTimeframe?: MultiTimeframeAlignment;
  readonly whale?: WhaleIntelligenceSummary;
  readonly derivatives?: DerivativesSnapshot;
  readonly macro?: MacroSnapshot;
  readonly newsSentiment?: SentimentTimelineSummary;
}

export class AnalysisOrchestrator {
  private lastNetworkData: NetworkData | null = null;

  /**
   * Executes the complete deterministic intelligence pipeline wiring all 5 intelligence layers.
   */
  public async runPipeline(): Promise<AnalysisPipelineOutput> {
    const startTime = Date.now();
    logger.info("▶ Starting BTC Signal Engine Analysis Pipeline", "Orchestrator");

    // 1. Concurrently fetch all telemetry and intelligence inputs
    const [
      marketData,
      networkData,
      newsItems,
      historicalPrices,
      timeframeAnalyses,
      whaleIntelligence,
      derivativesSnapshot,
      macroSnapshot,
    ] = await Promise.all([
      coingeckoService.getCurrentMarketData(),
      mempoolService.getCurrentNetworkData(),
      newsService.getRecentNews(40),
      coingeckoService.getHistoricalPrices({ days: 30, interval: "daily" }),
      timeframeService.analyzeAllTimeframes().catch((err: unknown) => {
        logger.warn("Timeframe analysis fetch failed; defaulting to empty list", "Orchestrator", {
          error: String(err),
        });
        return [];
      }),
      whaleService.getWhaleIntelligence().catch((err: unknown) => {
        logger.warn("Whale intelligence fetch failed; defaulting to undefined", "Orchestrator", {
          error: String(err),
        });
        return undefined;
      }),
      derivativesService.getDerivativesSnapshot().catch((err: unknown) => {
        logger.warn("Derivatives snapshot fetch failed; defaulting to undefined", "Orchestrator", {
          error: String(err),
        });
        return undefined;
      }),
      macroService.getMacroSnapshot().catch((err: unknown) => {
        logger.warn("Macro snapshot fetch failed; defaulting to undefined", "Orchestrator", {
          error: String(err),
        });
        return undefined;
      }),
    ]);

    logger.debug(
      `Fetched data: BTC Price $${marketData.price}, Txs: ${networkData.txCount}, News: ${newsItems.length}, Timeframes: ${timeframeAnalyses?.length ?? 0}`,
      "Orchestrator",
    );

    // 2. Synthesize multi-timeframe alignment if at least 2 timeframes are available
    const multiTimeframeAlignment =
      timeframeAnalyses && timeframeAnalyses.length >= 2
        ? alignmentService.computeMultiTimeframeAlignment(timeframeAnalyses)
        : undefined;

    // 3. Process news items into correlated sentiment timeline
    const newsSentiment = newsTimelineService.processNewsToTimeline(newsItems, marketData.price);

    // Persist news sentiment and evaluate pending news outcomes asynchronously
    if (newsSentiment.items && newsSentiment.items.length > 0) {
      newsTimelineService.persistToDatabase(newsSentiment.items).catch((err: unknown) => {
        logger.debug("Background news sentiment persist skipped", "Orchestrator", {
          error: String(err),
        });
      });
    }
    newsTimelineService.evaluatePendingOutcomes(marketData.price).catch((err: unknown) => {
      logger.debug("Background news outcomes evaluation skipped", "Orchestrator", {
        error: String(err),
      });
    });

    // 4. Combine historical prices with latest observed price
    const fullPriceSeries = [...historicalPrices];
    if (fullPriceSeries.length === 0 || fullPriceSeries[fullPriceSeries.length - 1] !== marketData.price) {
      fullPriceSeries.push(marketData.price);
    }

    // 5. Calculate deterministic technical indicators
    const technicals = technicalAnalysisService.analyze({ prices: fullPriceSeries });

    // 6. Detect network anomalies
    const anomaly = detectNetworkAnomaly(networkData, this.lastNetworkData);
    this.lastNetworkData = networkData;

    // 7. Send full intelligence context to Jev AI and validate response
    const jevContext: JevInputContext = {
      market: marketData,
      technicals,
      network: networkData,
      networkAnomaly: anomaly,
      news: newsItems,
      multiTimeframe: multiTimeframeAlignment,
      whale: whaleIntelligence,
      derivatives: derivativesSnapshot,
      macro: macroSnapshot,
      newsSentiment,
    };
    const jevResult = await jevService.analyze(jevContext);

    // 8. Run deterministic Signal Engine & Confidence calculation with full context
    const signalContext: SignalContext = {
      market: marketData,
      technicals,
      network: networkData,
      anomaly,
      news: newsItems,
      jev: jevResult,
      multiTimeframe: multiTimeframeAlignment,
      whale: whaleIntelligence,
      derivatives: derivativesSnapshot,
      macro: macroSnapshot,
      newsSentiment,
    };
    const signalResult = signalService.generateSignal(signalContext);

    // 9. Save complete reproducible decision and all layer snapshots to MongoDB
    let decisionId: string | undefined;
    try {
      decisionId = await historyService.saveSignalDecision(signalResult, signalContext);
    } catch (dbErr: unknown) {
      logger.warn("Decision could not be saved to DB (continuing in-memory)", "Orchestrator", {
        error: String(dbErr),
      });
    }

    // 10. Update Paper Trading state and evaluate pending historical outcomes
    try {
      await paperTradingService.processSignal(signalResult, marketData.price);
      await outcomeEvaluator.evaluatePendingOutcomes(marketData.price);
    } catch (ptErr: unknown) {
      logger.warn("Paper trading update error", "Orchestrator", { error: String(ptErr) });
    }

    const durationMs = Date.now() - startTime;
    logger.info(
      `✔ Analysis pipeline finished in ${durationMs}ms. Action: [${signalResult.action}] Confidence: ${signalResult.confidence}%`,
      "Orchestrator",
    );

    return {
      success: true,
      timestamp: new Date().toISOString(),
      signal: signalResult,
      market: marketData,
      technicals,
      network: networkData,
      anomaly,
      jev: jevResult,
      recentNewsCount: newsItems.length,
      decisionId,
      multiTimeframe: multiTimeframeAlignment,
      whale: whaleIntelligence,
      derivatives: derivativesSnapshot,
      macro: macroSnapshot,
      newsSentiment,
    };
  }
}

export const orchestratorService = new AnalysisOrchestrator();
