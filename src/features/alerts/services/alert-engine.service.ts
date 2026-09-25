import { logger } from "@/shared/logger/logger";
import type {
  WebAlert,
  AlertRulesConfig,
  AlertType,
  AlertSeverity,
} from "../types/alert.types";
import { DEFAULT_ALERT_RULES_CONFIG } from "../types/alert.types";

export interface PipelineEvaluationInput {
  readonly signal?: {
    readonly action: "LONG" | "SHORT" | "WAIT";
    readonly confidence: number;
    readonly reasons?: readonly string[];
  };
  readonly market?: {
    readonly price: number;
    readonly change24h: number;
  };
  readonly whale?: {
    readonly largeTransactions?: ReadonlyArray<{
      readonly transactionId: string;
      readonly amountBtc: number;
      readonly amountUsd?: number;
    }>;
  };
  readonly derivatives?: {
    readonly fundingRate?: number;
    readonly eventFlags?: {
      readonly isFundingSpike?: boolean;
    };
  };
  readonly network?: {
    readonly isAnomaly?: boolean;
    readonly fastestFee?: number;
  };
  readonly newsSentiment?: {
    readonly items?: ReadonlyArray<{
      readonly title: string;
      readonly impact: string;
      readonly sentiment: string;
    }>;
  };
}

export class WebAlertEngine {
  private config: AlertRulesConfig;
  private alerts: WebAlert[] = [];
  private seenAlertKeys: Set<string> = new Set();

  constructor(initialConfig: Partial<AlertRulesConfig> = {}) {
    this.config = { ...DEFAULT_ALERT_RULES_CONFIG, ...initialConfig };
  }

