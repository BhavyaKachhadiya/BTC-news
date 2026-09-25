import { evaluateSignalRules } from "../rules/signal.rules";
import { calculateConfidence } from "./confidence.service";
import type { SignalContext, SignalResult } from "../types/signal.types";

export class SignalService {
  /**
   * Deterministically evaluates the signal from multi-source input context.
   */
  public generateSignal(context: SignalContext): SignalResult {
    const { action, reasons } = evaluateSignalRules(context);
    const confidenceBreakdown = calculateConfidence(action, context);

    const { market, technicals, jev, anomaly } = context;

    return {
      action,
      confidence: confidenceBreakdown.total,
      reasons,
      timestamp: new Date().toISOString(),
      metrics: {
        btcPrice: market.price,
        rsi: technicals.rsi14,
        ema20: technicals.ema20,
        ema50: technicals.ema50,
        atr: technicals.atr14,
        volatility: technicals.volatility,
        regime: jev.marketRegime,
        newsDirection: jev.newsDirection,
        setupQuality: jev.setupQualityScore,
        isNetworkAnomaly: anomaly.isAnomaly,
      },
    };
  }
}

export const signalService = new SignalService();
