export type SampleDataset = {
  id: string;
  name: string;
  description: string;
  text: string;
};

export const sampleDatasets: SampleDataset[] = [
  {
    id: 'monthly-sales',
    name: '월별 매출',
    description: '날짜, 매출, 방문자 숫자가 있어 선/영역/산점도 후보를 확인하기 좋습니다.',
    text: `month,revenue,visitors,channel
2026-01-01,1200000,3200,검색
2026-02-01,1420000,3600,검색
2026-03-01,1350000,3400,광고
2026-04-01,1680000,4100,추천
2026-05-01,1800000,4500,추천`,
  },
  {
    id: 'category-metrics',
    name: '카테고리별 지표',
    description: '범주와 숫자 값이 있어 막대/파이 차트 후보를 확인하기 좋습니다.',
    text: `category,count,conversion
도서,340,12.5
전자기기,220,8.3
생활용품,510,15.1
패션,430,11.2
식품,620,18.4`,
  },
];
