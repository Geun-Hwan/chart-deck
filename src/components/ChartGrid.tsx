import type { ChartCandidate, DataRow } from '../lib/dataTypes';
import { ChartCard } from './ChartCard';

type Props = {
  candidates: ChartCandidate[];
  rows: DataRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ChartGrid({ candidates, rows, selectedId, onSelect }: Props) {
  if (candidates.length === 0) {
    return (
      <section className="empty-compass" aria-labelledby="empty-compass-title">
        <span aria-hidden="true">?</span>
        <h2 id="empty-compass-title">차트를 보려면 데이터가 필요합니다</h2>
        <p>샘플 CSV를 선택하거나 내 CSV를 불러오면 큰 차트와 대안 후보를 바로 비교할 수 있습니다.</p>
      </section>
    );
  }

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0];

  return (
    <section className="chart-compass" aria-labelledby="chart-compass-title">
      <div className="compass-header">
        <div>
          <p className="eyebrow">Chart Compass</p>
          <h2 id="chart-compass-title">어떤 차트가 어울릴까요?</h2>
        </div>
        <p>선택한 차트를 넓게 확인하고, 아래 후보를 눌러 다른 표현도 비교해보세요.</p>
      </div>

      {selected ? (
        <div className="compass-main">
          <span className="featured-chart-label">선택한 차트</span>
          <ChartCard candidate={selected} rows={rows} featured />
        </div>
      ) : null}

      <div className="choice-strip" aria-label="차트 후보 선택">
        {candidates.map((candidate) => {
          const isSelected = candidate.id === selected?.id;
          return (
            <button
              key={candidate.id}
              type="button"
              className={`choice-chip status-${candidate.status} ${isSelected ? 'is-selected' : ''}`}
              aria-pressed={isSelected}
              aria-label={`${candidate.title} 선택 · ${statusText(candidate.status)}${isSelected ? ' · 현재 선택됨' : ''}`}
              onClick={() => onSelect(candidate.id)}
            >
              <span>{statusText(candidate.status)}</span>
              <strong>{candidate.title}</strong>
              {isSelected ? <em>현재 선택됨</em> : null}
            </button>
          );
        })}
      </div>
      <p className="choice-scroll-hint">후보가 잘리면 가로로 넘겨 다른 관점을 계속 확인하세요.</p>
    </section>
  );
}

function statusText(status: ChartCandidate['status']): string {
  if (status === 'ready') return '바로 보기';
  if (status === 'warning') return '확인 필요';
  if (status === 'placeholder') return '조건 부족';
  return '오류';
}
