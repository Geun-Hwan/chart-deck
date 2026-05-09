import type { ParsedData } from '../lib/dataTypes';

type Props = {
  data: ParsedData | null;
};

export function DataPreview({ data }: Props) {
  if (!data) {
    return <EmptyPanel title="미리보기" message="데이터를 입력하면 표 미리보기가 표시됩니다." />;
  }

  const previewRows = data.rows.slice(0, 5);
  return (
    <section className="panel quiet-panel">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">미리보기</p>
          <h2>표 미리보기</h2>
        </div>
        <span className="soft-badge">{previewRows.length}행</span>
      </div>
      <details className="preview-details" open>
        <summary>{data.rows.length.toLocaleString('ko-KR')}행 중 {previewRows.length}행 미리보기 · {data.delimiter === '\t' ? '탭' : '쉼표'} 구분</summary>
        <div className="table-wrap compact-table">
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
      </details>
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
