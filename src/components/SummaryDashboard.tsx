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
    <section className="summary-dashboard" aria-label="데이터 요약">
      <div className="summary-primary">
        <span className="summary-kicker">현재 상태</span>
        <strong>{sourceLabel}</strong>
        <p>{summary.dataHealthLabel} · 데이터는 브라우저 안에서만 처리됩니다.</p>
      </div>
      <Metric label="행" value={summary.rowCount.toLocaleString('ko-KR')} />
      <Metric label="컬럼" value={summary.columnCount.toLocaleString('ko-KR')} />
      <Metric label="추천 가능" value={`${summary.readyChartCount}개`} />
      <div className="type-pills" aria-label="컬럼 타입 분포">
        {visibleTypeCounts.length > 0 ? (
          visibleTypeCounts.map(([type, count]) => (
            <span key={type}>{typeLabels[type as keyof typeof typeLabels]} {count}</span>
          ))
        ) : (
          <span>컬럼 분석 대기</span>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
