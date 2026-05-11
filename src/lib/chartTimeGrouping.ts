import type { TimeAggregationMethod, TimeGranularity } from './dataTypes';

export type TimeSeriesPoint = {
  label: string;
  x: number;
  value: number;
  sourceCount: number;
};

type GroupedPoint = TimeSeriesPoint & {
  sourceCount: number;
};

export function aggregateTimeSeriesPoints(
  points: TimeSeriesPoint[],
  granularity: TimeGranularity,
  method: TimeAggregationMethod = 'sum',
): TimeSeriesPoint[] {
  const grouped = new Map<string, GroupedPoint>();

  for (const point of points) {
    const bucket = toTimeBucket(point.label, granularity);
    if (!bucket) {
      grouped.set(`${point.label}-${point.x}`, { ...point, sourceCount: point.sourceCount ?? 1 });
      continue;
    }

    const current = grouped.get(bucket.key);
    if (!current) {
      grouped.set(bucket.key, {
        label: bucket.label,
        x: bucket.timestamp,
        value: point.value,
        sourceCount: point.sourceCount ?? 1,
      });
      continue;
    }

    current.value += point.value;
    current.sourceCount += point.sourceCount ?? 1;
  }

  return [...grouped.values()]
    .map((point) => ({
      ...point,
      value: method === 'average' ? point.value / point.sourceCount : point.value,
    }))
    .sort((left, right) => left.x - right.x);
}

function toTimeBucket(label: string, granularity: TimeGranularity) {
  const parsed = parseDateParts(label);
  if (!parsed) return null;

  if (granularity === 'year') {
    return {
      key: `${parsed.year}`,
      label: `${parsed.year}`,
      timestamp: Date.UTC(parsed.year, 0, 1),
    };
  }

  if (granularity === 'month') {
    const month = pad(parsed.month);
    return {
      key: `${parsed.year}-${month}`,
      label: `${parsed.year}-${month}`,
      timestamp: Date.UTC(parsed.year, parsed.month - 1, 1),
    };
  }

  const month = pad(parsed.month);
  const day = pad(parsed.day);
  return {
    key: `${parsed.year}-${month}-${day}`,
    label: `${parsed.year}-${month}-${day}`,
    timestamp: Date.UTC(parsed.year, parsed.month - 1, parsed.day),
  };
}

function parseDateParts(value: string) {
  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/u);
  if (isoMatch) {
    return {
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]),
      day: Number(isoMatch[3] ?? '1'),
    };
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  return {
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
