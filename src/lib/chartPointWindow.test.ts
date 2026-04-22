import { describe, expect, it } from 'vitest';
import { applyChartPointWindow } from './chartPointWindow';

const points = Array.from({ length: 20 }, (_, index) => ({ label: `P${index + 1}`, value: index + 1 }));

describe('applyChartPointWindow', () => {
  it('전체 보기에서는 모든 지점을 유지한다', () => {
    const result = applyChartPointWindow(points, 'all', 5);
    expect(result.points).toHaveLength(20);
    expect(result.isWindowed).toBe(false);
    expect(result.mode).toBe('all');
  });

  it('최근 확대는 끝 지점부터 지정한 개수만 남긴다', () => {
    const result = applyChartPointWindow(points, 'recent', 5);
    expect(result.points.map((point) => point.label)).toEqual(['P16', 'P17', 'P18', 'P19', 'P20']);
    expect(result.originalCount).toBe(20);
    expect(result.isWindowed).toBe(true);
  });

  it('상위 필터는 큰 값 순서로 지정한 개수만 남긴다', () => {
    const shuffled = [points[3]!, points[19]!, points[8]!, points[15]!, points[1]!];
    const result = applyChartPointWindow(shuffled, 'top', 3);
    expect(result.points.map((point) => point.value)).toEqual([20, 16, 9]);
    expect(result.note).toContain('필터링');
  });

  it('지점 수가 작으면 확대 모드도 전체 보기로 안전하게 되돌린다', () => {
    const result = applyChartPointWindow(points.slice(0, 3), 'recent', 5);
    expect(result.points).toHaveLength(3);
    expect(result.mode).toBe('all');
    expect(result.isWindowed).toBe(false);
  });
});
