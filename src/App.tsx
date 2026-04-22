import { useEffect, useMemo, useState } from 'react';
import { ChartGrid } from './components/ChartGrid';
import { ColumnSummary } from './components/ColumnSummary';
import { DataInputPanel } from './components/DataInputPanel';
import { DataPreview } from './components/DataPreview';
import { SummaryDashboard } from './components/SummaryDashboard';
import { buildChartCandidates } from './lib/chartCandidates';
import { summarizeDataset } from './lib/datasetSummary';
import { inferColumnTypes } from './lib/inferColumnTypes';
import { parseDelimitedText } from './lib/parseDelimitedText';
import type { SampleDataset } from './data/sampleData';
import { sampleDatasets } from './data/sampleData';

export function App() {
  const [inputText, setInputText] = useState('');
  const [sourceLabel, setSourceLabel] = useState('아직 데이터 없음');
  const [parseError, setParseError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);

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
  const preferredChartId = useMemo(() => {
    const hasDate = profiles.some((profile) => profile.type === 'date');
    const hasNumber = profiles.some((profile) => profile.type === 'number');
    if (hasDate && hasNumber && candidates.some((candidate) => candidate.id === 'line' && candidate.status === 'ready')) {
      return 'line';
    }
    return candidates[0]?.id ?? null;
  }, [profiles, candidates]);

  useEffect(() => {
    const sampleId = new URLSearchParams(window.location.search).get('sample');
    if (!sampleId) return;
    const sample = sampleDatasets.find((item) => item.id === sampleId);
    if (!sample) return;
    setSelectedChartId(null);
    setSourceLabel(sample.name);
    setInputText(sample.text);
  }, []);

  function resetFeedback() {
    setParseError(null);
    setWarnings([]);
    setSelectedChartId(null);
  }

  function handleTextChange(text: string) {
    resetFeedback();
    setSourceLabel(text.trim().length > 0 ? '직접 붙여넣은 CSV' : '아직 데이터 없음');
    setInputText(text);
  }

  function handleClear() {
    resetFeedback();
    setSourceLabel('아직 데이터 없음');
    setInputText('');
  }

  function handleLoadSample(sample: SampleDataset) {
    resetFeedback();
    setSelectedChartId(null);
    setSourceLabel(sample.name);
    setInputText(sample.text);
  }

  function handleFileText(text: string, fileName: string) {
    resetFeedback();
    setSourceLabel(`내 CSV · ${fileName}`);
    setInputText(text);
  }

  return (
    <main className="observatory-shell">
      <header className="mission-header" aria-label="차트 비교 작업 영역">
        <div className="mission-copy">
          <p className="eyebrow">Chart Deck Lab</p>
          <h1>데이터에 맞는 차트를 빠르게 비교하세요</h1>
          <p>
            샘플이나 CSV를 넣으면 여러 차트 후보를 한 화면에서 비교하고, 지금 데이터에 가장 어울리는 차트를 고를 수 있습니다.
          </p>
          <div className="mission-signals" aria-label="핵심 운영 지표">
            <span>브라우저 로컬 처리</span>
            <span>서버 업로드 없음</span>
            <span>1MB · 5,000행 제한</span>
          </div>
        </div>

        <div className="mission-panel">
          <div className="mission-panel__source">
            <span>현재 데이터</span>
            <strong aria-live="polite">{sourceLabel}</strong>
          </div>
          <p>차트 후보를 먼저 비교하고, 필요한 컬럼 정보와 미리보기는 옆에서 확인하세요.</p>
        </div>
      </header>

      <section className="operation-grid" aria-label="시각화 운영 영역">
        <section className="visual-stage" aria-label="시각화 결과 영역">
          <ChartGrid
            candidates={parsed.data ? candidates : []}
            rows={parsed.data?.rows ?? []}
            selectedId={selectedChartId ?? preferredChartId}
            onSelect={setSelectedChartId}
          />
        </section>

        <div className="telemetry-stack">
          <SummaryDashboard summary={summary} sourceLabel={sourceLabel} />

          {activeError ? <Alert tone="danger" title="입력을 확인해주세요" messages={[activeError]} /> : null}
          {activeWarnings.length > 0 ? <Alert tone="warning" title="데이터 해석 안내" messages={[...new Set(activeWarnings)]} /> : null}
        </div>

        <aside className="forensics-stack" aria-label="컬럼 및 미리보기">
          <ColumnSummary profiles={profiles} />
          <DataPreview data={parsed.data} />
        </aside>
      </section>

      <section className="control-deck" aria-label="데이터 주입 콘솔">
        <DataInputPanel
          inputText={inputText}
          onTextChange={handleTextChange}
          onLoadSample={handleLoadSample}
          onFileText={handleFileText}
          onError={setParseError}
          onClear={handleClear}
        />
      </section>
    </main>
  );
}

function Alert({ tone, title, messages }: { tone: 'danger' | 'warning'; title: string; messages: string[] }) {
  return (
    <section className={`alert alert-${tone}`} role={tone === 'danger' ? 'alert' : 'status'} aria-atomic="true">
      <strong>{title}</strong>
      <ul>
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </section>
  );
}
