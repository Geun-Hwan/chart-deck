import { type WheelEvent, useEffect, useMemo, useState } from 'react';
import { aggregateTimeSeriesPoints } from '../../lib/chartTimeGrouping';
import { sampleChartPoints } from '../../lib/chartSampling';
import { applyChartZoomRange, formatChartZoomRange, getDefaultChartZoomRange, getNextChartZoomRange, type ChartZoomRange } from '../../lib/chartZoom';
import {
  CHART_POINT_WINDOW_SIZE,
  applyChartPointWindow,
  chartPointWindowOptions,
  type ChartPointWindowMode,
} from '../../lib/chartPointWindow';
import type { ChartCandidate, DataRow, DataValue, TimeGranularity } from '../../lib/dataTypes';
import { WarningPlaceholder } from '../WarningPlaceholder';

type Props = {
  candidate: ChartCandidate;
  rows: DataRow[];
};

type Point = {
  label: string;
  x: number;
  value: number;
};

const palette = ['#b6f24a', '#60a5fa', '#fb7185', '#fbbf24', '#a78bfa', '#34d399'];
const chartFrame = {
  width: 640,
  height: 320,
  left: 74,
  right: 28,
  top: 34,
  bottom: 82,
};

export function CandidateChart({ candidate, rows }: Props) {
  const [windowMode, setWindowMode] = useState<ChartPointWindowMode>('all');
  const [chartZoomRange, setChartZoomRange] = useState<ChartZoomRange | null>(null);
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>('day');
  const prepared = useMemo(
    () => preparePoints(candidate, rows, windowMode, timeGranularity),
    [candidate, rows, windowMode, timeGranularity],
  );

  useEffect(() => {
    setChartZoomRange(null);
  }, [candidate.id, rows, windowMode, timeGranularity]);

  useEffect(() => {
    setTimeGranularity('day');
  }, [candidate.id, candidate.xKey, candidate.yKey]);

  if (candidate.status === 'placeholder' || candidate.status === 'error') {
    return <WarningPlaceholder status={candidate.status} reason={candidate.reason} />;
  }

  const chart = renderChart(
    candidate,
    prepared.points,
    prepared,
    setWindowMode,
    timeGranularity,
    setTimeGranularity,
    chartZoomRange,
    setChartZoomRange,
  );
  if (candidate.status === 'warning') {
    return (
      <div className="chart-with-warning">
        <WarningPlaceholder status="warning" reason={candidate.reason} />
        {chart}
      </div>
    );
  }

  return chart;
}

function preparePoints(
  candidate: ChartCandidate,
  rows: DataRow[],
  windowMode: ChartPointWindowMode,
  timeGranularity: TimeGranularity,
) {
  const rawPoints = toPoints(candidate, rows, candidate.id === 'scatter');
  const timeGroupedPoints = shouldAggregateTimeSeriesPoints(candidate)
    ? aggregateTimeSeriesPoints(rawPoints, timeGranularity)
    : rawPoints;
  const allPoints = shouldAggregateCategoryPoints(candidate) ? aggregatePointsByLabel(timeGroupedPoints) : timeGroupedPoints;
  const windowed = applyChartPointWindow(allPoints, windowMode);

  return {
    points: windowed.points,
    allPointCount: windowed.originalCount,
    isWindowed: windowed.isWindowed,
    note: windowed.note,
    mode: windowed.mode,
  };
}

