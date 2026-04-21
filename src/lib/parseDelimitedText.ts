import type { DataRow, ParseResult } from './dataTypes';
import { checkRowLimit, checkTextSizeLimit } from './limits';

function detectDelimiter(line: string): ',' | '\t' {
  const tabCount = (line.match(/\t/g) ?? []).length;
  const commaCount = (line.match(/,/g) ?? []).length;
  return tabCount > commaCount ? '\t' : ',';
}

function splitSimpleLine(line: string, delimiter: ',' | '\t'): string[] {
  return line.split(delimiter).map((cell) => cell.trim());
}

function normalizeHeader(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((header, index) => {
    const fallback = `컬럼 ${index + 1}`;
    const base = header.trim() || fallback;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
}

function parseCell(value: string): string | number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const numeric = Number(trimmed.replace(/,/g, ''));
  if (trimmed !== '' && Number.isFinite(numeric) && /^[-+]?\d{1,3}(,?\d{3})*(\.\d+)?$|^[-+]?\d+(\.\d+)?$/.test(trimmed)) {
    return numeric;
  }
  return trimmed;
}

export function parseDelimitedText(text: string): ParseResult {
  const warnings: string[] = [];
  const sizeLimit = checkTextSizeLimit(text);
  if (!sizeLimit.ok) return { ok: false, error: sizeLimit.reason, warnings };

  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return {
      ok: false,
      error: '헤더와 최소 1개 이상의 데이터 행이 필요합니다.',
      warnings,
    };
  }

  const rowLimit = checkRowLimit(lines.length - 1);
  if (!rowLimit.ok) return { ok: false, error: rowLimit.reason, warnings };

  const firstLine = lines[0] ?? '';
  const delimiter = detectDelimiter(firstLine);
  if (lines.some((line) => line.includes('"'))) {
    warnings.push('따옴표가 포함된 복잡한 CSV는 MVP에서 제한적으로 처리됩니다.');
  }

  const columns = normalizeHeader(splitSimpleLine(firstLine, delimiter));
  if (columns.length < 2) {
    return {
      ok: false,
      error: '최소 2개 이상의 컬럼이 필요합니다.',
      warnings,
    };
  }

  const rows: DataRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitSimpleLine(line, delimiter);
    if (cells.length !== columns.length) {
      warnings.push('일부 행의 컬럼 수가 헤더와 달라 빈 값으로 보정했습니다.');
    }
    const row: DataRow = {};
    columns.forEach((column, index) => {
      row[column] = parseCell(cells[index] ?? '');
    });
    rows.push(row);
  }

  return { ok: true, data: { columns, rows, delimiter }, warnings: [...new Set(warnings)] };
}
