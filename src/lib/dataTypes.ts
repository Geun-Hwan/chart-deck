export type ColumnType = 'number' | 'category' | 'date' | 'unknown';

export type DataValue = string | number | null;

export type DataRow = Record<string, DataValue>;

export type ParsedData = {
  columns: string[];
  rows: DataRow[];
  delimiter: ',' | '\t';
};

export type ParseResult =
  | { ok: true; data: ParsedData; warnings: string[] }
  | { ok: false; error: string; warnings: string[] };

export type ColumnProfile = {
  name: string;
  type: ColumnType;
  nonEmptyCount: number;
  uniqueCount: number;
  confidence: number;
  examples: string[];
};

export type ChartStatus = 'ready' | 'warning' | 'placeholder' | 'error';

export type ChartType = 'bar' | 'line' | 'scatter' | 'pie' | 'area' | 'donut' | 'radar';
export type TimeGranularity = 'day' | 'month' | 'year';

export type ChartCandidate = {
  id: ChartType;
  title: string;
  status: ChartStatus;
  reason: string;
  xKey?: string;
  xAxisType?: ColumnType;
  yKey?: string;
  categoryKey?: string;
  valueKey?: string;
};
