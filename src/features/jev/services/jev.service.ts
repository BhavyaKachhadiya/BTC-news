import { TypeSafeClient } from "@typesafe-ai/sdk";
import { env } from "@/config/env";
import { getRuntimeSettings } from "@/config/runtime-settings";
import { logger } from "@/shared/logger/logger";
import { ValidationError } from "@/shared/errors/app-error";
import { buildJevQuestions, formatContextState } from "../prompts/jev.prompts";
import { jevAnalysisResultSchema } from "../schemas/jev.schema";
import type {
  JevAnalysisResult,
  JevInputContext,
  JevProvider,
  MarketRegime,
  NewsDirection,
} from "../types/jev.types";

interface JevAnswersStructure {
  regime: { choice: string; confidence: number };
  newsDirection: { choice: string };
  newsImpact: { score: number };
  setupQuality: { score: number };
  unusualNetworkActivity: { noul: number };
}

export class JevService implements JevProvider {
  private readonly apiKey?: string;
  private client?: TypeSafeClient;
  private readonly isOpenRouter: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey !== undefined ? apiKey : (env.OPENROUTER_API_KEY || env.TYPESAFE_API_KEY);
    this.isOpenRouter = Boolean(
      this.apiKey && (this.apiKey.startsWith("sk-or-") || Boolean(env.OPENROUTER_API_KEY)),
    );
    if (this.apiKey && !this.isOpenRouter) {
      this.client = new TypeSafeClient({ apiKey: this.apiKey });
    }
  }

  public async analyze(context: JevInputContext): Promise<JevAnalysisResult> {
    // 1. If Pure Deterministic Mode is explicitly enabled via config or runtime toggle
    const { enableJev } = getRuntimeSettings();
    if (!enableJev) {
      logger.info(
        "ENABLE_JEV is false. Returning degraded neutral Jev analysis for Pure Deterministic Mode.",
        "JevService",
      );
      return this.getDegradedAnalysis(
        context,
        "Pure Deterministic Mode enabled (Jev AI disabled via config)",
      );
    }

    // 2. If no API key configured, gracefully degrade
    if (!this.apiKey) {
      logger.warn(
        "No API key configured for Jev AI. Returning degraded neutral Jev analysis.",
        "JevService",
      );
      return this.getDegradedAnalysis(
        context,
        "TYPESAFE_API_KEY or OPENROUTER_API_KEY is not configured in environment",
      );
    }

    try {
      const state = formatContextState(context);
      const questions = buildJevQuestions();

      let answers: JevAnswersStructure;

      if (this.isOpenRouter) {
        logger.debug("Dispatching atomic decisions to OpenRouter Jev Decisions API", "JevService");
        const res = await fetch("https://openrouter.ai/api/alpha/decisions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/btc-signal-engine",
            "X-Title": "BTC Signal Engine",
          },
          body: JSON.stringify({
            model: "~typesafe/jev-latest",
            state,
            questions,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text().catch(() => "");
          throw new Error(
            `OpenRouter decisions API responded with ${res.status} ${res.statusText}: ${errorText}`,
          );
        }

        const data = (await res.json()) as { answers: JevAnswersStructure };
        if (!data || !data.answers) {
          throw new Error("Invalid response format from OpenRouter decisions API: missing answers");
        }

        answers = data.answers;
      } else {
        if (!this.client) {
          return this.getDegradedAnalysis(context, "TypeSafe client is not initialized");
        }
        logger.debug("Dispatching atomic questions to TypeSafe AI System One", "JevService");
        const response = await this.client.systemOne({
          state,
          questions,
        });
        answers = response.answers;
      }

      const rawRegime = answers.regime.choice;
      const regime: MarketRegime = ["bullish", "bearish", "ranging", "uncertain"].includes(rawRegime)
        ? (rawRegime as MarketRegime)
        : "uncertain";

      const rawNewsDir = answers.newsDirection.choice;
      const newsDirection: NewsDirection = ["bullish", "bearish", "neutral"].includes(rawNewsDir)
        ? (rawNewsDir as NewsDirection)
        : "neutral";

      // Score answers are 0 to 4 in our criteria array, map to 0-10 scale
      const newsImpactScore = Number(((answers.newsImpact.score / 4) * 10).toFixed(1));
      const setupQualityScore = Number(((answers.setupQuality.score / 4) * 10).toFixed(1));
      const networkAnomalyProbability = Number(answers.unusualNetworkActivity.noul.toFixed(2));
      const isNetworkAnomaly = networkAnomalyProbability >= 0.5 || context.networkAnomaly.isAnomaly;
      const regimeConfidence = answers.regime.confidence;

      const summary = `Jev classified regime as ${regime.toUpperCase()} (confidence: ${(regimeConfidence * 100).toFixed(0)}%). News bias: ${newsDirection}. Setup quality: ${setupQualityScore}/10.`;

      const candidate = {
        marketRegime: regime,
        regimeConfidence,
        newsDirection,
        newsImpactScore,
        setupQualityScore,
        networkAnomalyScore: networkAnomalyProbability,
        isNetworkAnomaly,
        summary,
        isDegraded: false,
        timestamp: new Date().toISOString(),
      };

      const parsed = jevAnalysisResultSchema.safeParse(candidate);
      if (!parsed.success) {
        throw new ValidationError("Jev response failed schema validation", parsed.error.issues);
      }

      return parsed.data;
    } catch (err: unknown) {
      logger.error("Jev API request failed, falling back to degraded state", "JevService", {
        error: String(err),
      });
      return this.getDegradedAnalysis(
        context,
        `Jev request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private getDegradedAnalysis(context: JevInputContext, reason: string): JevAnalysisResult {
    return {
      marketRegime: "uncertain",
      regimeConfidence: 0.5,
      newsDirection: "neutral",
      newsImpactScore: 5.0,
      setupQualityScore: 5.0,
      networkAnomalyScore: context.networkAnomaly.isAnomaly ? 0.9 : 0.1,
      isNetworkAnomaly: context.networkAnomaly.isAnomaly,
      summary: `[DEGRADED MODE] Neutral interpretation: ${reason}.`,
      isDegraded: true,
      degradedReason: reason,
      timestamp: new Date().toISOString(),
    };
  }
}

export const jevService = new JevService();
