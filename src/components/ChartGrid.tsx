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
      <section className="empty-compass">
        <span>?</span>
        <h2>아직 차트를 고를 데이터가 없습니다</h2>
        <p>왼쪽에서 샘플 CSV를 누르거나 내 CSV 파일을 열면, 여기서 가장 어울리는 차트를 먼저 보여드립니다.</p>
      </section>
    );
  }

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0];
  const alternatives = candidates.filter((candidate) => candidate.id !== selected?.id);

  return (
    <section className="chart-compass">
      <div className="compass-header">
        <div>
          <p className="eyebrow">Chart Compass</p>
          <h2>이 데이터로 무엇을 볼까요?</h2>
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

      <div className="choice-strip" aria-label="대안 차트 선택">
        {alternatives.map((candidate) => (
          <button key={candidate.id} type="button" className={`choice-chip status-${candidate.status}`} onClick={() => onSelect(candidate.id)}>
            <span>{statusText(candidate.status)}</span>
            <strong>{candidate.title}</strong>
          </button>
        ))}
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
