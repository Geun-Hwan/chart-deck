import type { ChartCandidate, ColumnProfile } from './dataTypes';

const statusRank: Record<ChartCandidate['status'], number> = {
  ready: 0,
  warning: 1,
  placeholder: 2,
  error: 3,
};

function firstByType(profiles: ColumnProfile[], type: ColumnProfile['type']): ColumnProfile | undefined {
  return profiles.find((profile) => profile.type === type);
}

function allByType(profiles: ColumnProfile[], type: ColumnProfile['type']): ColumnProfile[] {
  return profiles.filter((profile) => profile.type === type);
}

export function buildChartCandidates(profiles: ColumnProfile[]): ChartCandidate[] {
  const numberColumns = allByType(profiles, 'number');
  const categoryColumn = firstByType(profiles, 'category');
  const dateColumn = firstByType(profiles, 'date');
  const firstNumber = numberColumns[0];
  const secondNumber = numberColumns[1];

  const candidates: ChartCandidate[] = [
    categoryColumn && firstNumber
      ? {
          id: 'bar',
          title: '막대 차트',
          status: 'ready',
          reason: `${categoryColumn.name} 범주와 ${firstNumber.name} 숫자 값을 비교할 수 있습니다.`,
          categoryKey: categoryColumn.name,
          valueKey: firstNumber.name,
        }
      : {
          id: 'bar',
          title: '막대 차트',
          status: 'placeholder',
          reason: '범주형 컬럼 1개와 숫자형 컬럼 1개가 필요합니다.',
        },
    dateColumn && firstNumber
      ? {
          id: 'line',
          title: '선 차트',
          status: 'ready',
          reason: `${dateColumn.name} 날짜 흐름에 따라 ${firstNumber.name} 값을 표시할 수 있습니다.`,
          xKey: dateColumn.name,
          yKey: firstNumber.name,
        }
      : categoryColumn && firstNumber
        ? {
            id: 'line',
            title: '선 차트',
            status: 'warning',
            reason: '날짜 컬럼이 없어 범주 순서 기반 더미/대체 선 차트로 표시합니다.',
            xKey: categoryColumn.name,
            yKey: firstNumber.name,
          }
        : {
            id: 'line',
            title: '선 차트',
            status: 'placeholder',
            reason: '날짜 또는 범주 컬럼과 숫자형 컬럼이 필요합니다.',
          },
    firstNumber && secondNumber
      ? {
          id: 'scatter',
          title: '산점도',
          status: 'ready',
          reason: `${firstNumber.name}와 ${secondNumber.name} 두 숫자 컬럼의 관계를 볼 수 있습니다.`,
          xKey: firstNumber.name,
          yKey: secondNumber.name,
        }
      : {
          id: 'scatter',
          title: '산점도',
          status: 'placeholder',
          reason: '숫자형 컬럼 2개 이상이 필요합니다.',
        },
    categoryColumn && firstNumber
      ? {
          id: 'pie',
          title: '파이 차트',
          status: 'ready',
          reason: `${categoryColumn.name} 범주의 ${firstNumber.name} 비중을 볼 수 있습니다.`,
          categoryKey: categoryColumn.name,
          valueKey: firstNumber.name,
        }
      : {
          id: 'pie',
          title: '파이 차트',
          status: 'placeholder',
          reason: '범주형 컬럼 1개와 숫자형 컬럼 1개가 필요합니다.',
        },
    dateColumn && firstNumber
      ? {
          id: 'area',
          title: '영역 차트',
          status: 'ready',
          reason: `${firstNumber.name} 값의 시간 흐름을 누적감 있게 볼 수 있습니다.`,
          xKey: dateColumn.name,
          yKey: firstNumber.name,
        }
      : {
          id: 'area',
          title: '영역 차트',
          status: 'placeholder',
          reason: '날짜형 컬럼과 숫자형 컬럼이 필요합니다.',
        },
  ];

  return sortChartCandidates(candidates, Boolean(dateColumn && firstNumber));
}

export function sortChartCandidates(candidates: ChartCandidate[], preferTimeSeries = false): ChartCandidate[] {
  const defaultPriority: Record<ChartCandidate['id'], number> = { bar: 0, line: 1, area: 2, scatter: 3, pie: 4 };
  const timeSeriesPriority: Record<ChartCandidate['id'], number> = { line: 0, area: 1, bar: 2, scatter: 3, pie: 4 };
  const priority = preferTimeSeries ? timeSeriesPriority : defaultPriority;

  return [...candidates].sort((a, b) => {
    const statusDelta = statusRank[a.status] - statusRank[b.status];
    if (statusDelta !== 0) return statusDelta;
    return priority[a.id] - priority[b.id];
  });
}
