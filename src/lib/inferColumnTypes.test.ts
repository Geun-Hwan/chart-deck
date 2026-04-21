import { describe, expect, it } from 'vitest';
import mixedQualityCsv from '../test/fixtures/mixed-quality.csv?raw';
import { inferColumnTypes } from './inferColumnTypes';
import { parseDelimitedText } from './parseDelimitedText';

describe('inferColumnTypes', () => {
  it('CSV fixture에서 숫자, 날짜, 범주, 불명확 컬럼을 추론한다', () => {
    const parsed = parseDelimitedText(mixedQualityCsv);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const profiles = inferColumnTypes(parsed.data.columns, parsed.data.rows);
    expect(profiles.find((profile) => profile.name === 'value')?.type).toBe('number');
    expect(profiles.find((profile) => profile.name === 'dateish')?.type).toBe('date');
    expect(profiles.find((profile) => profile.name === 'name')?.type).toBe('category');
    expect(profiles.find((profile) => profile.name === 'mixed')?.type).toBe('unknown');
  });
});
