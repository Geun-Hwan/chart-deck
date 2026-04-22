import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const monthlyCsvPath = join(here, '../src/test/fixtures/monthly-sales.csv');
const largeCsvPath = join(here, '../src/test/fixtures/large-timeseries.csv');

test('초기 화면은 기능 없는 흐름 버튼 없이 입력 대기 상태를 보여준다', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /CSV를 차트 감각으로 바꾸는 실험실/ })).toBeVisible();
  await expect(page.locator('.mission-panel__source strong')).toHaveText('아직 데이터 없음');
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
  await expect(page.locator('.choice-strip').getByRole('button')).toHaveCount(5);
  await expect(page.locator('.choice-strip').getByRole('button', { name: /선 차트 선택/ })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /막대 차트/ }).click();
  await expect(page.getByText('지금 가장 먼저 볼 차트')).toBeVisible();
  await expect(page.getByRole('heading', { name: '막대 차트' }).first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first()).toBeVisible();
  await expect(page.locator('.choice-strip').getByRole('button', { name: /막대 차트 선택/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.choice-strip').getByText('현재 선택됨')).toHaveCount(1);
});

test('범주형 차트는 동일 범주를 합산해 중복 라벨을 줄인다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /월별 매출 CSV/ }).click();
  await page.getByRole('button', { name: /막대 차트/ }).click();

  const chart = page.getByRole('img', { name: '막대 차트 시각화, 3개 지점' }).first();
  await expect(chart).toBeVisible();
  await expect(chart.locator('text')).toHaveText(['검색', '광고', '추천']);
});

test('CSV 파일 선택과 데이터 비우기가 실제로 동작한다', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('내 CSV 파일 열기').setInputFiles(monthlyCsvPath);
  await expect(page.locator('.mission-panel__source strong')).toHaveText('내 CSV · monthly-sales.csv');
  await expect(page.getByRole('heading', { name: '이 데이터로 무엇을 볼까요?' })).toBeVisible();

  await page.getByRole('button', { name: '데이터 비우기' }).click();
  await expect(page.locator('.mission-panel__source strong')).toHaveText('아직 데이터 없음');
  await expect(page.getByRole('heading', { name: '아직 차트를 고를 데이터가 없습니다' })).toBeVisible();
});

test('CSV 텍스트 붙여넣기 흐름도 로컬 입력으로 선 차트를 추천한다', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('브라우저 로컬 처리')).toBeVisible();
  await expect(page.getByText('서버 업로드 없음')).toBeVisible();
  await page.getByRole('button', { name: /CSV 텍스트 붙여넣기 열기/ }).click();
  await page.getByRole('textbox', { name: 'CSV 텍스트' }).fill('day,value,group\n2026-01-01,10,A\n2026-01-02,15,A\n2026-01-03,13,B');

  await expect(page.locator('.mission-panel__source strong')).toHaveText('직접 붙여넣은 CSV');
  await expect(page.getByRole('heading', { name: '이 데이터로 무엇을 볼까요?' })).toBeVisible();
  await expect(page.getByText('지금 가장 먼저 볼 차트')).toBeVisible();
  await expect(page.getByRole('heading', { name: '선 차트' }).first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first().locator('circle')).toHaveCount(3);
});

test('대량 CSV는 차트 지점을 샘플링해 렌더링한다', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('내 CSV 파일 열기').setInputFiles(largeCsvPath);
  await expect(page.locator('.mission-panel__source strong')).toHaveText('내 CSV · large-timeseries.csv');
  await expect(page.getByText('지금 가장 먼저 볼 차트')).toBeVisible();
  await expect(page.getByRole('heading', { name: '선 차트' }).first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first()).toBeVisible();
  await expect(page.getByTestId('sampling-note').first()).toContainText('120개 중 36개');
});

test('산점도는 행 순서가 아니라 첫 번째 숫자 컬럼을 x축으로 사용한다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /CSV 텍스트 붙여넣기 열기/ }).click();
  await page.getByRole('textbox', { name: 'CSV 텍스트' }).fill('x,y,group\n100,1,A\n0,5,B\n50,3,C');

  await expect(page.getByRole('heading', { name: '산점도' }).first()).toBeVisible();
  const circles = page.getByTestId('chart-svg').first().locator('circle');
  await expect(circles).toHaveCount(3);

  const firstCx = Number(await circles.nth(0).getAttribute('cx'));
  const secondCx = Number(await circles.nth(1).getAttribute('cx'));
  const thirdCx = Number(await circles.nth(2).getAttribute('cx'));
  expect(firstCx).toBeGreaterThan(thirdCx);
  expect(thirdCx).toBeGreaterThan(secondCx);
});

test('키보드 입력과 오류 알림은 접근성 역할을 유지한다', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.empty-compass span')).toHaveAttribute('aria-hidden', 'true');
  const firstSampleButton = page.getByRole('button', { name: /월별 매출 CSV/ });
  await page.keyboard.press('Tab');
  await expect(firstSampleButton).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('.mission-panel__source strong')).toHaveText('월별 매출 CSV');

  const pasteToggle = page.getByRole('button', { name: /CSV 텍스트 붙여넣기/ });
  await pasteToggle.click();
  await expect(pasteToggle).toHaveAttribute('aria-expanded', 'true');

  const pasteTextarea = page.getByRole('textbox', { name: 'CSV 텍스트' });
  await expect(pasteTextarea).toBeFocused();
  await expect(page.getByRole('region', { name: 'CSV 텍스트' })).toHaveAttribute('id', 'csv-paste-panel');
  await pasteTextarea.fill('header-only');

  const closeToggle = page.getByRole('button', { name: /CSV 텍스트 붙여넣기 닫기/ });
  await closeToggle.click();
  await expect(page.getByRole('button', { name: /CSV 텍스트 붙여넣기 열기/ })).toBeFocused();
  await expect(page.getByRole('button', { name: /CSV 텍스트 붙여넣기 열기/ })).toHaveAttribute('aria-expanded', 'false');

  await expect(page.getByRole('alert')).toContainText('헤더와 최소 1개 이상의 데이터 행이 필요합니다.');
});
