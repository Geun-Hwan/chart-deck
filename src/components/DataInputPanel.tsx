import type { ChangeEvent } from 'react';
import type { SampleDataset } from '../data/sampleData';
import { sampleDatasets } from '../data/sampleData';
import { readTextFile } from '../lib/fileInput';

type Props = {
  inputText: string;
  onTextChange: (text: string) => void;
  onLoadSample: (sample: SampleDataset) => void;
  onFileText: (text: string, fileName: string) => void;
  onError: (message: string) => void;
};

export function DataInputPanel({ inputText, onTextChange, onLoadSample, onFileText, onError }: Props) {
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
      <div className="section-heading">
        <p className="eyebrow">입력</p>
        <h2>데이터 넣기</h2>
      </div>
      <p className="hint">데이터는 서버로 전송되지 않고 현재 브라우저에서만 처리됩니다.</p>

      <div className="sample-list" aria-label="샘플 데이터 목록">
        {sampleDatasets.map((sample) => (
          <button key={sample.id} type="button" onClick={() => onLoadSample(sample)}>
            <strong>{sample.name}</strong>
            <span>{sample.description}</span>
          </button>
        ))}
      </div>

      <label className="file-picker">
        <span>CSV 파일 선택</span>
        <input type="file" accept=".csv,text/csv,text/plain" onChange={handleFileChange} />
      </label>

      <label className="text-input">
        <span>직접 입력 또는 붙여넣기</span>
        <textarea
          value={inputText}
          onChange={(event) => onTextChange(event.target.value)}
          spellCheck={false}
          placeholder="예: name,value\nA,10\nB,20"
        />
      </label>
    </section>
  );
}