function renderChart(
  candidate: ChartCandidate,
  visiblePoints: Point[],
  prepared: ReturnType<typeof preparePoints>,
  onWindowModeChange: (mode: ChartPointWindowMode) => void,
  timeGranularity: TimeGranularity,
  onTimeGranularityChange: (granularity: TimeGranularity) => void,
  chartZoomRange: ChartZoomRange | null,
  onChartZoomRangeChange: (range: ChartZoomRange | null) => void,
) {
  const activeZoomRange = chartZoomRange ?? getDefaultChartZoomRange(visiblePoints.length);
  const zoomed = applyChartZoomRange(visiblePoints, activeZoomRange);
  const sampled = sampleChartPoints(zoomed.points);
  const points = sampled.points;

  if (points.length === 0) {
    return <WarningPlaceholder status="warning" reason="표시할 수 있는 숫자 값이 부족합니다." />;
  }

  const chart = (() => {
    switch (candidate.id) {
      case 'bar':
        return <BarSvg points={points} />;
      case 'line':
        return <LineSvg points={points} area={false} />;
      case 'area':
        return <LineSvg points={points} area />;
      case 'scatter':
        return <ScatterSvg points={points} />;
      case 'pie':
        return <PieSvg points={points} />;
    }
  })();

  return (
    <div className="chart-render-frame">
      {prepared.allPointCount > CHART_POINT_WINDOW_SIZE ? (
        <div className="chart-control-row">
          <ChartWindowToolbar activeMode={prepared.mode} onChange={onWindowModeChange} />
        </div>
      ) : null}
      {shouldAggregateTimeSeriesPoints(candidate) ? (
        <div className="chart-control-row">
          <TimeGranularityToolbar activeGranularity={timeGranularity} onChange={onTimeGranularityChange} />
        </div>
      ) : null}
      {prepared.isWindowed ? (
        <p className="chart-filter-note" data-testid="chart-filter-note">
          {prepared.allPointCount.toLocaleString('ko-KR')}개 중 {prepared.note}
        </p>
      ) : null}
      {sampled.isSampled ? (
        <p className="sampling-note" data-testid="sampling-note">
          {sampled.originalCount.toLocaleString('ko-KR')}개 중 {sampled.sampledCount.toLocaleString('ko-KR')}개 지점을 균등 샘플링해 표시합니다.
        </p>
      ) : null}
      <div
        className="chart-zoom-viewport"
        data-testid="chart-zoom-viewport"
        role="application"
        aria-label="마우스 휠로 차트 데이터 범위 확대 또는 축소"
        tabIndex={0}
        onWheel={(event) => handleChartWheel(event, activeZoomRange, visiblePoints.length, onChartZoomRangeChange)}
        onDoubleClick={() => onChartZoomRangeChange(null)}
      >
        <div className="chart-interaction-hint" data-testid="chart-zoom-label">
          <span>휠로 데이터 범위 확대/축소 · 더블클릭 초기화</span>
          <strong data-testid="chart-zoom-range">{formatChartZoomRange(zoomed.range, zoomed.originalCount)}</strong>
        </div>
        <div className="chart-zoom-surface" data-testid="chart-zoom-surface">
          {chart}
        </div>
      </div>
    </div>
  );
}

function handleChartWheel(
  event: WheelEvent<HTMLDivElement>,
  activeRange: ChartZoomRange,
  totalCount: number,
  onChange: (range: ChartZoomRange | null) => void,
) {
  if (Math.abs(event.deltaY) < 2 || totalCount <= 0) return;
  event.preventDefault();
  const bounds = event.currentTarget.getBoundingClientRect();
  const anchorRatio = bounds.width > 0 ? (event.clientX - bounds.left) / bounds.width : 0.5;
  const nextRange = getNextChartZoomRange(activeRange, totalCount, event.deltaY < 0 ? 'in' : 'out', anchorRatio);
  const isDefault = nextRange.start === 0 && nextRange.end === totalCount;
  onChange(isDefault ? null : nextRange);
}

