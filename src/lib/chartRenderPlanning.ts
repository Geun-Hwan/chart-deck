export type ChartPointLike = {
  label: string;
  x: number;
  value: number;
};

export type ChartRenderNotice = {
  originalCount: number;
  renderedCount: number;
  reason: string;
};

export type ChartRenderPlan<T extends ChartPointLike> = {
  points: T[];
  notice: ChartRenderNotice | null;
};

const SERIES_RENDER_LIMIT = 900;
const BAR_RENDER_LIMIT = 600;
const SCATTER_RENDER_LIMIT = 900;
const RADAR_RENDER_LIMIT = 12;
const HORIZONTAL_BAR_LIMIT = 20;
const PROPORTION_LIMIT = 6;

export type RenderChartKind = 'line' | 'area' | 'bar' | 'horizontalBar' | 'scatter' | 'pie' | 'donut' | 'radar';

export function planChartRendering<T extends ChartPointLike>(kind: RenderChartKind, points: T[]): ChartRenderPlan<T> {
  if (kind === 'pie' || kind === 'donut') {
    return compactByValue(points, PROPORTION_LIMIT, '비중 차트는 주요 항목과 기타로 정리합니다.');
  }

  if (kind === 'radar') {
    return compactByValue(points, RADAR_RENDER_LIMIT, '레이더 차트는 비교 가능한 상위 항목만 표시합니다.');
  }

  if (kind === 'horizontalBar') {
    return compactByValue(points, HORIZONTAL_BAR_LIMIT, '가로 막대 차트는 상위 항목 중심으로 표시합니다.');
  }

  if (kind === 'line' || kind === 'area') {
    return preserveExtremes(points, SERIES_RENDER_LIMIT, '대량 시계열은 구간별 최솟값과 최댓값을 보존해 표시합니다.');
  }

  if (kind === 'scatter') {
    return preserveExtremes(points, SCATTER_RENDER_LIMIT, '대량 산점도는 분포를 볼 수 있도록 대표 지점으로 표시합니다.');
  }

  return preserveExtremes(points, BAR_RENDER_LIMIT, '대량 막대 차트는 흐름을 볼 수 있도록 대표 지점으로 표시합니다.');
}

function preserveExtremes<T extends ChartPointLike>(points: T[], maxPoints: number, reason: string): ChartRenderPlan<T> {
  if (points.length <= maxPoints) return { points, notice: null };
  if (maxPoints < 4) return { points: points.slice(0, maxPoints), notice: toNotice(points.length, maxPoints, reason) };

  const first = points[0]!;
  const last = points.at(-1)!;
  const bucketCount = Math.max(1, Math.floor((maxPoints - 2) / 2));
  const bucketSize = (points.length - 2) / bucketCount;
  const reduced: T[] = [first];

  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const start = 1 + Math.floor(bucket * bucketSize);
    const end = Math.min(points.length - 1, 1 + Math.floor((bucket + 1) * bucketSize));
    const slice = points.slice(start, end);
    if (slice.length === 0) continue;

    let minPoint = slice[0]!;
    let maxPoint = slice[0]!;
    for (const point of slice) {
      if (point.value < minPoint.value) minPoint = point;
      if (point.value > maxPoint.value) maxPoint = point;
    }

    if (minPoint.x <= maxPoint.x) {
      reduced.push(minPoint);
      if (maxPoint !== minPoint) reduced.push(maxPoint);
    } else {
      reduced.push(maxPoint);
      if (maxPoint !== minPoint) reduced.push(minPoint);
    }
  }

  if (reduced.at(-1) !== last) reduced.push(last);

  return {
    points: reduced.slice(0, maxPoints),
    notice: toNotice(points.length, Math.min(reduced.length, maxPoints), reason),
  };
}

function compactByValue<T extends ChartPointLike>(points: T[], limit: number, reason: string): ChartRenderPlan<T> {
  if (points.length <= limit) return { points, notice: null };

  const sorted = [...points].sort((left, right) => Math.max(right.value, 0) - Math.max(left.value, 0));
  const visible = sorted.slice(0, limit - 1);
  const otherValue = sorted.slice(limit - 1).reduce((sum, point) => sum + Math.max(point.value, 0), 0);
  const compacted = otherValue > 0
    ? [...visible, { ...visible[0]!, label: '기타', x: visible.length, value: otherValue }]
    : visible;

  return {
    points: compacted,
    notice: toNotice(points.length, compacted.length, reason),
  };
}

function toNotice(originalCount: number, renderedCount: number, reason: string): ChartRenderNotice {
  return { originalCount, renderedCount, reason };
}
