import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { aggregateTimeSeriesPoints } from '../../lib/chartTimeGrouping';
import { planChartRendering, type ChartRenderNotice } from '../../lib/chartRenderPlanning';
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
  sourceCount: number;
};

type ChartWindowState = {
  startIndex: number;
  endIndex: number;
  totalCount: number;
  pageSize: number;
};

const palette = ['#b6f24a', '#60a5fa', '#fb7185', '#fbbf24', '#a78bfa', '#34d399'];
const BAR_WINDOW_SIZE = 20;

export function CandidateChart({ candidate, rows }: Props) {
  const [timeGroupingMode, setTimeGroupingMode] = useState<TimeGroupingMode>('raw');
  const [timeAggregationMethod, setTimeAggregationMethod] = useState<TimeAggregationMethod>('sum');
  const [selectedValueKey, setSelectedValueKey] = useState<string | null>(candidate.yKey ?? candidate.valueKey ?? null);
  const [selectedDimensionKey, setSelectedDimensionKey] = useState<string | null>(candidate.xKey ?? candidate.categoryKey ?? null);
  const [barWindowStart, setBarWindowStart] = useState(0);
  const numericColumns = useMemo(() => findNumericColumns(rows), [rows]);
  const dimensionColumns = useMemo(() => findDimensionColumns(rows, numericColumns), [numericColumns, rows]);
  const dateColumns = useMemo(() => findDateColumns(rows), [rows]);
  const effectiveCandidate = useMemo(
    () => withSelectedKeys(candidate, selectedValueKey, selectedDimensionKey, dateColumns),
    [candidate, dateColumns, selectedDimensionKey, selectedValueKey],
  );
  const points = useMemo(
    () => preparePoints(effectiveCandidate, rows, timeGroupingMode, timeAggregationMethod),
    [effectiveCandidate, rows, timeAggregationMethod, timeGroupingMode],
  );

  useEffect(() => {
    setTimeGroupingMode('raw');
    setTimeAggregationMethod('sum');
    setSelectedValueKey(candidate.yKey ?? candidate.valueKey ?? null);
    setSelectedDimensionKey(candidate.xKey ?? candidate.categoryKey ?? null);
    setBarWindowStart(0);
  }, [candidate.categoryKey, candidate.id, candidate.valueKey, candidate.xKey, candidate.yKey]);

  useEffect(() => {
    setBarWindowStart(0);
  }, [effectiveCandidate.categoryKey, effectiveCandidate.valueKey, effectiveCandidate.xKey, effectiveCandidate.yKey, points.length]);

  if (candidate.status === 'placeholder' || candidate.status === 'error') {
    return <WarningPlaceholder status={candidate.status} reason={candidate.reason} />;
  }

  const chart = renderChart({
    candidate: effectiveCandidate,
    points,
    numericColumns,
    selectedValueKey,
    onSelectedValueKeyChange: setSelectedValueKey,
    dimensionColumns,
    selectedDimensionKey,
    onSelectedDimensionKeyChange: setSelectedDimensionKey,
    timeGroupingMode,
    onTimeGroupingModeChange: setTimeGroupingMode,
    timeAggregationMethod,
    onTimeAggregationMethodChange: setTimeAggregationMethod,
    barWindowStart,
    onBarWindowStartChange: setBarWindowStart,
  });

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
  timeGroupingMode: TimeGroupingMode,
  timeAggregationMethod: TimeAggregationMethod,
): Point[] {
  const rawPoints = toPoints(candidate, rows, candidate.id === 'scatter');
  const timeGroupedPoints = shouldAggregateTimeSeriesPoints(candidate) && timeGroupingMode !== 'raw'
    ? aggregateTimeSeriesPoints(rawPoints, timeGroupingMode, timeAggregationMethod)
    : rawPoints;
  return shouldAggregateCategoryPoints(candidate) ? aggregatePointsByLabel(timeGroupedPoints) : timeGroupedPoints;
}

