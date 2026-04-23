import { describe, expect, it } from 'vitest';
import { applyChartZoomRange, formatChartZoomRange, getDefaultChartZoomRange, getNextChartZoomRange } from './chartZoom';

const points = Array.from({ length: 20 }, (_, index) => ({ label: `P${index + 1}`, value: index + 1 }));

describe('chartZoom', () => {
  it('기본 범위는 전체 데이터를 본다', () => {
    expect(getDefaultChartZoomRange(20)).toEqual({ start: 0, end: 20 });
    expect(formatChartZoomRange(getDefaultChartZoomRange(20), 20)).toBe('전체 20개');
  });

  it('휠 줌 인은 앵커 주변 데이터 범위를 줄인다', () => {
    const range = getNextChartZoomRange(getDefaultChartZoomRange(20), 20, 'in', 0.5);
    expect(range.end - range.start).toBe(14);
    expect(range.start).toBeGreaterThan(0);
    expect(range.end).toBeLessThan(20);
  });

  it('왼쪽 앵커에서 줌 인하면 시작 지점을 유지한다', () => {
    const range = getNextChartZoomRange(getDefaultChartZoomRange(20), 20, 'in', 0);
    expect(range.start).toBe(0);
    expect(range.end).toBe(14);
  });

  it('줌 아웃은 전체 범위까지 확장한다', () => {
    const zoomed = getNextChartZoomRange(getDefaultChartZoomRange(20), 20, 'in', 0.5);
    const expanded = getNextChartZoomRange(zoomed, 20, 'out', 0.5);
    expect(expanded).toEqual({ start: 0, end: 20 });
  });

  it('휠 줌은 차트 크기가 아니라 표시할 데이터 범위를 줄인다', () => {
    const range = { start: 5, end: 15 };
    const result = applyChartZoomRange(points, range);
    expect(result.points.map((point) => point.label)).toEqual(['P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15']);
    expect(result.isZoomed).toBe(true);
  });

  it('범위를 사람이 읽는 라벨로 표시한다', () => {
    expect(formatChartZoomRange({ start: 4, end: 12 }, 20)).toBe('5–12 / 20');
  });
});
