import type { ChartCandidate, ChartStatus, ColumnProfile, ColumnType, DataRow } from './dataTypes';

export type DatasetSummary = {
  rowCount: number;
  columnCount: number;
  typeCounts: Record<ColumnType, number>;
  chartStatusCounts: Record<ChartStatus, number>;
  readyChartCount: number;
  dataHealthLabel: '준비 완료' | '확인 필요' | '입력 대기';
};

const emptyTypeCounts: Record<ColumnType, number> = {
  number: 0,
  category: 0,
  date: 0,
  unknown: 0,
};

const emptyStatusCounts: Record<ChartStatus, number> = {
  ready: 0,
  warning: 0,
  placeholder: 0,
  error: 0,
};

export function summarizeDataset(rows: DataRow[], profiles: ColumnProfile[], candidates: ChartCandidate[]): DatasetSummary {
  const typeCounts = { ...emptyTypeCounts };
  const chartStatusCounts = { ...emptyStatusCounts };

  profiles.forEach((profile) => {
    typeCounts[profile.type] += 1;
  });

  candidates.forEach((candidate) => {
    chartStatusCounts[candidate.status] += 1;
  });

  const readyChartCount = chartStatusCounts.ready;
  const hasData = rows.length > 0 && profiles.length > 0;
  const dataHealthLabel = !hasData ? '입력 대기' : readyChartCount > 0 && typeCounts.unknown === 0 ? '준비 완료' : '확인 필요';

  return {
    rowCount: rows.length,
    columnCount: profiles.length,
    typeCounts,
    chartStatusCounts,
    readyChartCount,
    dataHealthLabel,
  };
}
