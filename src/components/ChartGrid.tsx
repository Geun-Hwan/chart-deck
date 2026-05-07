import { useRef } from 'react';
import type { ChartCandidate, DataRow } from '../lib/dataTypes';
import { ChartCard } from './ChartCard';

type Props = {
  candidates: ChartCandidate[];
  rows: DataRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ChartGrid({ candidates, rows, selectedId, onSelect }: Props) {
  const choiceStripRef = useRef<HTMLDivElement>(null);

  if (candidates.length === 0) {
    return (
      <section className="empty-compass" aria-labelledby="empty-compass-title">
        <span aria-hidden="true">?</span>
        <h2 id="empty-compass-title">차트를 보려면 데이터가 필요합니다</h2>
        <p>샘플을 열거나 CSV를 넣으면 차트 후보를 바로 비교할 수 있습니다.</p>
        <div className="empty-compass__steps" aria-label="시작 순서">
          <article>
            <strong>1. 데이터 선택</strong>
            <p>입력 패널에서 샘플을 고르거나 CSV를 불러옵니다.</p>
          </article>
          <article>
            <strong>2. 차트 후보 확인</strong>
            <p>컬럼 타입을 해석해 가능한 차트부터 보여줍니다.</p>
          </article>
          <article>
            <strong>3. 후보 비교</strong>
            <p>대표 차트와 다른 후보를 바로 눌러 표현 방식을 비교합니다.</p>
          </article>
        </div>
      </section>
    );
  }

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0];
  const scrollChoices = (direction: -1 | 1) => {
    const strip = choiceStripRef.current;
    if (!strip) return;
    strip.scrollBy({
      left: direction * Math.max(220, strip.clientWidth * 0.72),
      behavior: 'smooth',
    });
  };

  return (
    <section className="chart-compass" aria-labelledby="chart-compass-title">
      <div className="compass-header">
        <div>
          <p className="eyebrow">차트 후보</p>
          <h2 id="chart-compass-title">데이터를 어떤 형태로 볼까요?</h2>
        </div>
        <p>첫 후보를 기준으로 시작하되, 표현 방식은 언제든 바꿀 수 있습니다.</p>
      </div>
      {selected ? (
        <div className="compass-main">
          <ChartCard candidate={selected} rows={rows} featured />
        </div>
      ) : null}

      <div className="choice-navigation" role="group" aria-label="차트 후보 캐러셀">
        <button type="button" className="choice-nav-button" aria-label="차트 후보 왼쪽으로 이동" onClick={() => scrollChoices(-1)}>
          <span aria-hidden="true">←</span>
        </button>
        <div ref={choiceStripRef} className="choice-strip" aria-label="차트 후보 선택">
          {candidates.map((candidate) => {
            const isSelected = candidate.id === selected?.id;
            return (
              <button
                key={candidate.id}
                type="button"
                className={`choice-chip status-${candidate.status} ${isSelected ? 'is-selected' : ''}`}
                aria-pressed={isSelected}
                aria-label={`${candidate.title} 선택 · ${statusText(candidate.status)}${isSelected ? ' · 현재 선택됨' : ''}`}
                onClick={() => onSelect(candidate.id)}
              >
                <span>{statusText(candidate.status)}</span>
                <strong>{candidate.title}</strong>
                {isSelected ? <em>현재 선택됨</em> : null}
              </button>
            );
          })}
        </div>
        <button type="button" className="choice-nav-button" aria-label="차트 후보 오른쪽으로 이동" onClick={() => scrollChoices(1)}>
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className="choice-scroll-hint">목록에서 다른 표현 방식을 선택할 수 있습니다.</p>
    </section>
  );
}

function statusText(status: ChartCandidate['status']): string {
  if (status === 'ready') return '바로 보기';
  if (status === 'warning') return '대체 기준';
  if (status === 'placeholder') return '데이터 부족';
  return '오류';
}
