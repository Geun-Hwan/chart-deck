import type { ParsedData } from '../lib/dataTypes';

type Props = {
  data: ParsedData | null;
};

export function DataPreview({ data }: Props) {
  if (!data) {
    return <EmptyPanel title="데이터 미리보기" message="샘플을 선택하거나 데이터를 입력하면 표 미리보기가 표시됩니다." />;
  }

  const previewRows = data.rows.slice(0, 8);
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Preview</p>
        <h2>데이터 미리보기</h2>
      </div>
      <p className="hint">총 {data.rows.length.toLocaleString('ko-KR')}행 · 구분자 {data.delimiter === '\t' ? '탭' : '쉼표'}</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{data.columns.map((column) => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {previewRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {data.columns.map((column) => <td key={column}>{row[column] ?? '-'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyPanel({ title, message }: { title: string; message: string }) {
  return (
    <section className="panel empty-panel">
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}
