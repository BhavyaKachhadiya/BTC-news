import { prisma } from "@/shared/database/prisma";
import { logger } from "@/shared/logger/logger";

export class HistoricalOutcomeEvaluator {
  /**
   * Evaluates pending historical outcomes against the current observed price
   * once the required time window (1h, 4h, 24h) has elapsed.
   *
   * Rules:
   * - Does NOT fabricate prices.
   * - Only evaluates when the real time has elapsed (e.g. >= 60 minutes for 1h).
   */
  public async evaluatePendingOutcomes(currentPrice: number): Promise<number> {
    logger.debug(`Evaluating pending historical outcomes with current price $${currentPrice}`, "HistoricalOutcomeEvaluator");

    try {
      const pendingOutcomes = await prisma.signalOutcome.findMany({
        where: { isCompleted: false },
        include: { signalDecision: true },
      });

      let updatedCount = 0;
      const now = Date.now();

      for (const outcome of pendingOutcomes) {
        const decisionTime = new Date(outcome.signalDecision.timestamp).getTime();
        const elapsedHours = (now - decisionTime) / (1000 * 60 * 60);

        let modified = false;
        const updates: {
          priceAfter1h?: number;
          pnlPercent1h?: number;
          priceAfter4h?: number;
          pnlPercent4h?: number;
          priceAfter24h?: number;
          pnlPercent24h?: number;
          isCompleted?: boolean;
        } = {};

        const sideMultiplier = outcome.signalDecision.action === "SHORT" ? -1 : 1;

        // 1 Hour Evaluation
        if (elapsedHours >= 1 && outcome.priceAfter1h == null) {
          updates.priceAfter1h = currentPrice;
          updates.pnlPercent1h = Number(
            (((currentPrice - outcome.entryPrice) / outcome.entryPrice) * 100 * sideMultiplier).toFixed(2),
          );
          modified = true;
        }

        // 4 Hours Evaluation
        if (elapsedHours >= 4 && outcome.priceAfter4h == null) {
          updates.priceAfter4h = currentPrice;
          updates.pnlPercent4h = Number(
            (((currentPrice - outcome.entryPrice) / outcome.entryPrice) * 100 * sideMultiplier).toFixed(2),
          );
          modified = true;
        }

        // 24 Hours Evaluation (Marks completion)
        if (elapsedHours >= 24 && outcome.priceAfter24h == null) {
          updates.priceAfter24h = currentPrice;
          updates.pnlPercent24h = Number(
            (((currentPrice - outcome.entryPrice) / outcome.entryPrice) * 100 * sideMultiplier).toFixed(2),
          );
          updates.isCompleted = true;
          modified = true;
        }

        if (modified) {
          await prisma.signalOutcome.update({
            where: { id: outcome.id },
            data: updates,
          });
          updatedCount++;
        }
      }

      return updatedCount;
    } catch (err: unknown) {
      logger.warn("Outcome evaluation skipped or failed (DB offline)", "HistoricalOutcomeEvaluator", {
        error: String(err),
      });
      return 0;
    }
  }
}

export const outcomeEvaluator = new HistoricalOutcomeEvaluator();
