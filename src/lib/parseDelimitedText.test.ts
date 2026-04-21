import { describe, expect, it } from 'vitest';
import { parseDelimitedText } from './parseDelimitedText';

const oversized = `name,value\n${Array.from({ length: 5001 }, (_, index) => `A${index},${index}`).join('\n')}`;

describe('parseDelimitedText', () => {
  it('쉼표 구분 데이터를 파싱한다', () => {
    const result = parseDelimitedText('name,value\nA,10\nB,20');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.columns).toEqual(['name', 'value']);
    expect(result.data.rows[0]).toEqual({ name: 'A', value: 10 });
  });

  it('탭 구분 데이터를 파싱한다', () => {
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
