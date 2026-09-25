export type DataAvailability = "available" | "unavailable" | "stale";

export type MacroRegimeType = "risk-on" | "risk-off" | "neutral";

export interface MacroSnapshot {
  readonly timestamp: string;
  readonly dxy?: {
    readonly value: number;
    readonly changePercent: number;
  };
  readonly treasury?: {
    readonly twoYear?: number;
    readonly tenYear?: number;
  };
  readonly equities?: {
    readonly sp500?: number;
    readonly nasdaq?: number;
  };
  readonly gold?: {
    readonly price: number;
    readonly changePercent: number;
  };
  readonly freshness: DataAvailability;
}

export interface DxyQuote {
  readonly symbol: string;
  readonly value: number;
  readonly changePercent: number;
  readonly previousClose?: number;
  readonly timestamp: string;
}

export interface YieldsQuote {
  readonly twoYear?: number;
  readonly tenYear?: number;
  readonly spread?: number;
  readonly timestamp: string;
}

export interface CommodityQuote {
  readonly symbol: string;
  readonly price: number;
  readonly changePercent: number;
  readonly previousClose?: number;
  readonly timestamp: string;
}

export interface EquitiesQuote {
  readonly sp500?: number;
  readonly nasdaq?: number;
  readonly sp500ChangePercent?: number;
  readonly nasdaqChangePercent?: number;
  readonly timestamp: string;
}

export interface MacroProvider {
  getMacroSnapshot(): Promise<MacroSnapshot>;
}
