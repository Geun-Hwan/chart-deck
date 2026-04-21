import { describe, expect, it } from 'vitest';
import { buildChartCandidates, sortChartCandidates } from './chartCandidates';
import type { ChartCandidate, ColumnProfile } from './dataTypes';

const profiles: ColumnProfile[] = [
  { name: 'month', type: 'date', nonEmptyCount: 3, uniqueCount: 3, confidence: 1, examples: ['2026-01-01'] },
  { name: 'category', type: 'category', nonEmptyCount: 3, uniqueCount: 2, confidence: 0.8, examples: ['A'] },
  { name: 'value', type: 'number', nonEmptyCount: 3, uniqueCount: 3, confidence: 1, examples: ['10'] },
  { name: 'visitors', type: 'number', nonEmptyCount: 3, uniqueCount: 3, confidence: 1, examples: ['100'] },
];

describe('chartCandidates', () => {
  it('기본 차트 후보를 생성한다', () => {
    const candidates = buildChartCandidates(profiles);
    expect(candidates).toHaveLength(5);
    expect(candidates.find((candidate) => candidate.id === 'bar')?.status).toBe('ready');
    expect(candidates.find((candidate) => candidate.id === 'line')?.status).toBe('ready');
    expect(candidates.find((candidate) => candidate.id === 'scatter')?.status).toBe('ready');
  });

  it('부적합한 후보는 placeholder로 표시한다', () => {
    const candidates = buildChartCandidates([profiles[1]!]);
    expect(candidates.some((candidate) => candidate.status === 'placeholder')).toBe(true);
  });

  it('상태 순서대로 후보를 정렬한다', () => {
    const unsorted: ChartCandidate[] = [
      { id: 'bar', title: '막대', status: 'error', reason: '오류' },
      { id: 'line', title: '선', status: 'ready', reason: '가능' },
      { id: 'pie', title: '파이', status: 'placeholder', reason: '더미' },
      { id: 'area', title: '영역', status: 'warning', reason: '경고' },
    ];
    expect(sortChartCandidates(unsorted).map((candidate) => candidate.status)).toEqual(['ready', 'warning', 'placeholder', 'error']);
  });
});
