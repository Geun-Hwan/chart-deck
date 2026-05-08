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
        <h2 id="empty-compass-title">데이터를 넣으면 차트를 바로 볼 수 있습니다</h2>
        <p>샘플, CSV 파일, 텍스트 붙여넣기 중 하나로 시작하세요.</p>
      </section>
    );
  }

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0];

  return (
    <section className="chart-compass" aria-labelledby="chart-compass-title">
      <div className="chart-tabs" role="tablist" aria-label="차트 종류 선택">
        {candidates.map((candidate) => {
          const isSelected = candidate.id === selected?.id;
          return (
            <button
              key={candidate.id}
              type="button"
              role="tab"
              className={`chart-tab status-${candidate.status} ${isSelected ? 'is-selected' : ''}`}
              aria-selected={isSelected}
              aria-controls="selected-chart-panel"
              id={`chart-tab-${candidate.id}`}
              onClick={() => onSelect(candidate.id)}
            >
              <span>{candidate.title}</span>
              {candidate.status === 'ready' ? null : <small>{statusText(candidate.status)}</small>}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div id="selected-chart-panel" className="compass-main" role="tabpanel" aria-labelledby={`chart-tab-${selected.id}`}>
          <h2 id="chart-compass-title" className="sr-only">선택한 차트</h2>
          <ChartCard candidate={selected} rows={rows} featured />
        </div>
      ) : null}
    </section>
  );
}

function statusText(status: ChartCandidate['status']): string {
  if (status === 'ready') return '바로 보기';
  if (status === 'warning') return '대체 기준';
  if (status === 'placeholder') return '데이터 부족';
  return '오류';
}
