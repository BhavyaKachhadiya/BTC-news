import { describe, it, expect, beforeEach } from "vitest";
import { WebAlertEngine } from "@/features/alerts/services/alert-engine.service";

describe("WebAlertEngine", () => {
  let engine: WebAlertEngine;

  beforeEach(() => {
    engine = new WebAlertEngine({
      enabled: true,
      minConfidenceThreshold: 70,
      largeWhaleThresholdBtc: 50,
      fundingSpikeThresholdPercent: 0.03,
    });
  });

  it("triggers actionable alert when high-conviction signal is evaluated", () => {
    const alerts = engine.evaluatePipeline({
      signal: {
        action: "LONG",
        confidence: 82,
        reasons: ["Strong EMA breakout confluence with RSI momentum"],
      },
    });

    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe("SIGNAL_GENERATED");
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].title).toContain("LONG (82% Confidence)");
    expect(engine.getUnreadCount()).toBe(1);
  });

  it("does not trigger alert for WAIT signals or low confidence below threshold", () => {
    const alerts = engine.evaluatePipeline({
      signal: {
        action: "LONG",
        confidence: 60, // Below 70% threshold
      },
    });

    expect(alerts.length).toBe(0);
  });

  it("triggers alert on large whale transactions", () => {
    const alerts = engine.evaluatePipeline({
      whale: {
        largeTransactions: [
          {
            transactionId: "tx_12345",
            amountBtc: 150,
            amountUsd: 14_400_000,
          },
        ],
      },
    });

    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe("WHALE_MOVEMENT");
    expect(alerts[0].title).toContain("150.0 BTC");
  });

  it("triggers alert on derivatives funding rate spikes", () => {
    const alerts = engine.evaluatePipeline({
      derivatives: {
        fundingRate: 0.045, // Extreme Long crowding
      },
    });

    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe("FUNDING_SPIKE");
    expect(alerts[0].title).toContain("4.5000%");
  });

  it("can mark alerts as read and clear alerts", () => {
    const alert = engine.triggerTestAlert();
    expect(engine.getUnreadCount()).toBe(1);

    const marked = engine.markAsRead(alert.id);
    expect(marked).toBe(true);
    expect(engine.getUnreadCount()).toBe(0);

    engine.clearAlerts();
    expect(engine.getAlerts().length).toBe(0);
  });
});
