import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartCandidate, DataRow } from '../../lib/dataTypes';
import { WarningPlaceholder } from '../WarningPlaceholder';

function requireKey(key: string | undefined): string {
  return key ?? '__missing_key__';
}

type Props = {
  candidate: ChartCandidate;
  rows: DataRow[];
};

const colors = ['#6366f1', '#22c55e', '#f97316', '#ec4899', '#14b8a6', '#eab308'];

export function CandidateChart({ candidate, rows }: Props) {
  if (candidate.status === 'placeholder' || candidate.status === 'error') {
    return <WarningPlaceholder status={candidate.status} reason={candidate.reason} />;
  }

  if (candidate.status === 'warning') {
    return (
      <div className="chart-with-warning">
        <WarningPlaceholder status="warning" reason={candidate.reason} />
        {renderChart(candidate, rows)}
      </div>
    );
  }

  return renderChart(candidate, rows);
}

function renderChart(candidate: ChartCandidate, rows: DataRow[]) {
  const data = rows.slice(0, 40);
  switch (candidate.id) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={candidate.status === 'warning' ? 180 : 240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={requireKey(candidate.categoryKey)} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={requireKey(candidate.valueKey)} fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      );
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={candidate.status === 'warning' ? 180 : 240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={requireKey(candidate.xKey)} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={requireKey(candidate.yKey)} stroke="#22c55e" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      );
    case 'scatter':
      return (
        <ResponsiveContainer width="100%" height={candidate.status === 'warning' ? 180 : 240}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={requireKey(candidate.xKey)} name={requireKey(candidate.xKey)} />
            <YAxis dataKey={requireKey(candidate.yKey)} name={requireKey(candidate.yKey)} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={data} fill="#f97316" />
          </ScatterChart>
        </ResponsiveContainer>
      );
    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={candidate.status === 'warning' ? 180 : 240}>
          <PieChart>
            <Tooltip />
            <Pie data={data} dataKey={requireKey(candidate.valueKey)} nameKey={requireKey(candidate.categoryKey)} outerRadius={80} label>
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    case 'area':
      return (
        <ResponsiveContainer width="100%" height={candidate.status === 'warning' ? 180 : 240}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={requireKey(candidate.xKey)} />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey={requireKey(candidate.yKey)} fill="#14b8a6" stroke="#0f766e" />
          </AreaChart>
        </ResponsiveContainer>
      );
  }
}
