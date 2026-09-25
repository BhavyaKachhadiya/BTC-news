import type React from "react";

export type TabId =
  | "overview"
  | "multi-timeframe"
  | "whale"
  | "derivatives-macro"
  | "sentiment"
  | "backtest"
  | "history"
  | "health"
  | "all";

export interface TabItem {
  readonly id: TabId;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly badge?: string;
  readonly badgeColor?: string;
}
