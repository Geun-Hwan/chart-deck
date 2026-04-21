import type { ChartCandidate, DataRow } from '../lib/dataTypes';
import { CandidateChart } from './charts/CandidateChart';

const statusLabels: Record<ChartCandidate['status'], string> = {
  ready: '실제 차트',
  warning: '확인 필요',
  placeholder: '더미 표시',
  error: '오류',
};

type Props = {
  candidate: ChartCandidate;
  rows: DataRow[];
  featured?: boolean;
};

export function ChartCard({ candidate, rows, featured = false }: Props) {
  return (
    <article className={`chart-card status-${candidate.status} ${featured ? 'featured' : ''}`}>
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