type RenderChartArgs = {
  candidate: ChartCandidate;
  points: Point[];
  numericColumns: string[];
  selectedValueKey: string | null;
  onSelectedValueKeyChange: (key: string) => void;
  dimensionColumns: string[];
  selectedDimensionKey: string | null;
  onSelectedDimensionKeyChange: (key: string) => void;
  timeGroupingMode: TimeGroupingMode;
  onTimeGroupingModeChange: (mode: TimeGroupingMode) => void;
  timeAggregationMethod: TimeAggregationMethod;
  onTimeAggregationMethodChange: (method: TimeAggregationMethod) => void;
  barWindowStart: number;
  onBarWindowStartChange: (start: number) => void;
};

function renderChart({
  candidate,
  points,
  numericColumns,
  selectedValueKey,
  onSelectedValueKeyChange,
  dimensionColumns,
  selectedDimensionKey,
  onSelectedDimensionKeyChange,
  timeGroupingMode,
  onTimeGroupingModeChange,
  timeAggregationMethod,
  onTimeAggregationMethodChange,
  barWindowStart,
  onBarWindowStartChange,
}: RenderChartArgs) {
  const windowState = getBarWindowState(candidate, points, barWindowStart);
  const pointsForPlan = windowState ? points.slice(windowState.startIndex, windowState.endIndex) : points;
  const renderPlan = windowState ? { points: pointsForPlan, notice: null } : planChartRendering(candidate.id, pointsForPlan);

  if (renderPlan.points.length === 0) {
    return <WarningPlaceholder status="warning" reason="표시할 수 있는 숫자 값이 부족합니다." />;
  }

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
          {shouldShowScatterPickers(candidate, numericColumns) ? (
            <>
              <NumericKeyPicker
                label="X축"
                ariaLabel="산점도 X축 컬럼"
                numericColumns={numericColumns}
                selectedKey={candidate.xKey}
                onChange={onSelectedDimensionKeyChange}
              />
              <NumericKeyPicker
                label="Y축"
                ariaLabel="산점도 Y축 컬럼"
                numericColumns={numericColumns}
                selectedKey={candidate.yKey}
                onChange={onSelectedValueKeyChange}
              />
            </>
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
      {windowState ? <BarWindowControls windowState={windowState} onChange={onBarWindowStartChange} /> : null}
      {renderPlan.notice ? (
        <p className="render-notice" data-testid="render-notice">
          {formatRenderNotice(renderPlan.notice)}
        </p>
      ) : null}
      <ChartSurface
        candidate={candidate}
        points={renderPlan.points}
        label={formatChartLabel(candidate.title, renderPlan.points.length, renderPlan.notice, windowState)}
      />
    </div>
  );
}

function formatRenderNotice(notice: ChartRenderNotice): string {
  const originalCount = notice.originalCount.toLocaleString('ko-KR');
  const renderedCount = notice.renderedCount.toLocaleString('ko-KR');
  if (notice.strategy === 'grouped') {
    return `전체 ${originalCount}개 항목을 기준으로 계산했고, 화면에는 ${renderedCount}개 묶음으로 표시합니다. 나머지는 기타에 합산됩니다.`;
  }
  return `전체 ${originalCount}개 데이터를 기준으로 계산했고, 화면에는 ${renderedCount}개 대표 지점만 표시합니다. ${notice.reason}`;
}

function formatChartLabel(
  title: string,
  visibleCount: number,
  notice: ChartRenderNotice | null,
  windowState: ChartWindowState | null,
): string {
  if (windowState) {
    return `${title} 시각화, 전체 ${windowState.totalCount.toLocaleString('ko-KR')}개 중 ${windowState.startIndex + 1}-${windowState.endIndex} 구간 ${visibleCount}개`;
  }
  if (notice) {
    const originalCount = notice.originalCount.toLocaleString('ko-KR');
    const renderedCount = notice.renderedCount.toLocaleString('ko-KR');
    const unit = notice.strategy === 'grouped' ? '묶음' : '대표 지점';
    return `${title} 시각화, 전체 ${originalCount}개 중 ${renderedCount}개 ${unit}`;
  }
  return `${title} 시각화, ${visibleCount}개 지점`;
}

function ChartSettingsPanel({ children }: { children: React.ReactNode }) {
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

function NumericKeyPicker({
  label,
  ariaLabel,
  numericColumns,
  selectedKey,
  onChange,
}: {
  label: string;
  ariaLabel: string;
  numericColumns: string[];
  selectedKey: string | null | undefined;
  onChange: (key: string) => void;
}) {
  return (
    <label className="chart-select-field">
      <span>{label}</span>
      <select aria-label={ariaLabel} value={selectedKey ?? numericColumns[0] ?? ''} onChange={(event) => onChange(event.target.value)}>
        {numericColumns.map((column) => (
          <option key={column} value={column}>
            {column}
          </option>
        ))}
      </select>
    </label>
  );
}

function BarWindowControls({
  windowState,
  onChange,
}: {
  windowState: ChartWindowState;
  onChange: (start: number) => void;
}) {
  const lastStart = getLastWindowStart(windowState.totalCount, windowState.pageSize);
  const previousStart = Math.max(0, windowState.startIndex - windowState.pageSize);
  const nextStart = Math.min(lastStart, windowState.startIndex + windowState.pageSize);
  const rangeText = `${(windowState.startIndex + 1).toLocaleString('ko-KR')}-${windowState.endIndex.toLocaleString('ko-KR')} / ${windowState.totalCount.toLocaleString('ko-KR')}`;

  return (
    <section className="chart-range-panel" aria-label="막대 차트 표시 구간">
      <span>20개씩 보기</span>
      <button type="button" onClick={() => onChange(previousStart)} disabled={windowState.startIndex === 0}>
        이전
      </button>
      <input
        type="range"
        min={0}
        max={lastStart}
        step={windowState.pageSize}
        value={Math.min(windowState.startIndex, lastStart)}
        aria-label="막대 차트 표시 시작 위치"
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <button type="button" onClick={() => onChange(nextStart)} disabled={windowState.endIndex >= windowState.totalCount}>
        다음
      </button>
      <strong>{rangeText}</strong>
    </section>
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
    { value: 'raw', label: '원본' },
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
      <label className="chart-select-field">
        <span>날짜</span>
        <select
          aria-label="날짜 표시 방식"
          value={activeMode}
          onChange={(event) => onModeChange(event.target.value as TimeGroupingMode)}
        >
          {modeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {activeMode !== 'raw' ? (
        <label className="chart-select-field">
          <span>계산</span>
          <select
            aria-label="날짜 집계 계산"
            value={activeMethod}
            onChange={(event) => onMethodChange(event.target.value as TimeAggregationMethod)}
          >
            {methodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

function ChartSurface({ candidate, points, label }: { candidate: ChartCandidate; points: Point[]; label: string }) {
  const showBrush = shouldShowBrush(candidate, points);

  return (
    <div className="recharts-frame" data-testid="chart-svg" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height={360}>
        {renderRecharts(candidate, points, showBrush)}
      </ResponsiveContainer>
    </div>
  );
}

function renderRecharts(candidate: ChartCandidate, points: Point[], showBrush: boolean) {
  switch (candidate.id) {
    case 'bar':
      return (
        <BarChart data={points} margin={{ top: 20, right: 24, left: 8, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 5" stroke="var(--chart-grid-line)" />
          <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" />
          <YAxis tick={axisTick} tickFormatter={formatAxisValue} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" radius={[10, 10, 4, 4]} fill={palette[0]} />
          {showBrush ? <Brush dataKey="label" height={24} travellerWidth={10} stroke={palette[1]} /> : null}
        </BarChart>
      );
    case 'horizontalBar':
      return (
        <BarChart data={points} layout="vertical" margin={{ top: 20, right: 24, left: 24, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 5" stroke="var(--chart-grid-line)" />
          <XAxis type="number" tick={axisTick} tickFormatter={formatAxisValue} />
          <YAxis type="category" dataKey="label" tick={axisTick} width={96} tickFormatter={shortLabel} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" radius={[0, 10, 10, 0]} fill={palette[0]} />
        </BarChart>
      );
    case 'line':
      return (
        <LineChart data={points} margin={{ top: 20, right: 24, left: 8, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 5" stroke="var(--chart-grid-line)" />
          <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" />
          <YAxis tick={axisTick} tickFormatter={formatAxisValue} />
          <Tooltip content={<ChartTooltip />} />
          <Line type="monotone" dataKey="value" stroke={palette[1]} strokeWidth={3} dot={points.length <= 80 ? { r: 4, fill: palette[0] } : false} activeDot={{ r: 6 }} />
          {showBrush ? <Brush dataKey="label" height={24} travellerWidth={10} stroke={palette[1]} /> : null}
        </LineChart>
      );
    case 'area':
      return (
        <AreaChart data={points} margin={{ top: 20, right: 24, left: 8, bottom: 28 }}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={palette[1]} stopOpacity={0.45} />
              <stop offset="95%" stopColor={palette[1]} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 5" stroke="var(--chart-grid-line)" />
          <XAxis dataKey="label" tick={axisTick} interval="preserveStartEnd" />
          <YAxis tick={axisTick} tickFormatter={formatAxisValue} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="value" stroke={palette[1]} strokeWidth={3} fill="url(#areaFill)" dot={points.length <= 80 ? { r: 3, fill: palette[0] } : false} activeDot={{ r: 6 }} />
          {showBrush ? <Brush dataKey="label" height={24} travellerWidth={10} stroke={palette[1]} /> : null}
        </AreaChart>
      );
    case 'scatter':
      return (
        <ScatterChart margin={{ top: 20, right: 24, left: 8, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 5" stroke="var(--chart-grid-line)" />
          <XAxis dataKey="x" type="number" tick={axisTick} tickFormatter={formatAxisValue} />
          <YAxis dataKey="value" type="number" tick={axisTick} tickFormatter={formatAxisValue} />
          <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={points} fill={palette[1]} />
        </ScatterChart>
      );
    case 'pie':
    case 'donut':
      return (
        <PieChart>
          <Pie
            data={points}
            dataKey="value"
            nameKey="label"
            cx="42%"
            cy="50%"
            outerRadius={112}
            innerRadius={candidate.id === 'donut' ? 58 : 0}
            paddingAngle={2}
          >
            {points.map((point, index) => <Cell key={point.label} fill={palette[index % palette.length]} />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend layout="vertical" verticalAlign="middle" align="right" formatter={(value) => shortLabel(String(value))} />
        </PieChart>
      );
    case 'radar':
      return (
        <RadarChart data={points} outerRadius={118} margin={{ top: 20, right: 48, left: 48, bottom: 20 }}>
          <PolarGrid stroke="var(--chart-grid-line)" />
          <PolarAngleAxis dataKey="label" tick={axisTick} />
          <PolarRadiusAxis tick={axisTick} tickFormatter={formatAxisValue} />
          <Radar dataKey="value" stroke={palette[1]} fill={palette[1]} fillOpacity={0.28} />
          <Tooltip content={<ChartTooltip />} />
        </RadarChart>
      );
  }
}

const axisTick = { fill: 'var(--chart-axis-text)', fontSize: 12, fontWeight: 700 };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number; payload?: Point }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const value = payload[0]?.value ?? point?.value;
  const sourceCount = point?.sourceCount ?? 1;
  return (
    <div className="chart-tooltip">
      <strong>{point?.label ?? label}</strong>
      <span>{typeof value === 'number' ? formatAxisValue(value) : '-'}</span>
      <em>{`데이터 ${sourceCount.toLocaleString('ko-KR')}개`}</em>
    </div>
  );
}

function shouldShowBrush(candidate: ChartCandidate, points: Point[]): boolean {
  return (candidate.id === 'line' || candidate.id === 'area') && points.length > 24;
}

function shouldAggregateCategoryPoints(candidate: ChartCandidate): boolean {
  return Boolean(candidate.categoryKey && (candidate.id === 'bar' || candidate.id === 'horizontalBar' || candidate.id === 'pie' || candidate.id === 'donut' || candidate.id === 'radar'));
}

function shouldAggregateTimeSeriesPoints(candidate: ChartCandidate): boolean {
  return candidate.xAxisType === 'date' && Boolean(candidate.xKey && (candidate.yKey || candidate.valueKey));
}

function shouldShowValueKeyPicker(candidate: ChartCandidate, numericColumns: string[]): boolean {
  if (numericColumns.length <= 1 || candidate.id === 'scatter') return false;
  return Boolean(candidate.yKey || candidate.valueKey);
}

function shouldShowScatterPickers(candidate: ChartCandidate, numericColumns: string[]): boolean {
  return candidate.id === 'scatter' && numericColumns.length > 1;
}

function shouldShowDimensionPicker(candidate: ChartCandidate, dimensionColumns: string[]): boolean {
  if (dimensionColumns.length <= 1) return false;
  return candidate.id === 'bar' || candidate.id === 'horizontalBar' || candidate.id === 'pie' || candidate.id === 'donut' || candidate.id === 'radar';
}

function shouldShowChartSettings(candidate: ChartCandidate, numericColumns: string[], dimensionColumns: string[]): boolean {
  return shouldAggregateTimeSeriesPoints(candidate)
    || shouldShowValueKeyPicker(candidate, numericColumns)
    || shouldShowDimensionPicker(candidate, dimensionColumns)
    || shouldShowScatterPickers(candidate, numericColumns);
}

function getBarWindowState(candidate: ChartCandidate, points: Point[], requestedStart: number): ChartWindowState | null {
  if (candidate.id !== 'bar' && candidate.id !== 'horizontalBar') return null;
  if (points.length <= BAR_WINDOW_SIZE) return null;
  const lastStart = getLastWindowStart(points.length, BAR_WINDOW_SIZE);
  const startIndex = Math.min(Math.max(0, requestedStart), lastStart);
  return {
    startIndex,
    endIndex: Math.min(points.length, startIndex + BAR_WINDOW_SIZE),
    totalCount: points.length,
    pageSize: BAR_WINDOW_SIZE,
  };
}

function getLastWindowStart(totalCount: number, pageSize: number): number {
  return Math.max(0, Math.floor((totalCount - 1) / pageSize) * pageSize);
}


function aggregatePointsByLabel(points: Point[]): Point[] {
  const totals = new Map<string, Point>();
  for (const point of points) {
    const current = totals.get(point.label);
    if (!current) {
      totals.set(point.label, { ...point, sourceCount: point.sourceCount ?? 1 });
      continue;
    }
    current.value += point.value;
    current.sourceCount += point.sourceCount ?? 1;
  }
  return [...totals.values()];
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
  if (candidate.id === 'scatter') {
    return {
      ...nextCandidate,
      xKey: dimensionKey ?? candidate.xKey,
      yKey: valueKey ?? candidate.yKey,
    };
  }

  if (valueKey) {
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
  return candidate.id === 'bar' || candidate.id === 'horizontalBar' || candidate.id === 'pie' || candidate.id === 'donut' || candidate.id === 'radar';
}

function parseDateParts(value: string) {
  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/u);
  if (isoMatch) return true;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : true;
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
        sourceCount: 1,
      };
    })
    .filter((point): point is Point => point !== null);
}

function toNumber(value: DataValue): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatAxisValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    notation: Math.abs(value) >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(value) >= 1000 ? 1 : 0,
  }).format(value);
}

function shortLabel(label: string): string {
  const trimmed = label.trim();
  return trimmed.length > 15 ? `${trimmed.slice(0, 14)}…` : trimmed;
}
