import type { ColumnProfile, ColumnType, DataRow, DataValue } from './dataTypes';

function isEmpty(value: DataValue): boolean {
  return value === null || value === '';
}

function toText(value: DataValue): string {
  return value === null ? '' : String(value);
}

function isDateLike(value: string): boolean {
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(value) || /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(value)) {
    return !Number.isNaN(Date.parse(value));
  }
  return false;
}

function classify(values: DataValue[]): { type: ColumnType; confidence: number } {
  const nonEmpty = values.filter((value) => !isEmpty(value));
  if (nonEmpty.length === 0) return { type: 'unknown', confidence: 0 };

  const numberCount = nonEmpty.filter((value) => typeof value === 'number' && Number.isFinite(value)).length;
  const dateCount = nonEmpty.filter((value) => typeof value === 'string' && isDateLike(value)).length;
  const uniqueCount = new Set(nonEmpty.map(toText)).size;
  const numberRatio = numberCount / nonEmpty.length;
  const dateRatio = dateCount / nonEmpty.length;

  if (numberRatio >= 0.8) return { type: 'number', confidence: numberRatio };
  if (dateRatio >= 0.8) return { type: 'date', confidence: dateRatio };
  const uniqueRatio = uniqueCount / Math.max(nonEmpty.length, 1);
  if (uniqueRatio <= 0.7) {
    return { type: 'category', confidence: Math.max(0.55, 1 - uniqueRatio) };
  }
  return { type: 'unknown', confidence: 0.4 };
}

export function inferColumnTypes(columns: string[], rows: DataRow[]): ColumnProfile[] {
  return columns.map((column) => {
    const values = rows.map((row) => row[column]);
    const nonEmptyValues = values.filter((value) => !isEmpty(value));
    const { type, confidence } = classify(values);
    return {
      name: column,
      type,
      nonEmptyCount: nonEmptyValues.length,
      uniqueCount: new Set(nonEmptyValues.map(toText)).size,
      confidence,
      examples: nonEmptyValues.slice(0, 3).map(toText),
    };
  });
}
