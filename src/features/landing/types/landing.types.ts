export type TerminalView = "signal" | "timeframes" | "whale" | "macro" | "jev";

export interface FeatureCard {
  readonly id: number;
  readonly title: string;
  readonly category: string;
  readonly desc: string;
  readonly highlight: string;
}
