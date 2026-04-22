import { describe, expect, it } from 'vitest';
import { sampleChartPoints } from './chartSampling';

describe('sampleChartPoints', () => {
  it('작은 데이터는 그대로 유지한다', () => {
    const points = [
      { label: 'A', value: 1 },
      { label: 'B', value: 2 },
    ];
    const result = sampleChartPoints(points, 5);
    expect(result.points).toEqual(points);
    expect(result.isSampled).toBe(false);
  });

  it('큰 데이터는 시작과 끝을 포함해 균등 샘플링한다', () => {
    const points = Array.from({ length: 101 }, (_, index) => ({ label: String(index), value: index }));
    const result = sampleChartPoints(points, 11);
    expect(result.points).toHaveLength(11);
    expect(result.points[0]?.value).toBe(0);
    expect(result.points.at(-1)?.value).toBe(100);
    expect(result.isSampled).toBe(true);
    expect(result.originalCount).toBe(101);
  });
});
