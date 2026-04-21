import type { ChartStatus } from '../lib/dataTypes';

const labelByStatus: Record<ChartStatus, string> = {
  ready: '준비됨',
  warning: '경고',
  placeholder: '더미',
  error: '오류',
};

type Props = {
  status: ChartStatus;
  reason: string;
};

export function WarningPlaceholder({ status, reason }: Props) {
  return (
    <div className={`warning-placeholder status-${status}`}>
      <div className="dummy-chart" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <strong>{labelByStatus[status]}</strong>
      <p>{reason}</p>
    </div>
  );
}
