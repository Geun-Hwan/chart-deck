import type { ChangeEvent } from 'react';
import { useState } from 'react';
import type { SampleDataset } from '../data/sampleData';
import { sampleDatasets } from '../data/sampleData';
import { readTextFile } from '../lib/fileInput';

type InputMode = 'sample' | 'paste' | 'file';

type Props = {
  inputText: string;
  onTextChange: (text: string) => void;
  onLoadSample: (sample: SampleDataset) => void;
  onFileText: (text: string, fileName: string) => void;
  onError: (message: string) => void;
};

const modes: Array<{ id: InputMode; label: string; description: string }> = [
  { id: 'sample', label: '샘플로 시작', description: '바로 차트 후보를 확인합니다.' },
  { id: 'paste', label: '붙여넣기', description: '표 데이터를 직접 넣습니다.' },
  { id: 'file', label: 'CSV 파일', description: '로컬 파일만 읽습니다.' },
];

export function DataInputPanel({ inputText, onTextChange, onLoadSample, onFileText, onError }: Props) {
  const [mode, setMode] = useState<InputMode>('sample');

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await readTextFile(file);
    if (!result.ok) {
      onError(result.error);
      return;
    }
    onFileText(result.text, file.name);
  }

  return (
    <section className="panel input-panel">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">Step 1</p>
          <h2>데이터 선택</h2>
        </div>
        <span className="soft-badge">로컬 처리</span>
      </div>
      <p className="hint">가장 쉬운 방법부터 선택하세요. CSV와 붙여넣기는 1MB·5,000행까지만 처리합니다.</p>

      <div className="mode-tabs" aria-label="데이터 입력 방식">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={mode === item.id ? 'active' : ''}
            onClick={() => setMode(item.id)}
            aria-pressed={mode === item.id}
          >
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </button>
        ))}
      </div>

      {mode === 'sample' ? (
        <div className="sample-list" aria-label="샘플 데이터 목록">
          {sampleDatasets.map((sample, index) => (
            <button key={sample.id} type="button" className={index === 0 ? 'primary-sample' : ''} onClick={() => onLoadSample(sample)}>
              <strong>{index === 0 ? `추천 시작점 · ${sample.name}` : sample.name}</strong>
              <span>{sample.description}</span>
            </button>
          ))}
        </div>
      ) : null}

      {mode === 'paste' ? (
        <label className="text-input">
          <span>직접 입력 또는 붙여넣기</span>
          <textarea
            value={inputText}
            onChange={(event) => onTextChange(event.target.value)}
            spellCheck={false}
            placeholder="예: name,value\nA,10\nB,20"
          />
        </label>
      ) : null}

      {mode === 'file' ? (
        <label className="file-picker file-dropzone">
          <span>CSV 파일 선택</span>
          <small>파일은 업로드되지 않고 브라우저에서만 읽습니다.</small>
          <input type="file" accept=".csv,text/csv,text/plain" onChange={handleFileChange} />
        </label>
      ) : null}
    </section>
  );
}
