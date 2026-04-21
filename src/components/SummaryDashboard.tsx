import type { DatasetSummary } from '../lib/datasetSummary';

const typeLabels = {
  number: '숫자',
  category: '범주',
  date: '날짜',
  unknown: '확인 필요',
};

type Props = {
  summary: DatasetSummary;
  sourceLabel: string;
};

export function SummaryDashboard({ summary, sourceLabel }: Props) {
  const visibleTypeCounts = Object.entries(summary.typeCounts).filter(([, count]) => count > 0);

  return (
    <section className="data-orbit" aria-label="데이터 요약">
      <div className="orbit-center">
        <span>2</span>
        <strong>{summary.dataHealthLabel}</strong>
        <p>{sourceLabel}</p>
      </div>
      <Metric label="행" value={summary.rowCount.toLocaleString('ko-KR')} />
      <Metric label="컬럼" value={summary.columnCount.toLocaleString('ko-KR')} />
      <Metric label="추천" value={`${summary.readyChartCount}개`} />
      <div className="orbit-types">
        {visibleTypeCounts.length > 0 ? (
          visibleTypeCounts.map(([type, count]) => <span key={type}>{typeLabels[type as keyof typeof typeLabels]} {count}</span>)
        ) : (
          <span>CSV를 기다리는 중</span>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="orbit-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
