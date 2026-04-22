import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const monthlyCsvPath = join(here, '../src/test/fixtures/monthly-sales.csv');
const largeCsvPath = join(here, '../src/test/fixtures/large-timeseries.csv');

test('초기 화면은 기능 없는 흐름 버튼 없이 입력 대기 상태를 보여준다', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /CSV를 차트 감각으로 바꾸는 실험실/ })).toBeVisible();
  await expect(page.locator('.stage-topline strong')).toHaveText('아직 데이터 없음');
  await expect(page.getByRole('heading', { name: '아직 차트를 고를 데이터가 없습니다' })).toBeVisible();
  await expect(page.getByRole('button', { name: /처음 추천/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /입력/ })).toHaveCount(0);
});

test('샘플 CSV를 선택하면 추천 차트와 대안 선택이 동작한다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /월별 매출 CSV/ }).click();

  await expect(page.getByText('월별 매출 CSV').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: '이 데이터로 무엇을 볼까요?' })).toBeVisible();
  await expect(page.getByText('지금 가장 먼저 볼 차트')).toBeVisible();
  await expect(page.getByRole('heading', { name: '선 차트' }).first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first().locator('circle')).toHaveCount(5);

  await page.getByRole('button', { name: /막대 차트/ }).click();
  await expect(page.getByText('지금 가장 먼저 볼 차트')).toBeVisible();
  await expect(page.getByRole('heading', { name: '막대 차트' }).first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first()).toBeVisible();
});

test('CSV 파일 선택과 데이터 비우기가 실제로 동작한다', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('내 CSV 파일 열기').setInputFiles(monthlyCsvPath);
  await expect(page.locator('.stage-topline strong')).toHaveText('내 CSV · monthly-sales.csv');
  await expect(page.getByRole('heading', { name: '이 데이터로 무엇을 볼까요?' })).toBeVisible();

  await page.getByRole('button', { name: '데이터 비우기' }).click();
  await expect(page.locator('.stage-topline strong')).toHaveText('아직 데이터 없음');
  await expect(page.getByRole('heading', { name: '아직 차트를 고를 데이터가 없습니다' })).toBeVisible();
});


test('대량 CSV는 차트 지점을 샘플링해 렌더링한다', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('내 CSV 파일 열기').setInputFiles(largeCsvPath);
  await expect(page.locator('.stage-topline strong')).toHaveText('내 CSV · large-timeseries.csv');
  await expect(page.getByTestId('chart-svg').first()).toBeVisible();
  await expect(page.getByTestId('sampling-note').first()).toContainText('120개 중 36개');
});
