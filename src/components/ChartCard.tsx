import { lazy, Suspense } from 'react';
import type { ChartCandidate, DataRow } from '../lib/dataTypes';

const CandidateChart = lazy(() => import('./charts/CandidateChart').then((module) => ({ default: module.CandidateChart })));

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
          {candidate.status === 'ready' ? null : <span className="status-pill">{statusLabels[candidate.status]}</span>}
          <h3>{candidate.title}</h3>
        </div>
      </header>
      <p className="chart-reason">{candidate.reason}</p>
      <Suspense fallback={<div className="chart-loading" role="status">차트를 준비하고 있습니다.</div>}>
        <CandidateChart candidate={candidate} rows={rows} />
      </Suspense>
    </article>
  );
}
