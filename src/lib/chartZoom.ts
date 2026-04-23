export type ChartZoomAction = 'in' | 'out' | 'reset';

export const chartZoomLevels = [1, 1.25, 1.5, 1.75, 2] as const;

export function getNextChartZoomIndex(currentIndex: number, action: ChartZoomAction): number {
  if (action === 'reset') return 0;

  const lastIndex = chartZoomLevels.length - 1;
  const nextIndex = action === 'in' ? currentIndex + 1 : currentIndex - 1;
  return Math.min(Math.max(nextIndex, 0), lastIndex);
}

export function formatChartZoomLevel(level: number): string {
  return `${Math.round(level * 100)}%`;
}
