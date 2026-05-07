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
  const statusLabel = summary.readyChartCount > 0 ? '추천 가능' : '검토 필요';
  const helperText = summary.readyChartCount > 0
    ? '데이터 요약과 컬럼 구조를 함께 확인할 수 있습니다.'
    : '컬럼 구조를 먼저 확인하면 차트 선택이 쉬워집니다.';

  return (
    <section className="data-orbit" aria-label="데이터 요약">
      <div className="orbit-heading">
        <div>
          <p className="eyebrow">데이터 개요</p>
          <strong>{summary.dataHealthLabel}</strong>
          <p>{helperText}</p>
        </div>
        <span className="soft-badge">{statusLabel}</span>
      </div>

      <div className="orbit-metrics" aria-label="데이터 요약 수치">
        <Metric label="행" value={summary.rowCount.toLocaleString('ko-KR')} />
        <Metric label="컬럼" value={summary.columnCount.toLocaleString('ko-KR')} />
        <Metric label="추천" value={`${summary.readyChartCount}개`} />
        <Metric label="상태" value={statusLabel} />
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
