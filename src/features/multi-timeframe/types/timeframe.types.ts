export type Timeframe = "5m" | "15m" | "1h" | "4h" | "1D";

export type TimeframeTrend = "bullish" | "bearish" | "ranging" | "uncertain";

export type AlignmentStatus =
  | "aligned bullish"
  | "aligned bearish"
  | "mixed"
  | "transitioning"
  | "uncertain";

export interface TimeframeAnalysis {
  readonly timeframe: Timeframe;
  readonly price: number;
  readonly rsi: number;
  readonly ema20: number;
  readonly ema50: number;
  readonly atr: number;
  readonly volatility: number;
  readonly trend: TimeframeTrend;
}

export interface MultiTimeframeAlignment {
  readonly overallTrend: TimeframeTrend;
  readonly alignedCount: number;
  readonly alignmentStatus: AlignmentStatus;
  readonly timeframes: readonly TimeframeAnalysis[];
}

export interface BinanceKlineBar {
  readonly openTime: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
  readonly closeTime: number;
}
