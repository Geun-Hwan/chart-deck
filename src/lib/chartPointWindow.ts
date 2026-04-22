export type ChartPointWindowMode = 'all' | 'recent' | 'top';

export type ChartPointWindowOption = {
  mode: ChartPointWindowMode;
  label: string;
  note: string;
};

export type ChartPointWindowResult<T> = {
  points: T[];
  originalCount: number;
  mode: ChartPointWindowMode;
  isWindowed: boolean;
  note: string;
};

export const CHART_POINT_WINDOW_SIZE = 12;

export const chartPointWindowOptions: ChartPointWindowOption[] = [
  { mode: 'all', label: '전체 보기', note: '모든 지점을 표시합니다.' },
  { mode: 'recent', label: `최근 ${CHART_POINT_WINDOW_SIZE}개 확대`, note: `최근 ${CHART_POINT_WINDOW_SIZE}개 지점만 확대해 표시합니다.` },
  { mode: 'top', label: `상위 ${CHART_POINT_WINDOW_SIZE}개 필터`, note: `값이 큰 상위 ${CHART_POINT_WINDOW_SIZE}개 지점만 필터링해 표시합니다.` },
];

export function applyChartPointWindow<T extends { value: number }>(
  points: T[],
  mode: ChartPointWindowMode,
  windowSize = CHART_POINT_WINDOW_SIZE,
): ChartPointWindowResult<T> {
  if (mode === 'all' || points.length <= windowSize) {
    return {
      points,
      originalCount: points.length,
      mode: 'all',
      isWindowed: false,
      note: chartPointWindowOptions[0]!.note,
    };
  }

  if (mode === 'recent') {
    return {
      points: points.slice(-windowSize),
      originalCount: points.length,
      mode,
      isWindowed: true,
      note: optionNote(mode),
    };
  }

  return {
    points: [...points].sort((a, b) => b.value - a.value).slice(0, windowSize),
    originalCount: points.length,
    mode,
    isWindowed: true,
    note: optionNote(mode),
  };
}

function optionNote(mode: ChartPointWindowMode): string {
  return chartPointWindowOptions.find((option) => option.mode === mode)?.note ?? chartPointWindowOptions[0]!.note;
}
