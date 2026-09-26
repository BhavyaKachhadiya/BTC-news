import { describe, it, expect } from 'vitest';
import { marketStructureService } from './market-structure.service';

describe('Market Structure Service', () => {
  it('should return market structure state', () => {
    const result = marketStructureService.analyze();
    expect(result.structure).toBe('bullish');
    expect(result.supportLevels).toEqual([]);
    expect(result.resistanceLevels).toEqual([]);
  });
});
