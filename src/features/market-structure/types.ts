export interface MarketStructureState {
  structure: 'bullish' | 'bearish' | 'ranging';
  supportLevels: number[];
  resistanceLevels: number[];
  demandBlocks: any[];
  supplyBlocks: any[];
  liquidity: any;
  volumeProfile: any;
  riskMetrics: any;
  psychology: any;
}
