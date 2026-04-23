export type ChartZoomAction = 'in' | 'out' | 'reset';

export type ChartZoomLevel = {
  ratio: number;
  label: string;
};

export const chartZoomLevels: ChartZoomLevel[] = [
  { ratio: 1, label: '전체' },
  { ratio: 0.75, label: '75%' },
  { ratio: 0.5, label: '50%' },
  { ratio: 0.25, label: '25%' },
];

export function getNextChartZoomIndex(currentIndex: number, action: ChartZoomAction): number {
  if (action === 'reset') return 0;

  const lastIndex = chartZoomLevels.length - 1;
  const nextIndex = action === 'in' ? currentIndex + 1 : currentIndex - 1;
  return Math.min(Math.max(nextIndex, 0), lastIndex);
}

export function getVisiblePointCount(totalCount: number, zoomIndex: number, minimumCount = 5): number {
  const level = chartZoomLevels[zoomIndex] ?? chartZoomLevels[0]!;
  if (totalCount <= minimumCount || level.ratio >= 1) return totalCount;
  return Math.min(totalCount, Math.max(minimumCount, Math.round(totalCount * level.ratio)));
}

export function applyChartZoomWindow<T>(points: T[], zoomIndex: number): { points: T[]; originalCount: number; visibleCount: number; isZoomed: boolean } {
  const visibleCount = getVisiblePointCount(points.length, zoomIndex);
  return {
    points: points.slice(-visibleCount),
    originalCount: points.length,
    visibleCount,
    isZoomed: visibleCount < points.length,
  };
}

export function formatChartZoomLevel(level: ChartZoomLevel | number): string {
  if (typeof level === 'number') return `${Math.round(level * 100)}%`;
  return level.label;
}
