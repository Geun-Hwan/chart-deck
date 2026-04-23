import { describe, expect, it } from 'vitest';
import { chartZoomLevels, formatChartZoomLevel, getNextChartZoomIndex } from './chartZoom';

describe('chartZoom', () => {
  it('줌 인은 다음 배율 인덱스로 이동한다', () => {
    expect(getNextChartZoomIndex(0, 'in')).toBe(1);
    expect(chartZoomLevels[getNextChartZoomIndex(0, 'in')]).toBe(1.25);
  });

  it('줌 아웃과 리셋은 기본 배율 아래로 내려가지 않는다', () => {
    expect(getNextChartZoomIndex(1, 'out')).toBe(0);
    expect(getNextChartZoomIndex(0, 'out')).toBe(0);
    expect(getNextChartZoomIndex(3, 'reset')).toBe(0);
  });

  it('최대 배율 이상으로 줌 인하지 않는다', () => {
    const lastIndex = chartZoomLevels.length - 1;
    expect(getNextChartZoomIndex(lastIndex, 'in')).toBe(lastIndex);
  });

  it('배율을 퍼센트 라벨로 표시한다', () => {
    expect(formatChartZoomLevel(1.25)).toBe('125%');
  });
});