  public getConfig(): AlertRulesConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<AlertRulesConfig>): AlertRulesConfig {
    this.config = { ...this.config, ...newConfig };
    logger.info("Alert rules configuration updated", "WebAlertEngine", { config: this.config });
    return this.getConfig();
  }

  public getAlerts(limit = 50): readonly WebAlert[] {
    return this.alerts.slice(0, limit);
  }

  public getUnreadCount(): number {
    return this.alerts.filter((a) => !a.isRead).length;
  }

  public markAsRead(id: string): boolean {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      (alert as { isRead: boolean }).isRead = true;
      return true;
    }
    return false;
  }

  public markAllAsRead(): void {
    for (const a of this.alerts) {
      (a as { isRead: boolean }).isRead = true;
    }
  }

  public clearAlerts(): void {
    this.alerts = [];
    this.seenAlertKeys.clear();
  }

  public pushAlert(alert: Omit<WebAlert, "id" | "timestamp" | "isRead">): WebAlert {
    const id = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newAlert: WebAlert = {
      ...alert,
      id,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    // Prepend to alerts list, cap at 100 entries
    this.alerts = [newAlert, ...this.alerts].slice(0, 100);

    logger.info(`Web Alert Triggered [${alert.type} - ${alert.severity}]: ${alert.title}`, "WebAlertEngine");

    // Optional out-of-band HTTP webhook dispatch if configured
    if (this.config.webhookUrl) {
      this.dispatchWebhook(this.config.webhookUrl, newAlert).catch((err) => {
        logger.warn("Webhook dispatch failed", "WebAlertEngine", { error: String(err) });
      });
    }

    return newAlert;
  }

  /**
   * Evaluates the unified pipeline state against user alert rules.
   */
  public evaluatePipeline(input: PipelineEvaluationInput): readonly WebAlert[] {
    if (!this.config.enabled) return [];

    const triggered: WebAlert[] = [];

    // 1. Signal Generation Trigger
    if (
      input.signal &&
      input.signal.action !== "WAIT" &&
      input.signal.confidence >= this.config.minConfidenceThreshold
    ) {
      const dedupKey = `sig_${input.signal.action}_${Math.round(input.signal.confidence / 5)}`;
      if (!this.seenAlertKeys.has(dedupKey)) {
        this.seenAlertKeys.add(dedupKey);
        const alert = this.pushAlert({
          type: "SIGNAL_GENERATED",
          severity: input.signal.confidence >= 80 ? "critical" : "warning",
          title: `Actionable Signal: ${input.signal.action} (${input.signal.confidence}% Confidence)`,
          message:
            input.signal.reasons?.[0] ??
            `High conviction ${input.signal.action} setup detected by BTC Quantitative Engine.`,
          data: { action: input.signal.action, confidence: input.signal.confidence },
        });
        triggered.push(alert);
      }
    }

    // 2. Whale Movement Trigger
    if (input.whale?.largeTransactions && input.whale.largeTransactions.length > 0) {
      for (const tx of input.whale.largeTransactions) {
        if (tx.amountBtc >= this.config.largeWhaleThresholdBtc) {
          const dedupKey = `whale_${tx.transactionId}`;
          if (!this.seenAlertKeys.has(dedupKey)) {
            this.seenAlertKeys.add(dedupKey);
            const alert = this.pushAlert({
              type: "WHALE_MOVEMENT",
              severity: tx.amountBtc >= 100 ? "critical" : "warning",
              title: `Whale Transfer Detected: ${tx.amountBtc.toFixed(1)} BTC`,
              message: `Large on-chain transfer of ${tx.amountBtc.toFixed(1)} BTC (≈ $${((tx.amountUsd ?? tx.amountBtc * 96000) / 1e6).toFixed(2)}M) detected in mempool.`,
              data: { txId: tx.transactionId, amountBtc: tx.amountBtc },
            });
            triggered.push(alert);
          }
        }
      }
    }

    // 3. Derivatives Funding Rate Spike Trigger
    if (input.derivatives) {
      const rate = input.derivatives.fundingRate ?? 0;
      const isSpike =
        input.derivatives.eventFlags?.isFundingSpike ||
        Math.abs(rate) >= this.config.fundingSpikeThresholdPercent;

      if (isSpike) {
        const dedupKey = `funding_${(rate * 100).toFixed(2)}`;
        if (!this.seenAlertKeys.has(dedupKey)) {
          this.seenAlertKeys.add(dedupKey);
          const alert = this.pushAlert({
            type: "FUNDING_SPIKE",
            severity: "warning",
            title: `Derivatives Funding Rate Spike: ${(rate * 100).toFixed(4)}%`,
            message:
              rate > 0
                ? "Extreme long crowding observed; liquidation cascade risk elevated."
                : "Extreme short crowding observed; short squeeze volatility risk elevated.",
            data: { fundingRate: rate },
          });
          triggered.push(alert);
        }
      }
    }

    // 4. Network Congestion Anomaly
    if (input.network?.isAnomaly) {
      const dedupKey = `network_anomaly_${Math.round((input.network.fastestFee ?? 50) / 10)}`;
      if (!this.seenAlertKeys.has(dedupKey)) {
        this.seenAlertKeys.add(dedupKey);
        const alert = this.pushAlert({
          type: "NETWORK_CONGESTION",
          severity: "warning",
          title: "Bitcoin Network Congestion Alert",
          message: `Network fee anomaly detected. Priority gas fees spiked to ${input.network.fastestFee ?? 80} sat/vB.`,
        });
        triggered.push(alert);
      }
    }

    // 5. Breaking High-Impact News
    if (input.newsSentiment?.items && input.newsSentiment.items.length > 0) {
      for (const item of input.newsSentiment.items) {
        if (item.impact === "exceptional" || (!this.config.highImpactNewsOnly && item.impact === "high")) {
          const dedupKey = `news_${item.title.slice(0, 30)}`;
          if (!this.seenAlertKeys.has(dedupKey)) {
            this.seenAlertKeys.add(dedupKey);
            const alert = this.pushAlert({
              type: "HIGH_IMPACT_NEWS",
              severity: item.impact === "exceptional" ? "critical" : "info",
              title: `Breaking News (${item.sentiment.toUpperCase()}): ${item.impact.toUpperCase()} Impact`,
              message: item.title,
            });
            triggered.push(alert);
          }
        }
      }
    }

    return triggered;
  }

  /**
   * Helper to trigger a realistic test notification for testing browser audio/push permissions.
   */
  public triggerTestAlert(): WebAlert {
    return this.pushAlert({
      type: "SIGNAL_GENERATED",
      severity: "critical",
      title: "Test Alert • Deterministic Signal LONG",
      message: "Browser notification and audio chime verified successfully at 84% confidence confluence.",
      data: { isTest: true },
    });
  }

  private async dispatchWebhook(url: string, alert: WebAlert): Promise<void> {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alert),
      });
    } catch (err) {
      logger.error("Failed to post alert to external webhook", "WebAlertEngine", { error: String(err) });
    }
  }
}

export const webAlertEngine = new WebAlertEngine();
