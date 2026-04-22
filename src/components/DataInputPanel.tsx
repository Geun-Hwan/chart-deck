import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { SampleDataset } from '../data/sampleData';
import { sampleDatasets } from '../data/sampleData';
import { readTextFile } from '../lib/fileInput';

type Props = {
  inputText: string;
  onTextChange: (text: string) => void;
  onLoadSample: (sample: SampleDataset) => void;
  onFileText: (text: string, fileName: string) => void;
  onError: (message: string) => void;
  onClear: () => void;
};

export function DataInputPanel({ inputText, onTextChange, onLoadSample, onFileText, onError, onClear }: Props) {
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const pasteToggleRef = useRef<HTMLButtonElement>(null);
  const pasteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const wasPasteOpenRef = useRef(false);

  useEffect(() => {
    if (isPasteOpen) {
      pasteTextareaRef.current?.focus();
    } else if (wasPasteOpenRef.current) {
      pasteToggleRef.current?.focus();
    }
    wasPasteOpenRef.current = isPasteOpen;
  }, [isPasteOpen]);

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
    <section className="input-studio">
      <div className="input-heading">
        <span>1</span>
        <div>
          <h2>데이터를 고르세요</h2>
          <p>처음이면 샘플 CSV 하나만 눌러도 됩니다.</p>
        </div>
      </div>

      <div className="sample-stack" aria-label="샘플 CSV 목록">
        {sampleDatasets.map((sample, index) => (
          <button key={sample.id} type="button" className={index === 0 ? 'sample-card hero-sample' : 'sample-card'} onClick={() => onLoadSample(sample)}>
            <span>{index === 0 ? '처음 추천' : '다른 관점'}</span>
            <strong>{sample.name}</strong>
            <small>{sample.description}</small>
          </button>
        ))}
      </div>

      <div className="input-actions">
        <label className="file-action">
          <span>내 CSV 파일 열기</span>
          <small>업로드가 아니라 브라우저 안에서만 읽습니다.</small>
          <input type="file" accept=".csv,text/csv,text/plain" onChange={handleFileChange} />
        </label>

        <button
          type="button"
          className="paste-toggle"
          aria-expanded={isPasteOpen}
          aria-controls="csv-paste-panel"
          ref={pasteToggleRef}
          onClick={() => setIsPasteOpen((value) => !value)}
        >
          CSV 텍스트 붙여넣기 {isPasteOpen ? '닫기' : '열기'}
        </button>

        {isPasteOpen ? (
          <div id="csv-paste-panel" className="text-input paste-panel" role="region" aria-labelledby="csv-paste-label">
            <label id="csv-paste-label" htmlFor="csv-textarea">CSV 텍스트</label>
            <textarea
              id="csv-textarea"
              ref={pasteTextareaRef}
              value={inputText}
              onChange={(event) => onTextChange(event.target.value)}
              spellCheck={false}
              placeholder="month,revenue\n2026-01-01,1200000"
            />
          </div>
        ) : null}

        <button type="button" className="clear-button" onClick={onClear} disabled={inputText.trim().length === 0}>
          데이터 비우기
        </button>
      </div>
    </section>
  );
}
