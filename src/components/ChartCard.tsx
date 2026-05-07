import type { ChartCandidate, DataRow } from '../lib/dataTypes';
import { CandidateChart } from './charts/CandidateChart';

const statusLabels: Record<ChartCandidate['status'], string> = {
  ready: '사용 가능',
  warning: '대체 기준',
  placeholder: '데이터 부족',
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
