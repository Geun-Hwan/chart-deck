import type { ChartCandidate, ChartStatus, DataRow } from '../lib/dataTypes';
import { ChartCard } from './ChartCard';

type Filter = 'all' | ChartStatus;

type Props = {
  candidates: ChartCandidate[];
  rows: DataRow[];
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
};

const filterOptions: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'ready', label: '추천' },
  { value: 'warning', label: '확인 필요' },
  { value: 'placeholder', label: '조건 부족' },
];

export function ChartGrid({ candidates, rows, filter, onFilterChange }: Props) {
  if (candidates.length === 0) {
    return (
      <section className="panel empty-panel">
        <h2>아직 차트가 없습니다</h2>
        <p>왼쪽에서 CSV 샘플을 선택하거나 파일을 넣으면 추천 차트를 먼저 보여드립니다.</p>
      </section>
    );
  }

  const spotlight = candidates.find((candidate) => candidate.status === 'ready') ?? candidates[0];
  const filteredSource = candidates.filter((candidate) => candidate.id !== spotlight?.id);
  const filtered = filter === 'all' ? filteredSource : filteredSource.filter((candidate) => candidate.status === filter);

  return (
    <section className="panel chart-section">
      <div className="chart-toolbar">
        <div>
          <p className="eyebrow">Step 3</p>
          <h2>차트 탐색</h2>
          <p className="hint">먼저 가장 적합한 차트를 크게 보고, 필요하면 후보를 필터링하세요.</p>
        </div>
        <div className="filter-tabs" aria-label="차트 상태 필터">
          {filterOptions.map((option) => (
            <button key={option.value} type="button" className={filter === option.value ? 'active' : ''} aria-pressed={filter === option.value} onClick={() => onFilterChange(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {spotlight ? (
        <div className="spotlight-chart">
          <div className="spotlight-copy">
            <span className="soft-badge">추천 먼저 보기</span>
            <h3>{spotlight.title}</h3>
            <p>{spotlight.reason}</p>
          </div>
          <ChartCard candidate={spotlight} rows={rows} featured />
        </div>
      ) : null}

      <div className="alternative-heading">
        <h3>대안 차트</h3>
        <p>{filtered.length > 0 ? '추천 외 후보를 가볍게 비교하세요.' : '현재 필터에 맞는 대안 차트가 없습니다.'}</p>
      </div>
      <div className="chart-grid compact-chart-grid">
        {filtered.map((candidate) => (
          <ChartCard key={candidate.id} candidate={candidate} rows={rows} />
        ))}
      </div>
    </section>
  );
}
