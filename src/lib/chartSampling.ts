export type ChartPointLike = {
  label: string;
  value: number;
};

export type SamplingResult<T extends ChartPointLike> = {
  points: T[];
  originalCount: number;
  sampledCount: number;
  isSampled: boolean;
};

export const MAX_RENDERED_CHART_POINTS = 36;

export function sampleChartPoints<T extends ChartPointLike>(points: T[], maxPoints = MAX_RENDERED_CHART_POINTS): SamplingResult<T> {
  if (points.length <= maxPoints) {
    return {
      points,
      originalCount: points.length,
      sampledCount: points.length,
      isSampled: false,
    };
  }

  const lastIndex = points.length - 1;
  const sampled = Array.from({ length: maxPoints }, (_, index) => {
    const sourceIndex = Math.round((index / (maxPoints - 1)) * lastIndex);
    return points[sourceIndex]!;
  });

  return {
    points: sampled,
    originalCount: points.length,
    sampledCount: sampled.length,
    isSampled: true,
  };
}
