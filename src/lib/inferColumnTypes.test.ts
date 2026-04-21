import { describe, expect, it } from 'vitest';
import { inferColumnTypes } from './inferColumnTypes';
import type { DataRow } from './dataTypes';

describe('inferColumnTypes', () => {
  it('숫자, 날짜, 범주, 불명확 컬럼을 추론한다', () => {
    const rows: DataRow[] = [
      { amount: 10, day: '2026-01-01', category: 'A', mixed: 'x' },
      { amount: 20, day: '2026-01-02', category: 'B', mixed: 3 },
      { amount: 30, day: '2026-01-03', category: 'A', mixed: '2026-01-01' },
      { amount: 40, day: '2026-01-04', category: 'B', mixed: null },
    ];

    const profiles = inferColumnTypes(['amount', 'day', 'category', 'mixed'], rows);
    expect(profiles.find((profile) => profile.name === 'amount')?.type).toBe('number');
    expect(profiles.find((profile) => profile.name === 'day')?.type).toBe('date');
    expect(profiles.find((profile) => profile.name === 'category')?.type).toBe('category');
    expect(profiles.find((profile) => profile.name === 'mixed')?.type).toBe('unknown');
  });
});
