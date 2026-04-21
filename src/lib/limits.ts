export const MAX_INPUT_BYTES = 1024 * 1024;
export const MAX_ROWS = 5000;

export type LimitResult =
  | { ok: true }
  | { ok: false; reason: string };

export function checkTextSizeLimit(text: string): LimitResult {
  const bytes = new TextEncoder().encode(text).length;
  if (bytes > MAX_INPUT_BYTES) {
    return {
      ok: false,
      reason: `입력 데이터가 ${formatBytes(MAX_INPUT_BYTES)} 제한을 초과했습니다.`,
    };
  }
  return { ok: true };
}

export function checkRowLimit(rowCount: number): LimitResult {
  if (rowCount > MAX_ROWS) {
    return {
      ok: false,
      reason: `행 수가 ${MAX_ROWS.toLocaleString('ko-KR')}행 제한을 초과했습니다.`,
    };
  }
  return { ok: true };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${Math.round(bytes / 1024 / 1024)}MB`;
}
