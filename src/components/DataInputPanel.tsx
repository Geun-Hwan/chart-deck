import type { ChangeEvent, KeyboardEvent } from 'react';
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
  const pasteCloseRef = useRef<HTMLButtonElement>(null);
  const pasteApplyRef = useRef<HTMLButtonElement>(null);
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

  function closePasteDialog() {
    setIsPasteOpen(false);
  }

  function handlePasteDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePasteDialog();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusableCandidates: Array<HTMLElement | null> = [pasteCloseRef.current, pasteTextareaRef.current, pasteApplyRef.current];
    const focusableElements = focusableCandidates.filter(
      (element): element is HTMLElement => element !== null,
    );
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
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

      <div className="input-actions" role="toolbar" aria-label="데이터 입력 바로가기">
        <label className="file-action">
          <span>CSV 파일 선택</span>
          <small>파일 내용은 브라우저 안에서만 읽고 서버로 보내지 않습니다.</small>
          <input type="file" accept=".csv,text/csv,text/plain" onChange={handleFileChange} />
        </label>

        <button
          type="button"
          className="paste-toggle"
          aria-haspopup="dialog"
          aria-expanded={isPasteOpen}
          aria-controls="csv-paste-dialog"
          aria-label={isPasteOpen ? 'CSV 붙여넣기 닫기' : 'CSV 붙여넣기 열기'}
          ref={pasteToggleRef}
          onClick={() => setIsPasteOpen((value) => !value)}
        >
          CSV 붙여넣기
        </button>

        <button type="button" className="clear-button" onClick={onClear} disabled={inputText.trim().length === 0}>
          입력 지우기
        </button>
      </div>

      {isPasteOpen ? (
        <div
          className="paste-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePasteDialog();
            }
          }}
        >
          <div
            id="csv-paste-dialog"
            className="paste-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="csv-paste-title"
            aria-describedby="csv-paste-description"
            onKeyDown={handlePasteDialogKeyDown}
          >
            <div className="paste-dialog__header">
              <div>
                <p className="eyebrow">Quick paste</p>
                <h3 id="csv-paste-title">CSV 텍스트 붙여넣기</h3>
              </div>
              <button type="button" className="dialog-close" ref={pasteCloseRef} onClick={closePasteDialog}>
                창 닫기
              </button>
            </div>

            <div className="text-input paste-dialog__body">
              <label htmlFor="csv-textarea">CSV 텍스트 붙여넣기</label>
              <p id="csv-paste-description">
                붙여넣는 즉시 차트 비교에 반영됩니다. 데이터는 브라우저 안에서만 처리됩니다.
              </p>
              <textarea
                id="csv-textarea"
                ref={pasteTextareaRef}
                value={inputText}
                onChange={(event) => onTextChange(event.target.value)}
                spellCheck={false}
                aria-describedby="csv-paste-description"
                placeholder="month,revenue\n2026-01-01,1200000"
              />
            </div>

            <div className="paste-dialog__actions">
              <button type="button" className="paste-apply" ref={pasteApplyRef} onClick={closePasteDialog}>
                차트에 반영하고 닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
