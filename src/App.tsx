import { useMemo, useState } from 'react';
import { ChartGrid } from './components/ChartGrid';
import { ColumnSummary } from './components/ColumnSummary';
import { DataInputPanel } from './components/DataInputPanel';
import { DataPreview } from './components/DataPreview';
import { buildChartCandidates } from './lib/chartCandidates';
import { inferColumnTypes } from './lib/inferColumnTypes';
import { parseDelimitedText } from './lib/parseDelimitedText';
import type { SampleDataset } from './data/sampleData';
import { sampleDatasets } from './data/sampleData';

export function App() {
  const [inputText, setInputText] = useState(sampleDatasets[0]?.text ?? '');
  const [sourceLabel, setSourceLabel] = useState('샘플 데이터: 월별 매출');
  const [parseError, setParseError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const parsed = useMemo(() => {
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

  function handleTextChange(text: string) {
    setParseError(null);
    setWarnings([]);
    setSourceLabel('직접 입력');
    setInputText(text);
  }

  function handleLoadSample(sample: SampleDataset) {
    setParseError(null);
    setWarnings([]);
    setSourceLabel(`샘플 데이터: ${sample.name}`);
    setInputText(sample.text);
  }

  function handleFileText(text: string, fileName: string) {
    setParseError(null);
    setWarnings([]);
    setSourceLabel(`CSV 파일: ${fileName}`);
    setInputText(text);
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Local-first Visualization Simulator</p>
        <h1>데이터를 넣으면 가능한 차트 후보를 즉시 보여줍니다</h1>
        <p>
          직접 입력, 샘플 데이터, CSV를 브라우저에서만 처리합니다. 맞지 않는 차트는 숨기지 않고 더미/경고 상태로 보여줍니다.
        </p>
      </header>

      <div className="status-strip">
        <span>현재 소스: {sourceLabel}</span>
        <span>서버 업로드 없음</span>
        <span>제한: 1MB · 5,000행</span>
      </div>

      {activeError ? <Alert tone="danger" title="처리할 수 없는 데이터" messages={[activeError]} /> : null}
      {activeWarnings.length > 0 ? <Alert tone="warning" title="확인 필요" messages={[...new Set(activeWarnings)]} /> : null}

      <div className="layout-grid">
        <DataInputPanel
          inputText={inputText}
          onTextChange={handleTextChange}
          onLoadSample={handleLoadSample}
          onFileText={handleFileText}
          onError={setParseError}
        />
        <div className="stacked-panels">
          <DataPreview data={parsed.data} />
          <ColumnSummary profiles={profiles} />
        </div>
      </div>

      <ChartGrid candidates={parsed.data ? candidates : []} rows={parsed.data?.rows ?? []} />
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
