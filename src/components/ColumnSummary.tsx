import type { ColumnProfile } from '../lib/dataTypes';

const typeLabels: Record<ColumnProfile['type'], string> = {
  number: '숫자',
  category: '범주',
  date: '날짜 후보',
  unknown: '확인 필요',
};

type Props = {
  profiles: ColumnProfile[];
};

export function ColumnSummary({ profiles }: Props) {
  if (profiles.length === 0) {
    return (
      <section className="panel empty-panel">
        <h2>데이터 이해</h2>
        <p>파싱된 데이터가 있으면 컬럼 해석 결과가 표시됩니다.</p>
      </section>
    );
  }

  return (
    <section className="panel quiet-panel">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">데이터 해석</p>
          <h2>데이터 이해</h2>
        </div>
        <span className="soft-badge">{profiles.length}개 컬럼</span>
      </div>
      <div className="column-list">
        {profiles.map((profile) => (
          <article key={profile.name} className={`column-row type-${profile.type}`}>
            <div>
              <strong>{profile.name}</strong>
              <span>{typeLabels[profile.type]}</span>
            </div>
            <p>예시 {profile.examples.join(', ') || '없음'} · 신뢰도 {Math.round(profile.confidence * 100)}%</p>
          </article>
        ))}
      </div>
    </section>
  );
}
