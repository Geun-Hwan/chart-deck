import monthlySales from './samples/monthly-sales.csv?raw';
import categoryMetrics from './samples/category-metrics.csv?raw';
import largeTimeseries from './samples/large-timeseries.csv?raw';

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
    description: '날짜 흐름과 매출 추이를 바로 확인할 수 있습니다.',
    text: monthlySales,
  },
  {
    id: 'category-metrics',
    name: '카테고리 지표',
    description: '범주별 비교와 비중 차트를 확인할 수 있습니다.',
    text: categoryMetrics,
  },
  {
    id: 'large-timeseries',
    name: '대량 시계열',
    description: '많은 지점을 전체 흐름과 구간 선택으로 확인할 수 있습니다.',
    text: largeTimeseries,
  },
];
