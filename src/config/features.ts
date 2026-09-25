export interface IntelligenceFeatures {
  readonly multiTimeframe: boolean;
  readonly whaleIntelligence: boolean;
  readonly derivatives: boolean;
  readonly macro: boolean;
  readonly newsSentiment: boolean;
}

export const defaultIntelligenceFeatures: IntelligenceFeatures = {
  multiTimeframe: true,
  whaleIntelligence: true,
  derivatives: true,
  macro: true,
  newsSentiment: true,
};
