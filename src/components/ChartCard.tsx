import type { ChartCandidate, DataRow } from '../lib/dataTypes';
import { CandidateChart } from './charts/CandidateChart';

const statusLabels: Record<ChartCandidate['status'], string> = {
  ready: '실제 차트',
  warning: '경고 포함',
  placeholder: '더미 표시',
  error: '오류',
};

type Props = {
  candidate: ChartCandidate;
  rows: DataRow[];
};

export function ChartCard({ candidate, rows }: Props) {
  return (
    <article className={`chart-card status-${candidate.status}`}>
      <header>
        <div>
          <span className="status-pill">{statusLabels[candidate.status]}</span>
          <h3>{candidate.title}</h3>
        </div>
      </header>
      <p className="chart-reason">{candidate.reason}</p>
      <CandidateChart candidate={candidate} rows={rows} />
    </article>
  );
}
