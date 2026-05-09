import type { DatasetSummary } from '../lib/datasetSummary';

const typeLabels = {
  number: '숫자',
  category: '범주',
  date: '날짜',
  unknown: '확인 필요',
};

type Props = {
  summary: DatasetSummary;
};

export function SummaryDashboard({ summary }: Props) {
  const visibleTypeCounts = Object.entries(summary.typeCounts).filter(([, count]) => count > 0);
  const helperText = summary.readyChartCount > 0
    ? '필요한 정보만 요약합니다.'
    : '컬럼 타입을 확인한 뒤 차트 후보를 다시 볼 수 있습니다.';

  return (
    <section className="data-orbit" aria-label="데이터 요약">
      <div className="orbit-heading">
        <div>
          <p className="eyebrow">데이터 요약</p>
          <strong>{summary.rowCount.toLocaleString('ko-KR')}행 · {summary.columnCount.toLocaleString('ko-KR')}컬럼</strong>
          <p>{helperText}</p>
        </div>
      </div>

      <div className="orbit-metrics" aria-label="데이터 요약 수치">
        <Metric label="행" value={summary.rowCount.toLocaleString('ko-KR')} />
        <Metric label="컬럼" value={summary.columnCount.toLocaleString('ko-KR')} />
        <Metric label="숫자 컬럼" value={`${summary.typeCounts.number}개`} />
        <Metric label="날짜 컬럼" value={`${summary.typeCounts.date}개`} />
      </div>

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
