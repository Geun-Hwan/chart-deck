import { describe, expect, it } from 'vitest';
import { applyChartZoomWindow, chartZoomLevels, formatChartZoomLevel, getNextChartZoomIndex, getVisiblePointCount } from './chartZoom';

const points = Array.from({ length: 20 }, (_, index) => ({ label: `P${index + 1}`, value: index + 1 }));

describe('chartZoom', () => {
  it('휠 줌 인은 다음 데이터 범위 인덱스로 이동한다', () => {
    expect(getNextChartZoomIndex(0, 'in')).toBe(1);
    expect(chartZoomLevels[getNextChartZoomIndex(0, 'in')]?.label).toBe('75%');
  });

  it('줌 아웃과 리셋은 전체 범위 아래로 내려가지 않는다', () => {
    expect(getNextChartZoomIndex(1, 'out')).toBe(0);
    expect(getNextChartZoomIndex(0, 'out')).toBe(0);
    expect(getNextChartZoomIndex(3, 'reset')).toBe(0);
  });

  it('최대 줌 이상으로 줌 인하지 않는다', () => {
    const lastIndex = chartZoomLevels.length - 1;
    expect(getNextChartZoomIndex(lastIndex, 'in')).toBe(lastIndex);
  });

  it('줌 비율에 따라 최근 데이터 표시 개수를 계산한다', () => {
    expect(getVisiblePointCount(20, 0)).toBe(20);
    expect(getVisiblePointCount(20, 1)).toBe(15);
    expect(getVisiblePointCount(20, 2)).toBe(10);
    expect(getVisiblePointCount(20, 3)).toBe(5);
  });

  it('휠 줌은 차트 크기가 아니라 표시할 데이터 범위를 줄인다', () => {
    const result = applyChartZoomWindow(points, 2);
    expect(result.points.map((point) => point.label)).toEqual(['P11', 'P12', 'P13', 'P14', 'P15', 'P16', 'P17', 'P18', 'P19', 'P20']);
    expect(result.isZoomed).toBe(true);
  });

  it('배율 라벨을 사람이 읽는 텍스트로 표시한다', () => {
    expect(formatChartZoomLevel(chartZoomLevels[1]!)).toBe('75%');
  });
});
