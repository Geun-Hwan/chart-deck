import type { ChartCandidate, DataRow, DataValue } from '../../lib/dataTypes';
import { WarningPlaceholder } from '../WarningPlaceholder';

type Props = {
  candidate: ChartCandidate;
  rows: DataRow[];
};

type Point = {
  label: string;
  x: number;
  y: number;
  value: number;
};

const palette = ['#b6f24a', '#60a5fa', '#fb7185', '#fbbf24', '#a78bfa', '#34d399'];

export function CandidateChart({ candidate, rows }: Props) {
  if (candidate.status === 'placeholder' || candidate.status === 'error') {
    return <WarningPlaceholder status={candidate.status} reason={candidate.reason} />;
  }

  const chart = renderChart(candidate, rows);
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

function renderChart(candidate: ChartCandidate, rows: DataRow[]) {
  const data = rows.slice(0, 8);
  const points = toPoints(candidate, data);

  if (points.length === 0) {
    return <WarningPlaceholder status="warning" reason="표시할 수 있는 숫자 값이 부족합니다." />;
  }

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
}

function toPoints(candidate: ChartCandidate, rows: DataRow[]): Point[] {
  const xKey = candidate.xKey ?? candidate.categoryKey;
  const yKey = candidate.yKey ?? candidate.valueKey;
  if (!yKey) return [];

  return rows
    .map((row, index) => {
      const value = toNumber(row[yKey]);
      if (value === null) return null;
      return {
        label: xKey ? String(row[xKey] ?? index + 1) : String(index + 1),
        x: index,
        y: value,
        value,
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
  const width = 640;
  const height = 280;
  const baseY = 238;
  const gap = 14;
  const barWidth = (width - 80 - gap * (points.length - 1)) / points.length;

  return (
    <svg className="native-chart" data-testid="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="막대 차트 시각화">
      <Grid width={width} height={height} />
      {points.map((point, index) => {
        const barHeight = scale(point.value, 0, max, 18, 190);
        const x = 40 + index * (barWidth + gap);
        return (
          <g key={`${point.label}-${index}`}>
            <rect x={x} y={baseY - barHeight} width={barWidth} height={barHeight} rx="14" fill={palette[index % palette.length]} />
            <text x={x + barWidth / 2} y={260} textAnchor="middle">{shortLabel(point.label)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function LineSvg({ points, area }: { points: Point[]; area: boolean }) {
  const width = 640;
  const height = 280;
  const { min, max } = bounds(points);
  const coordinates = points.map((point, index) => ({
    x: scale(index, 0, Math.max(points.length - 1, 1), 48, width - 36),
    y: scale(point.value, min, max, height - 42, 34),
    label: point.label,
  }));
  const path = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${path} L ${coordinates.at(-1)?.x ?? 48} ${height - 42} L ${coordinates[0]?.x ?? 48} ${height - 42} Z`;

  return (
    <svg className="native-chart" data-testid="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={area ? '영역 차트 시각화' : '선 차트 시각화'}>
      <Grid width={width} height={height} />
      {area ? <path d={areaPath} fill="rgba(96, 165, 250, 0.22)" /> : null}
      <path d={path} fill="none" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      {coordinates.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle cx={point.x} cy={point.y} r="7" fill="#b6f24a" stroke="#101827" strokeWidth="3" />
          <text x={point.x} y={260} textAnchor="middle">{shortLabel(point.label)}</text>
        </g>
      ))}
    </svg>
  );
}

function ScatterSvg({ points }: { points: Point[] }) {
  const width = 640;
  const height = 280;
  const { min, max } = bounds(points);
  return (
    <svg className="native-chart" data-testid="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="산점도 시각화">
      <Grid width={width} height={height} />
      {points.map((point, index) => (
        <circle
          key={`${point.label}-${index}`}
          cx={scale(index, 0, Math.max(points.length - 1, 1), 48, width - 44)}
          cy={scale(point.value, min, max, height - 44, 36)}
          r={10 + (index % 3) * 3}
          fill={palette[index % palette.length]}
          stroke="#101827"
          strokeWidth="3"
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
    <svg className="native-chart" data-testid="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="파이 차트 시각화">
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

function Grid({ width, height }: { width: number; height: number }) {
  return (
    <g className="chart-grid-lines">
      {[0, 1, 2, 3].map((line) => (
        <line key={line} x1="36" x2={width - 28} y1={48 + line * ((height - 92) / 3)} y2={48 + line * ((height - 92) / 3)} />
      ))}
    </g>
  );
}

function shortLabel(label: string): string {
  return label.length > 9 ? `${label.slice(0, 8)}…` : label;
}