function ChartWindowToolbar({
  activeMode,
  onChange,
}: {
  activeMode: ChartPointWindowMode;
  onChange: (mode: ChartPointWindowMode) => void;
}) {
  return (
    <div className="chart-window-toolbar" role="group" aria-label="차트 표시 범위">
      {chartPointWindowOptions.map((option) => (
        <button
          key={option.mode}
          type="button"
          className={activeMode === option.mode ? 'is-active' : ''}
          aria-pressed={activeMode === option.mode}
          onClick={() => onChange(option.mode)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function TimeGranularityToolbar({
  activeGranularity,
  onChange,
}: {
  activeGranularity: TimeGranularity;
  onChange: (granularity: TimeGranularity) => void;
}) {
  const options: Array<{ value: TimeGranularity; label: string }> = [
    { value: 'day', label: '일 기준' },
    { value: 'month', label: '월 기준' },
    { value: 'year', label: '년 기준' },
  ];

  return (
    <div className="chart-window-toolbar" role="group" aria-label="날짜 집계 단위">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={activeGranularity === option.value ? 'is-active' : ''}
          aria-pressed={activeGranularity === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function toPoints(candidate: ChartCandidate, rows: DataRow[], useNumericX = false): Point[] {
  const xKey = candidate.xKey ?? candidate.categoryKey;
  const yKey = candidate.yKey ?? candidate.valueKey;
  if (!yKey) return [];

  return rows
    .map((row, index) => {
      const value = toNumber(row[yKey]);
      if (value === null) return null;
      const xValue = useNumericX && xKey ? toNumber(row[xKey]) : null;
      if (useNumericX && xValue === null) return null;
      return {
        label: xKey ? String(row[xKey] ?? index + 1) : String(index + 1),
        x: xValue ?? index,
        value,
      };
    })
    .filter((point): point is Point => point !== null);
}

function shouldAggregateCategoryPoints(candidate: ChartCandidate): boolean {
  return Boolean(candidate.categoryKey && (candidate.id === 'bar' || candidate.id === 'pie'));
}

function shouldAggregateTimeSeriesPoints(candidate: ChartCandidate): boolean {
  return candidate.xAxisType === 'date' && Boolean(candidate.xKey && candidate.yKey);
}

function aggregatePointsByLabel(points: Point[]): Point[] {
  const totals = new Map<string, Point>();
  for (const point of points) {
    const current = totals.get(point.label);
    if (!current) {
      totals.set(point.label, { ...point });
      continue;
    }
    current.value += point.value;
  }
  return [...totals.values()];
}

function toNumber(value: DataValue): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function scale(value: number, min: number, max: number, outMin: number, outMax: number): number {
  if (max === min) return (outMin + outMax) / 2;
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

function bounds(points: Point[]) {
  const values = points.map((point) => point.value);
  return { min: Math.min(...values, 0), max: Math.max(...values, 1) };
}

function BarSvg({ points }: { points: Point[] }) {
  const { max } = bounds(points);
  const { width, height, left, right, top, bottom } = chartFrame;
  const baseY = height - bottom;
  const gap = 14;
  const barWidth = (width - left - right - gap * (points.length - 1)) / points.length;
  const ticks = buildYTicks(0, max);

  return (
    <svg className="native-chart" data-testid="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`막대 차트 시각화, ${points.length}개 지점`}>
      <Grid width={width} height={height} ticks={ticks} />
      <AxisLine x1={left} y1={baseY} x2={width - right} y2={baseY} />
      <YAxis ticks={ticks} />
      {points.map((point, index) => {
        const barHeight = scale(point.value, 0, max, 18, baseY - top);
        const x = left + index * (barWidth + gap);
        return (
          <g key={`${point.label}-${index}`}>
            <rect x={x} y={baseY - barHeight} width={barWidth} height={barHeight} rx="14" fill={palette[index % palette.length]} />
            {shouldShowLabel(index, points.length) ? <XAxisLabel x={x + barWidth / 2} y={height - 44} label={point.label} /> : null}
          </g>
        );
      })}
    </svg>
  );
}

function LineSvg({ points, area }: { points: Point[]; area: boolean }) {
  const { width, height, left, right, top, bottom } = chartFrame;
  const { min, max } = bounds(points);
  const ticks = buildYTicks(min, max);
  const coordinates = points.map((point, index) => ({
    x: scale(index, 0, Math.max(points.length - 1, 1), left, width - right),
    y: scale(point.value, min, max, height - bottom, top),
    label: point.label,
  }));
  const path = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${path} L ${coordinates.at(-1)?.x ?? left} ${height - bottom} L ${coordinates[0]?.x ?? left} ${height - bottom} Z`;

  return (
    <svg
      className="native-chart"
      data-testid="chart-svg"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${area ? '영역 차트' : '선 차트'} 시각화, ${points.length}개 지점`}
    >
      <Grid width={width} height={height} ticks={ticks} />
      <AxisLine x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} />
      <YAxis ticks={ticks} />
      {area ? <path d={areaPath} fill="rgba(96, 165, 250, 0.22)" /> : null}
      <path d={path} fill="none" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      {coordinates.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle cx={point.x} cy={point.y} r="7" fill="#b6f24a" stroke="#101827" strokeWidth="3" />
          {shouldShowLabel(index, coordinates.length) ? <XAxisLabel x={point.x} y={height - 44} label={point.label} /> : null}
        </g>
      ))}
    </svg>
  );
}

function ScatterSvg({ points }: { points: Point[] }) {
  const { width, height, left, right, top, bottom } = chartFrame;
  const { min, max } = bounds(points);
  const xValues = points.map((point) => point.x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const yTicks = buildYTicks(min, max);
  const xTickPoints = points.filter((_, index) => shouldShowLabel(index, points.length));
  return (
    <svg className="native-chart" data-testid="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`산점도 시각화, ${points.length}개 지점`}>
      <Grid width={width} height={height} ticks={yTicks} />
      <AxisLine x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} />
      <YAxis ticks={yTicks} />
      {points.map((point, index) => (
        <circle
          key={`${point.label}-${index}`}
          cx={scale(point.x, minX, maxX, left, width - right)}
          cy={scale(point.value, min, max, height - bottom, top)}
          r={10 + (index % 3) * 3}
          fill={palette[index % palette.length]}
          stroke="#101827"
          strokeWidth="3"
        />
      ))}
      {xTickPoints.map((point, index) => (
        <XAxisLabel
          key={`${point.label}-x-${index}`}
          x={scale(point.x, minX, maxX, left, width - right)}
          y={height - 44}
          label={point.label}
        />
      ))}
    </svg>
  );
}

function PieSvg({ points }: { points: Point[] }) {
  const width = 640;
  const height = 280;
  const total = points.reduce((sum, point) => sum + Math.max(point.value, 0), 0) || 1;
  let cursor = -90;

  return (
    <svg className="native-chart" data-testid="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`파이 차트 시각화, ${points.length}개 지점`}>
      <circle cx="180" cy="140" r="96" fill="#f8fafc" />
      {points.map((point, index) => {
        const angle = (Math.max(point.value, 0) / total) * 360;
        const path = arcPath(180, 140, 96, cursor, cursor + angle);
        cursor += angle;
        return <path key={`${point.label}-${index}`} d={path} fill={palette[index % palette.length]} stroke="#fff" strokeWidth="4" />;
      })}
      {points.slice(0, 5).map((point, index) => (
        <g key={`${point.label}-legend`}>
          <rect x="340" y={72 + index * 34} width="18" height="18" rx="5" fill={palette[index % palette.length]} />
          <text x="370" y={86 + index * 34}>{shortLabel(point.label)} · {Math.round((point.value / total) * 100)}%</text>
        </g>
      ))}
    </svg>
  );
}

function arcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polar(cx, cy, radius, endAngle);
  const end = polar(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, 'Z'].join(' ');
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function Grid({ width, height, ticks }: { width: number; height: number; ticks: number[] }) {
  const { left, right, top, bottom } = chartFrame;
  return (
    <g className="chart-grid-lines">
      {ticks.map((tick) => {
        const y = scale(tick, ticks.at(-1) ?? 0, ticks[0] ?? 1, height - bottom, top);
        return <line key={tick} x1={left} x2={width - right} y1={y} y2={y} />;
      })}
      <line className="chart-grid-axis" x1={left} x2={left} y1={top} y2={height - bottom} />
      <line className="chart-grid-axis" x1={left} x2={width - right} y1={height - bottom} y2={height - bottom} />
    </g>
  );
}

function YAxis({ ticks }: { ticks: number[] }) {
  const { left, top, bottom, height } = chartFrame;
  const topValue = ticks[0] ?? 0;
  const bottomValue = ticks.at(-1) ?? 0;

  return (
    <g aria-hidden="true">
      {ticks.map((tick) => {
        const y = scale(tick, bottomValue, topValue, height - bottom, top);
        return (
          <text key={tick} className="chart-axis-value" data-axis="y" x={left - 12} y={y + 4} textAnchor="end">
            {formatAxisValue(tick)}
          </text>
        );
      })}
    </g>
  );
}

function AxisLine({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line className="chart-grid-axis" x1={x1} y1={y1} x2={x2} y2={y2} aria-hidden="true" />;
}

function shouldShowLabel(index: number, total: number): boolean {
  if (total <= 14) return true;
  const step = Math.ceil(total / 6);
  return index === 0 || index === total - 1 || index % step === 0;
}

function XAxisLabel({ x, y, label }: { x: number; y: number; label: string }) {
  const lines = formatAxisLabel(label);
  return (
    <text className="chart-axis-label" data-axis="x" x={x} y={y} textAnchor="middle">
      {lines.map((line, index) => (
        <tspan key={`${label}-${line}-${index}`} x={x} dy={index === 0 ? 0 : 15}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function buildYTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    const pivot = max === 0 ? 1 : Math.abs(max) * 0.3;
    return [max + pivot, max + pivot / 2, max, Math.max(0, max - pivot / 2)];
  }

  return Array.from({ length: count }, (_, index) => {
    const ratio = index / (count - 1);
    return max - (max - min) * ratio;
  });
}

function formatAxisValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    notation: Math.abs(value) >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(value) >= 1000 ? 1 : 0,
  }).format(value);
}

function formatAxisLabel(label: string): string[] {
  const trimmed = label.trim();
  const dateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/u);
  if (dateMatch) {
    return [`${dateMatch[1]}-${dateMatch[2]}`, dateMatch[3]];
  }

  if (trimmed.length <= 8) {
    return [trimmed];
  }

  if (trimmed.length <= 14) {
    return [trimmed.slice(0, 7), trimmed.slice(7)];
  }

  return [trimmed.slice(0, 7), `${trimmed.slice(7, 13)}…`];
}

function shortLabel(label: string): string {
  const trimmed = label.trim();
  return trimmed.length > 15 ? `${trimmed.slice(0, 14)}…` : trimmed;
}
