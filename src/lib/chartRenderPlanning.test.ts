import { describe, expect, it } from 'vitest';
import { planChartRendering } from './chartRenderPlanning';

const points = (count: number) => Array.from({ length: count }, (_, index) => ({ label: String(index), x: index, value: index % 97 }));

describe('planChartRendering', () => {
  it('작은 선 차트는 전체 지점을 유지한다', () => {
    const result = planChartRendering('line', points(120));
    expect(result.points).toHaveLength(120);
    expect(result.notice).toBeNull();
  });

  it('대량 선 차트는 렌더링 가능한 지점 수로 줄인다', () => {
    const result = planChartRendering('line', points(30_000));
    expect(result.points.length).toBeLessThanOrEqual(900);
    expect(result.points[0]?.x).toBe(0);
    expect(result.notice).toMatchObject({ originalCount: 30000 });
  });

  it('도넛 차트는 주요 항목과 기타로 정리한다', () => {
    const result = planChartRendering('donut', points(30));
    expect(result.points).toHaveLength(6);
    expect(result.points.at(-1)?.label).toBe('기타');
  });

  it('가로 막대 차트는 상위 항목 중심으로 정리한다', () => {
    const result = planChartRendering('horizontalBar', points(100));
    expect(result.points).toHaveLength(20);
    expect(result.notice?.renderedCount).toBe(20);
  });
});
