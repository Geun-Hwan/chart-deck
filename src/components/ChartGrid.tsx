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
        <h2 id="empty-compass-title">아직 차트를 고를 데이터가 없습니다</h2>
        <p>왼쪽에서 샘플 CSV를 누르거나 내 CSV 파일을 열면, 여기서 가장 어울리는 차트를 먼저 보여드립니다.</p>
      </section>
    );
  }

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0];

  return (
    <section className="chart-compass" aria-labelledby="chart-compass-title">
      <div className="compass-header">
        <div>
          <p className="eyebrow">Chart Compass</p>
          <h2 id="chart-compass-title">이 데이터로 무엇을 볼까요?</h2>
        </div>
        <p>추천을 먼저 보고, 아래 후보를 눌러 관점을 바꿔보세요.</p>
      </div>

      {selected ? (
        <div className="compass-main">
          <aside className="recommendation-card">
            <span className="recommendation-label">지금 가장 먼저 볼 차트</span>
            <h3>{selected.title}</h3>
            <p>{selected.reason}</p>
          </aside>
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
    </section>
  );
}

function statusText(status: ChartCandidate['status']): string {
  if (status === 'ready') return '바로 보기';
  if (status === 'warning') return '확인 필요';
  if (status === 'placeholder') return '조건 부족';
  return '오류';
}
