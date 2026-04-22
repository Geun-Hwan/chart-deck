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
        <h2 id="empty-compass-title">아직 관측할 데이터가 없습니다</h2>
        <p>샘플 CSV를 띄우거나 내 데이터를 올리면, 가장 선명한 차트 궤도부터 중앙에 고정합니다.</p>
      </section>
    );
  }

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0];

  return (
    <section className="chart-compass" aria-labelledby="chart-compass-title">
      <div className="compass-header">
        <div>
          <p className="eyebrow">Chart Compass</p>
          <h2 id="chart-compass-title">어떤 궤도로 볼까요?</h2>
        </div>
        <p>주 시야를 먼저 고정하고, 아래 후보를 넘겨 관측 각도를 바꿉니다.</p>
      </div>

      {selected ? (
        <div className="compass-main">
          <aside className="recommendation-card">
            <span className="recommendation-label">주 관측 궤도</span>
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
