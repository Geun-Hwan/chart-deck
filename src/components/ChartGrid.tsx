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
        <p>샘플 CSV를 선택하거나 내 CSV를 불러오면 큰 차트와 대안 후보를 바로 비교할 수 있습니다.</p>
        <div className="empty-compass__steps" aria-label="시작 순서">
          <article>
            <strong>1. 데이터 선택</strong>
            <p>왼쪽 패널에서 샘플을 고르거나 CSV를 불러옵니다.</p>
          </article>
          <article>
            <strong>2. 차트 자동 추천</strong>
            <p>컬럼 타입을 해석해 어울리는 차트를 먼저 제안합니다.</p>
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
          <p className="eyebrow">Chart Compass</p>
          <h2 id="chart-compass-title">어떤 차트가 어울릴까요?</h2>
        </div>
        <p>선택한 차트를 넓게 확인하고, 아래 후보를 눌러 다른 표현도 비교해보세요.</p>
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
      <p className="choice-scroll-hint">후보가 잘리면 좌우 이동 버튼이나 가로 스크롤로 다른 관점을 계속 확인하세요.</p>
    </section>
  );
}

function statusText(status: ChartCandidate['status']): string {
  if (status === 'ready') return '바로 보기';
  if (status === 'warning') return '확인 필요';
  if (status === 'placeholder') return '조건 부족';
  return '오류';
}
