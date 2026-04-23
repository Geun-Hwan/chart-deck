export type ChartZoomDirection = 'in' | 'out';

export type ChartZoomRange = {
  start: number;
  end: number;
};

export const MIN_ZOOM_POINT_COUNT = 5;
const ZOOM_STEP_RATIO = 0.72;

export function getDefaultChartZoomRange(totalCount: number): ChartZoomRange {
  return { start: 0, end: Math.max(0, totalCount) };
}

export function clampChartZoomRange(range: ChartZoomRange, totalCount: number, minimumCount = MIN_ZOOM_POINT_COUNT): ChartZoomRange {
  const safeTotal = Math.max(0, totalCount);
  if (safeTotal === 0) return { start: 0, end: 0 };

  const safeMinimum = Math.min(safeTotal, minimumCount);
  const requestedSize = Math.max(safeMinimum, Math.min(safeTotal, range.end - range.start));
  const start = Math.max(0, Math.min(safeTotal - requestedSize, range.start));
  return { start, end: start + requestedSize };
}

export function getNextChartZoomRange(
  range: ChartZoomRange,
  totalCount: number,
  direction: ChartZoomDirection,
  anchorRatio = 0.5,
  minimumCount = MIN_ZOOM_POINT_COUNT,
): ChartZoomRange {
  const current = clampChartZoomRange(range, totalCount, minimumCount);
  const currentSize = current.end - current.start;
  if (currentSize <= 0) return current;

  const targetSize =
    direction === 'in'
      ? Math.max(Math.min(totalCount, minimumCount), Math.round(currentSize * ZOOM_STEP_RATIO))
      : Math.min(totalCount, Math.round(currentSize / ZOOM_STEP_RATIO));

  if (direction === 'out' && targetSize >= totalCount - 1) return getDefaultChartZoomRange(totalCount);
  if (targetSize === currentSize) return current;

  const safeAnchorRatio = Math.max(0, Math.min(1, anchorRatio));
  const anchorIndex = current.start + (currentSize - 1) * safeAnchorRatio;
  const targetStart = Math.round(anchorIndex - (targetSize - 1) * safeAnchorRatio);

  return clampChartZoomRange({ start: targetStart, end: targetStart + targetSize }, totalCount, minimumCount);
}

export function applyChartZoomRange<T>(points: T[], range: ChartZoomRange): { points: T[]; originalCount: number; range: ChartZoomRange; isZoomed: boolean } {
  const safeRange = clampChartZoomRange(range, points.length);
  return {
    points: points.slice(safeRange.start, safeRange.end),
    originalCount: points.length,
    range: safeRange,
    isZoomed: safeRange.start > 0 || safeRange.end < points.length,
  };
}

export function formatChartZoomRange(range: ChartZoomRange, totalCount: number): string {
  if (totalCount === 0) return '0 / 0';
  const safeRange = clampChartZoomRange(range, totalCount);
  if (safeRange.start === 0 && safeRange.end === totalCount) return `전체 ${totalCount.toLocaleString('ko-KR')}개`;
  return `${(safeRange.start + 1).toLocaleString('ko-KR')}–${safeRange.end.toLocaleString('ko-KR')} / ${totalCount.toLocaleString('ko-KR')}`;
}
