import { describe, expect, it } from 'vitest';
import { summarizeDataset } from './datasetSummary';
import type { ChartCandidate, ColumnProfile, DataRow } from './dataTypes';

const rows: DataRow[] = [{ category: 'A', value: 10 }];
const profiles: ColumnProfile[] = [
  { name: 'category', type: 'category', nonEmptyCount: 1, uniqueCount: 1, confidence: 1, examples: ['A'] },
  { name: 'value', type: 'number', nonEmptyCount: 1, uniqueCount: 1, confidence: 1, examples: ['10'] },
];
const candidates: ChartCandidate[] = [
  { id: 'bar', title: '막대', status: 'ready', reason: '가능' },
  { id: 'line', title: '선', status: 'warning', reason: '확인 필요' },
  { id: 'scatter', title: '산점도', status: 'placeholder', reason: '부족' },
];

describe('summarizeDataset', () => {
  it('데이터와 차트 후보 상태를 요약한다', () => {
    const summary = summarizeDataset(rows, profiles, candidates);
    expect(summary.rowCount).toBe(1);
    expect(summary.columnCount).toBe(2);
    expect(summary.typeCounts.number).toBe(1);
    expect(summary.chartStatusCounts.ready).toBe(1);
    expect(summary.dataHealthLabel).toBe('준비 완료');
  });

  it('데이터가 없으면 입력 대기 상태를 반환한다', () => {
    const summary = summarizeDataset([], [], []);
    expect(summary.dataHealthLabel).toBe('입력 대기');
  });

  it('unknown 컬럼이 있으면 확인 필요 상태를 반환한다', () => {
    const summary = summarizeDataset(rows, [
      ...profiles,
      { name: 'memo', type: 'unknown', nonEmptyCount: 1, uniqueCount: 1, confidence: 0.2, examples: ['?'] },
    ], candidates);
    expect(summary.dataHealthLabel).toBe('확인 필요');
  });

  it('ready 차트가 없으면 확인 필요 상태를 반환한다', () => {
    const summary = summarizeDataset(rows, profiles, [
      { id: 'bar', title: '막대', status: 'placeholder', reason: '부족' },
    ]);
    expect(summary.readyChartCount).toBe(0);
    expect(summary.dataHealthLabel).toBe('확인 필요');
  });

});
