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
      <header className="mission-header" aria-label="차트 데크 관제 브리핑">
        <div className="mission-copy">
          <p className="eyebrow">Chart Deck Lab</p>
          <h1>CSV를 차트 감각으로 바꾸는 실험실</h1>
          <p>
            한 번에 모든 걸 보여주지 않습니다. 먼저 데이터를 해석하고, 지금 가장 말이 되는 차트와 함께
            다음 관점을 제안합니다.
          </p>
          <div className="mission-signals" aria-label="핵심 운영 지표">
            <span>브라우저 로컬 처리</span>
            <span>서버 업로드 없음</span>
            <span>1MB · 5,000행 제한</span>
          </div>
        </div>

        <div className="mission-panel">
          <div className="mission-panel__source">
            <span>지금 보는 데이터</span>
            <strong aria-live="polite">{sourceLabel}</strong>
          </div>
          <p>선택된 차트는 중앙 무대에서 유지되고, 나머지 패널은 보조 관측값으로 분리됩니다.</p>
        </div>
      </header>

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

      <section className="operation-grid" aria-label="시각화 운영 영역">
        <div className="telemetry-stack">
          <SummaryDashboard summary={summary} sourceLabel={sourceLabel} />

          {activeError ? <Alert tone="danger" title="입력을 확인해주세요" messages={[activeError]} /> : null}
          {activeWarnings.length > 0 ? <Alert tone="warning" title="데이터 해석 안내" messages={[...new Set(activeWarnings)]} /> : null}
        </div>

        <section className="visual-stage" aria-label="시각화 결과 영역">
          <ChartGrid
            candidates={parsed.data ? candidates : []}
            rows={parsed.data?.rows ?? []}
            selectedId={selectedChartId ?? preferredChartId}
            onSelect={setSelectedChartId}
          />
        </section>

        <aside className="forensics-stack" aria-label="컬럼 및 미리보기">
          <ColumnSummary profiles={profiles} />
          <DataPreview data={parsed.data} />
        </aside>
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
