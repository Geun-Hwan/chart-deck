import type { ChartStatus } from '../lib/dataTypes';

const labelByStatus: Record<ChartStatus, string> = {
  ready: '준비됨',
  warning: '확인 필요',
  placeholder: '조건 부족',
  error: '오류',
};

type Props = {
  status: ChartStatus;
  reason: string;
};

export function WarningPlaceholder({ status, reason }: Props) {
  return (
    <div className={`warning-placeholder status-${status}`}>
      <span className="placeholder-icon" aria-hidden="true">!</span>
      <strong>{labelByStatus[status]}</strong>
      <p>{reason}</p>
    </div>
  );
}
