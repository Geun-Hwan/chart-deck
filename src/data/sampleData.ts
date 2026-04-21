import monthlySales from './samples/monthly-sales.csv?raw';
import categoryMetrics from './samples/category-metrics.csv?raw';

export type SampleDataset = {
  id: string;
  name: string;
  description: string;
  text: string;
};

export const sampleDatasets: SampleDataset[] = [
  {
    id: 'monthly-sales',
    name: '월별 매출 CSV',
    description: '날짜 흐름, 매출, 방문자 수를 비교하는 기본 CSV입니다.',
    text: monthlySales,
  },
  {
    id: 'category-metrics',
    name: '카테고리 지표 CSV',
    description: '범주와 숫자 지표로 막대/파이 차트를 확인하는 CSV입니다.',
    text: categoryMetrics,
  },
];
