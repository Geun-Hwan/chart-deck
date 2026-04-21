import { useEffect, useMemo, useState } from 'react';
import { ChartGrid } from './components/ChartGrid';
import { ColumnSummary } from './components/ColumnSummary';
import { DataInputPanel } from './components/DataInputPanel';
import { DataPreview } from './components/DataPreview';
import { SummaryDashboard } from './components/SummaryDashboard';
import { buildChartCandidates } from './lib/chartCandidates';
import type { ChartStatus } from './lib/dataTypes';
import { summarizeDataset } from './lib/datasetSummary';
import { inferColumnTypes } from './lib/inferColumnTypes';
import { parseDelimitedText } from './lib/parseDelimitedText';
import type { SampleDataset } from './data/sampleData';
import { sampleDatasets } from './data/sampleData';

type ChartFilter = 'all' | ChartStatus;

export function App() {
  const [inputText, setInputText] = useState('');
  const [sourceLabel, setSourceLabel] = useState('입력 대기');
  const [parseError, setParseError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [chartFilter, setChartFilter] = useState<ChartFilter>('all');

  const parsed = useMemo(() => {
    if (inputText.trim().length === 0) {
      return { data: null, error: null, warnings: [] };
    }
    const result = parseDelimitedText(inputText);
    if (!result.ok) {
      return { data: null, error: result.error, warnings: result.warnings };
    }
    return { data: result.data, error: null, warnings: result.warnings };
  }, [inputText]);

  const activeError = parseError ?? parsed.error;
  const activeWarnings = [...warnings, ...parsed.warnings];
  const profiles = useMemo(() => {
    if (!parsed.data) return [];
    return inferColumnTypes(parsed.data.columns, parsed.data.rows);
  }, [parsed.data]);

  const candidates = useMemo(() => buildChartCandidates(profiles), [profiles]);
  const summary = useMemo(() => summarizeDataset(parsed.data?.rows ?? [], profiles, candidates), [parsed.data, profiles, candidates]);

  useEffect(() => {
    const sampleId = new URLSearchParams(window.location.search).get('sample');
    if (!sampleId) return;
    const sample = sampleDatasets.find((item) => item.id === sampleId);
    if (!sample) return;
    setSourceLabel(sample.name);
    setInputText(sample.text);
  }, []);

  function resetFeedback() {
    setParseError(null);
    setWarnings([]);
    setChartFilter('all');
  }

  function handleTextChange(text: string) {
    resetFeedback();
    setSourceLabel(text.trim().length > 0 ? '직접 입력' : '입력 대기');
    setInputText(text);
  }

  function handleLoadSample(sample: SampleDataset) {
    resetFeedback();
    setSourceLabel(sample.name);
    setInputText(sample.text);
  }

  function handleFileText(text: string, fileName: string) {
    resetFeedback();
    setSourceLabel(`CSV · ${fileName}`);
    setInputText(text);
  }

  return (
    <main className="app-shell redesigned-shell">
      <header className="app-topbar">
        <div>
          <p className="eyebrow">Chart Deck Lab</p>
          <h1>CSV를 넣고 바로 볼 차트를 고르세요</h1>
        </div>
        <ol className="flow-steps" aria-label="작업 흐름">
          <li>입력</li>
          <li>해석</li>
          <li>추천</li>
          <li>비교</li>
        </ol>
      </header>

      <SummaryDashboard summary={summary} sourceLabel={sourceLabel} />

      {activeError ? <Alert tone="danger" title="입력을 확인해주세요" messages={[activeError]} /> : null}
      {activeWarnings.length > 0 ? <Alert tone="warning" title="데이터 해석 안내" messages={[...new Set(activeWarnings)]} /> : null}

      <div className="product-workspace">
        <aside className="control-rail">
          <DataInputPanel
            inputText={inputText}
            onTextChange={handleTextChange}
            onLoadSample={handleLoadSample}
            onFileText={handleFileText}
            onError={setParseError}
          />
        </aside>

        <section className="result-canvas">
          <div className="insight-row">
            <ColumnSummary profiles={profiles} />
            <DataPreview data={parsed.data} />
          </div>
          <ChartGrid candidates={parsed.data ? candidates : []} rows={parsed.data?.rows ?? []} filter={chartFilter} onFilterChange={setChartFilter} />
        </section>
      </div>
    </main>
  );
}

function Alert({ tone, title, messages }: { tone: 'danger' | 'warning'; title: string; messages: string[] }) {
  return (
    <section className={`alert alert-${tone}`} role="status">
      <strong>{title}</strong>
      <ul>
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </section>
  );
}
