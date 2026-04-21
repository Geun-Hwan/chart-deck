import type { ColumnProfile } from '../lib/dataTypes';

const typeLabels: Record<ColumnProfile['type'], string> = {
  number: '숫자',
  category: '범주',
  date: '날짜 후보',
  unknown: '불명확',
};

type Props = {
  profiles: ColumnProfile[];
};

export function ColumnSummary({ profiles }: Props) {
  if (profiles.length === 0) {
    return (
      <section className="panel empty-panel">
        <h2>컬럼 타입 요약</h2>
        <p>파싱된 데이터가 있으면 컬럼 타입 추론 결과가 표시됩니다.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Inference</p>
        <h2>컬럼 타입 요약</h2>
      </div>
      <div className="column-grid">
        {profiles.map((profile) => (
          <article key={profile.name} className={`column-card type-${profile.type}`}>
            <div>
              <strong>{profile.name}</strong>
              <span>{typeLabels[profile.type]}</span>
            </div>
            <p>비어있지 않은 값 {profile.nonEmptyCount}개 · 고유값 {profile.uniqueCount}개</p>
            <small>예시: {profile.examples.join(', ') || '없음'}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
