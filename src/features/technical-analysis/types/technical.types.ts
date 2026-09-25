export interface TechnicalState {
  readonly rsi14: number;
  readonly ema20: number;
  readonly ema50: number;
  readonly sma20: number;
  readonly atr14: number;
  readonly volatility: number;
  readonly priceChange: number;
  readonly volumeChange?: number;
  readonly currentPrice: number;
  readonly timestamp: string;
}

export interface TechnicalInputData {
  readonly prices: readonly number[];
  readonly volumes?: readonly number[];
}
