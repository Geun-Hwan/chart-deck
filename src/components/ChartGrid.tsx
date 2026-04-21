import type { ChartCandidate, DataRow } from '../lib/dataTypes';
import { ChartCard } from './ChartCard';

type Props = {
  candidates: ChartCandidate[];
  rows: DataRow[];
};

export function ChartGrid({ candidates, rows }: Props) {
  if (candidates.length === 0) {
    return (
      <section className="panel empty-panel">
        <h2>차트 후보</h2>
        <p>데이터를 입력하면 여러 차트 후보가 표시됩니다.</p>
      </section>
    );
  }

  return (
    <section className="panel chart-section">
      <div className="section-heading">
        <p className="eyebrow">Charts</p>
        <h2>차트 후보</h2>
      </div>
      <div className="chart-grid">
        {candidates.map((candidate) => (
          <ChartCard key={candidate.id} candidate={candidate} rows={rows} />
        ))}
      </div>
    </section>
  );
}
