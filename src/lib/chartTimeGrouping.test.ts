import { describe, expect, it } from 'vitest';
import { aggregateTimeSeriesPoints } from './chartTimeGrouping';

describe('chartTimeGrouping', () => {
  const points = [
    { label: '2025-12-31', x: 0, value: 10 },
    { label: '2026-01-01', x: 1, value: 20 },
    { label: '2026-01-15', x: 2, value: 30 },
    { label: '2026-02-01', x: 3, value: 40 },
  ];

  it('일 기준에서는 날짜별 지점을 유지한다', () => {
    expect(aggregateTimeSeriesPoints(points, 'day')).toEqual([
      { label: '2025-12-31', x: Date.UTC(2025, 11, 31), value: 10 },
      { label: '2026-01-01', x: Date.UTC(2026, 0, 1), value: 20 },
      { label: '2026-01-15', x: Date.UTC(2026, 0, 15), value: 30 },
      { label: '2026-02-01', x: Date.UTC(2026, 1, 1), value: 40 },
    ]);
  });

  it('월 기준에서는 같은 달 데이터를 합산한다', () => {
    expect(aggregateTimeSeriesPoints(points, 'month')).toEqual([
      { label: '2025-12', x: Date.UTC(2025, 11, 1), value: 10 },
      { label: '2026-01', x: Date.UTC(2026, 0, 1), value: 50 },
      { label: '2026-02', x: Date.UTC(2026, 1, 1), value: 40 },
    ]);
  });

  it('년 기준에서는 같은 해 데이터를 합산한다', () => {
    expect(aggregateTimeSeriesPoints(points, 'year')).toEqual([
      { label: '2025', x: Date.UTC(2025, 0, 1), value: 10 },
      { label: '2026', x: Date.UTC(2026, 0, 1), value: 90 },
    ]);
  });
});
