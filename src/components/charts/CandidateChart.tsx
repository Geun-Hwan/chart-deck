import { type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { aggregateTimeSeriesPoints } from '../../lib/chartTimeGrouping';
import { sampleChartPoints } from '../../lib/chartSampling';
import { applyChartZoomRange, formatChartZoomRange, getDefaultChartZoomRange, getNextChartZoomRange, type ChartZoomRange } from '../../lib/chartZoom';
import type { ChartCandidate, DataRow, DataValue, TimeAggregationMethod, TimeGroupingMode } from '../../lib/dataTypes';
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
  const [chartZoomRange, setChartZoomRange] = useState<ChartZoomRange | null>(null);
  const [timeGroupingMode, setTimeGroupingMode] = useState<TimeGroupingMode>('raw');
  const [timeAggregationMethod, setTimeAggregationMethod] = useState<TimeAggregationMethod>('sum');
  const [selectedValueKey, setSelectedValueKey] = useState<string | null>(candidate.yKey ?? candidate.valueKey ?? null);
  const [selectedDimensionKey, setSelectedDimensionKey] = useState<string | null>(candidate.xKey ?? candidate.categoryKey ?? null);
  const [wheelZoomEnabled, setWheelZoomEnabled] = useState(false);
  const [dragSelection, setDragSelection] = useState<{ startX: number; currentX: number } | null>(null);
  const numericColumns = useMemo(() => findNumericColumns(rows), [rows]);
  const dimensionColumns = useMemo(() => findDimensionColumns(rows, numericColumns), [numericColumns, rows]);
  const dateColumns = useMemo(() => findDateColumns(rows), [rows]);
  const effectiveCandidate = useMemo(
    () => withSelectedKeys(candidate, selectedValueKey, selectedDimensionKey, dateColumns),
    [candidate, dateColumns, selectedDimensionKey, selectedValueKey],
  );
  const prepared = useMemo(
    () => preparePoints(effectiveCandidate, rows, timeGroupingMode, timeAggregationMethod),
    [effectiveCandidate, rows, timeAggregationMethod, timeGroupingMode],
  );

  useEffect(() => {
    setChartZoomRange(null);
  }, [candidate.id, rows, timeAggregationMethod, timeGroupingMode, selectedDimensionKey, selectedValueKey]);

  useEffect(() => {
    setTimeGroupingMode('raw');
    setTimeAggregationMethod('sum');
    setSelectedValueKey(candidate.yKey ?? candidate.valueKey ?? null);
    setSelectedDimensionKey(candidate.xKey ?? candidate.categoryKey ?? null);
    setWheelZoomEnabled(false);
  }, [candidate.categoryKey, candidate.id, candidate.valueKey, candidate.xKey, candidate.yKey]);

  if (candidate.status === 'placeholder' || candidate.status === 'error') {
    return <WarningPlaceholder status={candidate.status} reason={candidate.reason} />;
  }

  const chart = renderChart(
    effectiveCandidate,
    prepared.points,
    numericColumns,
    selectedValueKey,
    setSelectedValueKey,
    dimensionColumns,
    selectedDimensionKey,
    setSelectedDimensionKey,
    timeGroupingMode,
    setTimeGroupingMode,
    timeAggregationMethod,
    setTimeAggregationMethod,
    wheelZoomEnabled,
    setWheelZoomEnabled,
    chartZoomRange,
    setChartZoomRange,
    dragSelection,
    setDragSelection,
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

type ChartViewportProps = {
  ariaLabel: string;
  activeZoomRange: ChartZoomRange;
  totalCount: number;
  dragSelection: { startX: number; currentX: number } | null;
  onDragSelectionChange: (selection: { startX: number; currentX: number } | null) => void;
  onZoomChange: (range: ChartZoomRange | null) => void;
  children: React.ReactNode;
};

function preparePoints(
  candidate: ChartCandidate,
  rows: DataRow[],
  timeGroupingMode: TimeGroupingMode,
  timeAggregationMethod: TimeAggregationMethod,
) {
  const rawPoints = toPoints(candidate, rows, candidate.id === 'scatter');
  const timeGroupedPoints = shouldAggregateTimeSeriesPoints(candidate) && timeGroupingMode !== 'raw'
    ? aggregateTimeSeriesPoints(rawPoints, timeGroupingMode, timeAggregationMethod)
    : rawPoints;
  const categoryGroupedPoints = shouldAggregateCategoryPoints(candidate) ? aggregatePointsByLabel(timeGroupedPoints) : timeGroupedPoints;
  const allPoints = shouldCompactProportionPoints(candidate) ? compactProportionPoints(categoryGroupedPoints) : categoryGroupedPoints;

  return {
    points: allPoints,
  };
}

function renderChart(
  candidate: ChartCandidate,
  visiblePoints: Point[],
  numericColumns: string[],
  selectedValueKey: string | null,
  onSelectedValueKeyChange: (key: string) => void,
  dimensionColumns: string[],
  selectedDimensionKey: string | null,
  onSelectedDimensionKeyChange: (key: string) => void,
  timeGroupingMode: TimeGroupingMode,
  onTimeGroupingModeChange: (mode: TimeGroupingMode) => void,
  timeAggregationMethod: TimeAggregationMethod,
  onTimeAggregationMethodChange: (method: TimeAggregationMethod) => void,
  wheelZoomEnabled: boolean,
  onWheelZoomEnabledChange: (enabled: boolean) => void,
  chartZoomRange: ChartZoomRange | null,
  onChartZoomRangeChange: (range: ChartZoomRange | null) => void,
  dragSelection: { startX: number; currentX: number } | null,
  onDragSelectionChange: (selection: { startX: number; currentX: number } | null) => void,
) {
  const zoomEnabled = shouldEnableRangeZoom(candidate);
  const activeZoomRange = chartZoomRange ?? getDefaultChartZoomRange(visiblePoints.length);
  const zoomed = zoomEnabled ? applyChartZoomRange(visiblePoints, activeZoomRange) : {
    points: visiblePoints,
    range: getDefaultChartZoomRange(visiblePoints.length),
    originalCount: visiblePoints.length,
  };
  const sampled = zoomEnabled ? sampleChartPoints(zoomed.points) : { points: zoomed.points, isSampled: false, originalCount: zoomed.points.length, sampledCount: zoomed.points.length };
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
        return <PieSvg points={points} donut={false} />;
      case 'donut':
        return <PieSvg points={points} donut />;
      case 'radar':
        return <RadarSvg points={points} />;
    }
  })();

  return (
    <div className="chart-render-frame">
      {shouldShowChartSettings(candidate, numericColumns, dimensionColumns) ? (
        <ChartSettingsPanel>
          {shouldShowDimensionPicker(candidate, dimensionColumns) ? (
            <DimensionKeyPicker
              dimensionColumns={dimensionColumns}
              selectedDimensionKey={selectedDimensionKey}
              onChange={onSelectedDimensionKeyChange}
            />
          ) : null}
          {shouldShowValueKeyPicker(candidate, numericColumns) ? (
            <ValueKeyPicker
              numericColumns={numericColumns}
              selectedValueKey={selectedValueKey}
              onChange={onSelectedValueKeyChange}
            />
          ) : null}
          {shouldAggregateTimeSeriesPoints(candidate) ? (
            <TimeGroupingToolbar
              activeMode={timeGroupingMode}
              activeMethod={timeAggregationMethod}
              onModeChange={onTimeGroupingModeChange}
              onMethodChange={onTimeAggregationMethodChange}
            />
          ) : null}
        </ChartSettingsPanel>
      ) : null}
      {sampled.isSampled ? (
        <p className="sampling-note" data-testid="sampling-note">
          {sampled.originalCount.toLocaleString('ko-KR')}개 중 {sampled.sampledCount.toLocaleString('ko-KR')}개 지점을 균등 샘플링해 표시합니다.
        </p>
      ) : null}
      {zoomEnabled ? (
        <ChartViewport
          ariaLabel="드래그로 차트 데이터 범위를 자세히 보기"
          activeZoomRange={activeZoomRange}
          totalCount={visiblePoints.length}
          dragSelection={dragSelection}
          onDragSelectionChange={onDragSelectionChange}
          onZoomChange={onChartZoomRangeChange}
          wheelZoomEnabled={wheelZoomEnabled}
        >
          <div className="chart-interaction-hint" data-testid="chart-zoom-label">
            <span>{wheelZoomEnabled ? '스크롤 줌 켜짐' : '드래그 확대'}</span>
            <strong data-testid="chart-zoom-range">{formatChartZoomRange(zoomed.range, zoomed.originalCount)}</strong>
          </div>
          {dragSelection ? (
            <div
              className="chart-drag-selection"
              style={buildDragSelectionStyle(dragSelection.startX, dragSelection.currentX)}
              aria-hidden="true"
            />
          ) : null}
          <div className="chart-floating-tools">
            <button
              type="button"
              className={`chart-tool-button ${wheelZoomEnabled ? 'is-active' : ''}`}
              aria-pressed={wheelZoomEnabled}
              onClick={() => onWheelZoomEnabledChange(!wheelZoomEnabled)}
            >
              {wheelZoomEnabled ? '스크롤 줌 끄기' : '스크롤 줌'}
            </button>
            {chartZoomRange ? (
              <button type="button" className="chart-tool-button" onClick={() => onChartZoomRangeChange(null)}>
                전체
              </button>
            ) : null}
          </div>
          <div className="chart-zoom-surface" data-testid="chart-zoom-surface">
            {chart}
          </div>
        </ChartViewport>
      ) : (
        <div className="chart-static-viewport" data-testid="chart-static-viewport">
          {chart}
        </div>
      )}
    </div>
  );
}

function ChartSettingsPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="chart-settings-panel" aria-label="차트 표시 설정">
      {children}
    </section>
  );
}

function DimensionKeyPicker({
  dimensionColumns,
  selectedDimensionKey,
  onChange,
}: {
  dimensionColumns: string[];
  selectedDimensionKey: string | null;
  onChange: (key: string) => void;
}) {
  return (
    <label className="chart-select-field">
      <span>기준</span>
      <select value={selectedDimensionKey ?? dimensionColumns[0] ?? ''} onChange={(event) => onChange(event.target.value)}>
        {dimensionColumns.map((column) => (
          <option key={column} value={column}>
            {column}
          </option>
        ))}
      </select>
    </label>
  );
}

function ValueKeyPicker({
  numericColumns,
  selectedValueKey,
  onChange,
}: {
  numericColumns: string[];
  selectedValueKey: string | null;
  onChange: (key: string) => void;
}) {
  return (
    <label className="chart-select-field">
      <span>값</span>
      <select value={selectedValueKey ?? numericColumns[0] ?? ''} onChange={(event) => onChange(event.target.value)}>
        {numericColumns.map((column) => (
          <option key={column} value={column}>
            {column}
          </option>
        ))}
      </select>
    </label>
  );
}

function TimeGroupingToolbar({
  activeMode,
  activeMethod,
  onModeChange,
  onMethodChange,
}: {
  activeMode: TimeGroupingMode;
  activeMethod: TimeAggregationMethod;
  onModeChange: (mode: TimeGroupingMode) => void;
  onMethodChange: (method: TimeAggregationMethod) => void;
}) {
  const modeOptions: Array<{ value: TimeGroupingMode; label: string }> = [
    { value: 'raw', label: '원본 순서' },
    { value: 'day', label: '일별' },
    { value: 'month', label: '월별' },
    { value: 'year', label: '연도별' },
  ];
  const methodOptions: Array<{ value: TimeAggregationMethod; label: string }> = [
    { value: 'sum', label: '합계' },
    { value: 'average', label: '평균' },
  ];

  return (
    <div className="chart-option-panel" aria-label="날짜 표시 옵션">
      <span>날짜</span>
      <div className="chart-window-toolbar" role="group" aria-label="날짜 표시 방식">
        {modeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={activeMode === option.value ? 'is-active' : ''}
            aria-pressed={activeMode === option.value}
            onClick={() => onModeChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {activeMode !== 'raw' ? (
        <div className="chart-window-toolbar" role="group" aria-label="날짜 집계 계산">
          {methodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={activeMethod === option.value ? 'is-active' : ''}
              aria-pressed={activeMethod === option.value}
              onClick={() => onMethodChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ChartViewport({
  ariaLabel,
  activeZoomRange,
  totalCount,
  dragSelection,
  onDragSelectionChange,
  onZoomChange,
  wheelZoomEnabled,
  children,
}: ChartViewportProps & { wheelZoomEnabled: boolean }) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !wheelZoomEnabled) return;

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 8 || totalCount <= 0) return;
      event.preventDefault();
      const bounds = viewport.getBoundingClientRect();
      const anchorRatio = bounds.width > 0 ? (event.clientX - bounds.left) / bounds.width : 0.5;
      const nextRange = getNextChartZoomRange(activeZoomRange, totalCount, event.deltaY < 0 ? 'in' : 'out', anchorRatio);
      const isDefault = nextRange.start === 0 && nextRange.end === totalCount;
      onZoomChange(isDefault ? null : nextRange);
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [activeZoomRange, onZoomChange, totalCount, wheelZoomEnabled]);

  return (
    <div
      ref={viewportRef}
      className="chart-zoom-viewport"
      data-testid="chart-zoom-viewport"
      role="application"
      aria-label={ariaLabel}
      tabIndex={0}
      onMouseDown={(event) => handleChartDragStart(event, onDragSelectionChange)}
      onMouseMove={(event) => handleChartDragMove(event, dragSelection, onDragSelectionChange)}
      onMouseUp={(event) => handleChartDragEnd(event, dragSelection, activeZoomRange, totalCount, onZoomChange, onDragSelectionChange)}
      onMouseLeave={(event) => handleChartDragEnd(event, dragSelection, activeZoomRange, totalCount, onZoomChange, onDragSelectionChange)}
      onDoubleClick={() => onZoomChange(null)}
    >
      {children}
    </div>
  );
}

function handleChartDragStart(
  event: MouseEvent<HTMLDivElement>,
  onChange: (selection: { startX: number; currentX: number } | null) => void,
) {
  if (event.button !== 0) return;
  onChange({ startX: event.nativeEvent.offsetX, currentX: event.nativeEvent.offsetX });
}

function handleChartDragMove(
  event: MouseEvent<HTMLDivElement>,
  dragSelection: { startX: number; currentX: number } | null,
  onChange: (selection: { startX: number; currentX: number } | null) => void,
) {
  if (!dragSelection) return;
  onChange({ ...dragSelection, currentX: event.nativeEvent.offsetX });
}

function handleChartDragEnd(
  event: MouseEvent<HTMLDivElement>,
  dragSelection: { startX: number; currentX: number } | null,
  activeRange: ChartZoomRange,
  visibleCount: number,
  onZoomChange: (range: ChartZoomRange | null) => void,
  onSelectionChange: (selection: { startX: number; currentX: number } | null) => void,
) {
  if (!dragSelection) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  const minX = Math.min(dragSelection.startX, dragSelection.currentX);
  const maxX = Math.max(dragSelection.startX, dragSelection.currentX);
  if (maxX - minX < 18 || bounds.width <= 0 || visibleCount <= 1) {
    onSelectionChange(null);
    return;
  }

  const startRatio = clamp(minX / bounds.width, 0, 1);
  const endRatio = clamp(maxX / bounds.width, 0, 1);
  const localStart = Math.floor(startRatio * (visibleCount - 1));
  const localEnd = Math.ceil(endRatio * visibleCount);
  const nextStart = clamp(activeRange.start + localStart, 0, activeRange.end - 1);
  const nextEnd = clamp(activeRange.start + Math.max(localEnd, localStart + 2), nextStart + 1, activeRange.end);
  onZoomChange({ start: nextStart, end: nextEnd });
  onSelectionChange(null);
}

function buildDragSelectionStyle(startX: number, currentX: number) {
  const left = Math.min(startX, currentX);
  const width = Math.abs(currentX - startX);
  return { left: `${left}px`, width: `${width}px` };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
  return Boolean(candidate.categoryKey && (candidate.id === 'bar' || candidate.id === 'pie' || candidate.id === 'donut' || candidate.id === 'radar'));
}

function shouldAggregateTimeSeriesPoints(candidate: ChartCandidate): boolean {
  return candidate.xAxisType === 'date' && Boolean(candidate.xKey && (candidate.yKey || candidate.valueKey));
}

function shouldEnableRangeZoom(candidate: ChartCandidate): boolean {
  return candidate.id === 'bar' || candidate.id === 'line' || candidate.id === 'area' || candidate.id === 'scatter';
}

function shouldShowValueKeyPicker(candidate: ChartCandidate, numericColumns: string[]): boolean {
  if (numericColumns.length <= 1 || candidate.id === 'scatter') return false;
  return Boolean(candidate.yKey || candidate.valueKey);
}

function shouldShowDimensionPicker(candidate: ChartCandidate, dimensionColumns: string[]): boolean {
  if (dimensionColumns.length <= 1) return false;
  return candidate.id === 'bar' || candidate.id === 'pie' || candidate.id === 'donut' || candidate.id === 'radar';
}

function shouldShowChartSettings(candidate: ChartCandidate, numericColumns: string[], dimensionColumns: string[]): boolean {
  return shouldAggregateTimeSeriesPoints(candidate)
    || shouldShowValueKeyPicker(candidate, numericColumns)
    || shouldShowDimensionPicker(candidate, dimensionColumns);
}

function shouldCompactProportionPoints(candidate: ChartCandidate): boolean {
  return candidate.id === 'pie' || candidate.id === 'donut';
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

function compactProportionPoints(points: Point[], limit = 6): Point[] {
  if (points.length <= limit) return points;
  const sorted = [...points].sort((left, right) => Math.max(right.value, 0) - Math.max(left.value, 0));
  const visible = sorted.slice(0, limit - 1);
  const otherValue = sorted.slice(limit - 1).reduce((sum, point) => sum + Math.max(point.value, 0), 0);
  return otherValue > 0 ? [...visible, { label: '기타', x: visible.length, value: otherValue }] : visible;
}

function findNumericColumns(rows: DataRow[]): string[] {
  const keys = new Set(rows.flatMap((row) => Object.keys(row)));
  return [...keys].filter((key) => rows.some((row) => toNumber(row[key]) !== null));
}

function findDimensionColumns(rows: DataRow[], numericColumns: string[]): string[] {
  const numericColumnSet = new Set(numericColumns);
  const keys = new Set(rows.flatMap((row) => Object.keys(row)));
  return [...keys].filter((key) => !numericColumnSet.has(key) && rows.some((row) => row[key] !== null && String(row[key]).trim().length > 0));
}

function findDateColumns(rows: DataRow[]): string[] {
  const keys = new Set(rows.flatMap((row) => Object.keys(row)));
  return [...keys].filter((key) => {
    const values = rows.map((row) => row[key]).filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
    if (values.length === 0) return false;
    const sample = values.slice(0, 12);
    return sample.filter((value) => parseDateParts(value) !== null).length / sample.length >= 0.75;
  });
}

function withSelectedKeys(
  candidate: ChartCandidate,
  valueKey: string | null,
  dimensionKey: string | null,
  dateColumns: string[],
): ChartCandidate {
  let nextCandidate = candidate;
  if (valueKey && candidate.id !== 'scatter') {
    if (candidate.yKey) nextCandidate = { ...nextCandidate, yKey: valueKey };
    if (candidate.valueKey) nextCandidate = { ...nextCandidate, valueKey };
  }

  if (!dimensionKey || !supportsDimensionOverride(candidate)) return nextCandidate;

  if (dateColumns.includes(dimensionKey)) {
    return {
      ...nextCandidate,
      xKey: dimensionKey,
      xAxisType: 'date',
      categoryKey: undefined,
    };
  }

  return {
    ...nextCandidate,
    xKey: undefined,
    xAxisType: undefined,
    categoryKey: dimensionKey,
  };
}

function supportsDimensionOverride(candidate: ChartCandidate): boolean {
  return candidate.id === 'bar' || candidate.id === 'pie' || candidate.id === 'donut' || candidate.id === 'radar';
}

function parseDateParts(value: string) {
  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/u);
  if (isoMatch) return true;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : true;
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

function PieSvg({ points, donut }: { points: Point[]; donut: boolean }) {
  const width = 640;
  const height = 280;
  const total = points.reduce((sum, point) => sum + Math.max(point.value, 0), 0) || 1;
  let cursor = -90;
  const chartLabel = donut ? '도넛 차트' : '파이 차트';

  return (
    <svg className="native-chart" data-testid="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${chartLabel} 시각화, ${points.length}개 지점`}>
      <circle cx="180" cy="140" r="96" fill="#f8fafc" />
      {points.map((point, index) => {
        const angle = (Math.max(point.value, 0) / total) * 360;
        const path = arcPath(180, 140, 96, cursor, cursor + angle);
        cursor += angle;
        return <path key={`${point.label}-${index}`} d={path} fill={palette[index % palette.length]} stroke="#fff" strokeWidth="4" />;
      })}
      {donut ? <circle cx="180" cy="140" r="44" fill="var(--chart-surface-hole)" /> : null}
      {points.slice(0, 5).map((point, index) => (
        <g key={`${point.label}-legend`}>
          <rect x="340" y={72 + index * 34} width="18" height="18" rx="5" fill={palette[index % palette.length]} />
          <text x="370" y={86 + index * 34}>{shortLabel(point.label)} · {Math.round((point.value / total) * 100)}%</text>
        </g>
      ))}
    </svg>
  );
}

function RadarSvg({ points }: { points: Point[] }) {
  const width = 640;
  const height = 320;
  const cx = 220;
  const cy = 160;
  const radius = 110;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const ringCount = 4;
  const coordinates = points.map((point, index) => {
    const angle = ((Math.PI * 2) / points.length) * index - Math.PI / 2;
    const valueRadius = (Math.max(point.value, 0) / maxValue) * radius;
    return {
      label: point.label,
      x: cx + Math.cos(angle) * valueRadius,
      y: cy + Math.sin(angle) * valueRadius,
      axisX: cx + Math.cos(angle) * (radius + 22),
      axisY: cy + Math.sin(angle) * (radius + 22),
      guideX: cx + Math.cos(angle) * radius,
      guideY: cy + Math.sin(angle) * radius,
    };
  });
  const polygon = coordinates.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <svg className="native-chart" data-testid="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`레이더 차트 시각화, ${points.length}개 지점`}>
      {Array.from({ length: ringCount }, (_, index) => {
        const scale = (index + 1) / ringCount;
        const ring = coordinates.map((point, pointIndex) => {
          const angle = ((Math.PI * 2) / points.length) * pointIndex - Math.PI / 2;
          const x = cx + Math.cos(angle) * radius * scale;
          const y = cy + Math.sin(angle) * radius * scale;
          return `${x},${y}`;
        }).join(' ');
        return <polygon key={scale} points={ring} fill="none" stroke="rgba(159, 176, 200, 0.22)" strokeDasharray="4 6" />;
      })}
      {coordinates.map((point) => (
        <line key={`${point.label}-axis`} x1={cx} y1={cy} x2={point.guideX} y2={point.guideY} stroke="rgba(184, 201, 227, 0.3)" />
      ))}
      <polygon points={polygon} fill="rgba(96, 165, 250, 0.24)" stroke="#2563eb" strokeWidth="4" />
      {coordinates.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle cx={point.x} cy={point.y} r="6" fill="#b6f24a" stroke="#101827" strokeWidth="3" />
          <text className="chart-axis-label" data-axis="x" x={point.axisX} y={point.axisY} textAnchor="middle">
            {shortLabel(point.label)}
          </text>
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
