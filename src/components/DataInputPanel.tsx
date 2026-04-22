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
    <section className="input-studio" aria-labelledby="input-studio-title">
      <div className="input-heading">
        <span>1</span>
        <div>
          <h2 id="input-studio-title">차트 비교용 데이터를 불러오세요</h2>
          <p>샘플 CSV로 먼저 살펴보고, 파일 선택이나 붙여넣기로 바로 이어서 비교할 수 있습니다.</p>
        </div>
      </div>

      <div className="sample-stack" aria-label="샘플 데이터 선택">
        {sampleDatasets.map((sample, index) => (
          <button
            key={sample.id}
            type="button"
            className={index === 0 ? 'sample-card hero-sample' : 'sample-card'}
            aria-label={`샘플 불러오기: ${sample.name}`}
            onClick={() => onLoadSample(sample)}
          >
            <span>{index === 0 ? '추천 샘플' : '샘플'}</span>
            <strong>{sample.name.replace(/\s*CSV$/u, '')}</strong>
            <small>{sample.description}</small>
          </button>
        ))}
      </div>

      <div className="input-actions" role="group" aria-label="데이터 입력 방식">
        <label className="file-action">
          <span>CSV 파일 선택</span>
          <small>파일 내용은 브라우저 안에서만 읽고 서버로 보내지 않습니다.</small>
          <input type="file" accept=".csv,text/csv,text/plain" onChange={handleFileChange} />
        </label>

        <button
          type="button"
          className="paste-toggle"
          aria-expanded={isPasteOpen}
          aria-controls="csv-paste-panel"
          aria-label={isPasteOpen ? 'CSV 붙여넣기 닫기' : 'CSV 붙여넣기 열기'}
          ref={pasteToggleRef}
          onClick={() => setIsPasteOpen((value) => !value)}
        >
          CSV 붙여넣기 {isPasteOpen ? '닫기' : '열기'}
        </button>

        {isPasteOpen ? (
          <div id="csv-paste-panel" className="text-input paste-panel" role="region" aria-labelledby="csv-paste-label">
            <label id="csv-paste-label" htmlFor="csv-textarea">CSV 텍스트 붙여넣기</label>
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
          입력 지우기
        </button>
      </div>
    </section>
  );
}
