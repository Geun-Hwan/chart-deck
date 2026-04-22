import { describe, expect, it } from 'vitest';
import monthlySales from '../test/fixtures/monthly-sales.csv?raw';
import { parseDelimitedText } from './parseDelimitedText';

const oversized = `name,value\n${Array.from({ length: 5001 }, (_, index) => `A${index},${index}`).join('\n')}`;

describe('parseDelimitedText', () => {
  it('CSV 파일 fixture를 파싱한다', () => {
    const result = parseDelimitedText(monthlySales);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.columns).toEqual(['month', 'revenue', 'visitors', 'channel']);
    expect(result.data.rows[0]).toEqual({ month: '2026-01-01', revenue: 1200000, visitors: 3200, channel: '검색' });
  });

  it('탭 구분 fixture 형태를 파싱한다', () => {
    const result = parseDelimitedText('name\tvalue\nA\t10');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.delimiter).toBe('\t');
    expect(result.data.rows[0]?.value).toBe(10);
  });

  it('빈 입력은 오류를 반환한다', () => {
    const result = parseDelimitedText('   ');
    expect(result.ok).toBe(false);
  });

  it('단일 숫자 컬럼도 행 순서 차트용으로 파싱한다', () => {
    const result = parseDelimitedText('score\n10\n25\n15');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.columns).toEqual(['score']);
    expect(result.data.rows.map((row) => row.score)).toEqual([10, 25, 15]);
    expect(result.warnings).toContain('단일 컬럼 데이터는 행 순서를 임시 라벨로 사용해 차트를 표시합니다.');
  });

  it('행 수 제한을 초과하면 파싱하지 않는다', () => {
    const result = parseDelimitedText(oversized);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('5,000행');
  });

  it('복잡한 CSV 범위 경고를 반환한다', () => {
    const result = parseDelimitedText('name,value\n"A, Inc",10');
    expect(result.warnings.some((warning) => warning.includes('따옴표'))).toBe(true);
  });
});
