export type AlertType =
  | "SIGNAL_GENERATED"
  | "PRICE_THRESHOLD"
  | "WHALE_MOVEMENT"
  | "FUNDING_SPIKE"
  | "NETWORK_CONGESTION"
  | "HIGH_IMPACT_NEWS";

export type AlertSeverity = "info" | "warning" | "critical";

export interface WebAlert {
  readonly id: string;
  readonly type: AlertType;
  readonly severity: AlertSeverity;
  readonly title: string;
  readonly message: string;
  readonly timestamp: string;
  readonly isRead: boolean;
  readonly data?: Record<string, unknown>;
}

export interface AlertRulesConfig {
  readonly enabled: boolean;
  readonly soundEnabled: boolean;
  readonly browserNotifications: boolean;
  readonly minConfidenceThreshold: number;
  readonly largeWhaleThresholdBtc: number;
  readonly fundingSpikeThresholdPercent: number;
  readonly highImpactNewsOnly: boolean;
  readonly webhookUrl?: string;
}

export const DEFAULT_ALERT_RULES_CONFIG: AlertRulesConfig = {
  enabled: true,
  soundEnabled: true,
  browserNotifications: true,
  minConfidenceThreshold: 70,
  largeWhaleThresholdBtc: 50,
  fundingSpikeThresholdPercent: 0.03,
  highImpactNewsOnly: true,
};
