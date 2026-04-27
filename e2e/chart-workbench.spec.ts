import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const monthlyCsvPath = join(here, '../src/test/fixtures/monthly-sales.csv');
const largeCsvPath = join(here, '../src/test/fixtures/large-timeseries.csv');

test('초기 화면은 기능 없는 흐름 버튼 없이 입력 대기 상태를 보여준다', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /차트 비교용 데이터를 불러오세요/ })).toBeVisible();
  await expect(page.locator('.mission-panel__source strong')).toHaveText('아직 데이터 없음');
  await expect(page.getByRole('heading', { name: '차트를 보려면 데이터가 필요합니다' })).toBeVisible();
  await expect(page.getByRole('button', { name: /샘플 불러오기: 월별 매출 CSV/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '입력 지우기' })).toBeDisabled();
});

test('샘플 CSV를 선택하면 추천 차트와 대안 선택이 동작한다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /샘플 불러오기: 월별 매출 CSV/ }).click();

  await expect(page.getByText('월별 매출 CSV').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: '어떤 차트가 어울릴까요?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '선 차트' }).first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first().locator('circle')).toHaveCount(5);
  await expect(page.locator('.choice-strip').getByRole('button')).toHaveCount(5);
  await expect(page.locator('.choice-strip').getByRole('button', { name: /선 차트 선택/ })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /막대 차트/ }).click();
  await expect(page.getByRole('heading', { name: '막대 차트' }).first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first()).toBeVisible();
  await expect(page.locator('.choice-strip').getByRole('button', { name: /막대 차트 선택/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.choice-strip').getByText('현재 선택됨')).toHaveCount(1);
});

test('차트 후보 캐러셀은 좌우 이동 버튼으로 넘길 수 있다', async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await page.goto('/');

  await page.getByRole('button', { name: /샘플 불러오기: 월별 매출 CSV/ }).click();
  const choiceStrip = page.locator('.choice-strip');
  await expect(page.getByRole('group', { name: '차트 후보 캐러셀' })).toBeVisible();
  await expect(page.getByRole('button', { name: '차트 후보 왼쪽으로 이동' })).toBeVisible();
  await expect(page.getByRole('button', { name: '차트 후보 오른쪽으로 이동' })).toBeVisible();
  await expect(choiceStrip.getByRole('button')).toHaveCount(5);

  await page.getByRole('button', { name: '차트 후보 오른쪽으로 이동' }).click();
  await expect.poll(() => choiceStrip.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);

  await page.getByRole('button', { name: '차트 후보 왼쪽으로 이동' }).click();
  await expect.poll(() => choiceStrip.evaluate((element) => element.scrollLeft)).toBe(0);
});

test('범주형 차트는 동일 범주를 합산해 중복 라벨을 줄인다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /월별 매출 CSV/ }).click();
  await page.getByRole('button', { name: /막대 차트/ }).click();

  const chart = page.getByRole('img', { name: '막대 차트 시각화, 3개 지점' }).first();
  await expect(chart).toBeVisible();
  await expect(chart.locator('text[data-axis="x"]')).toHaveText(['검색', '광고', '추천']);
});

test('CSV 파일 선택과 데이터 비우기가 실제로 동작한다', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('CSV 파일 선택').setInputFiles(monthlyCsvPath);
  await expect(page.locator('.mission-panel__source strong')).toHaveText('내 CSV · monthly-sales.csv');
  await expect(page.getByRole('heading', { name: '어떤 차트가 어울릴까요?' })).toBeVisible();

  await page.getByRole('button', { name: '입력 지우기' }).click();
  await expect(page.locator('.mission-panel__source strong')).toHaveText('아직 데이터 없음');
  await expect(page.getByRole('heading', { name: '차트를 보려면 데이터가 필요합니다' })).toBeVisible();
});

test('CSV 텍스트 붙여넣기 흐름도 로컬 입력으로 선 차트를 추천한다', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('브라우저 로컬 처리')).toBeVisible();
  await expect(page.getByText('서버 업로드 없음')).toBeVisible();
  await page.getByRole('button', { name: /CSV 붙여넣기 열기/ }).click();
  const pasteDialog = page.getByRole('dialog', { name: 'CSV 텍스트 붙여넣기' });
  await expect(pasteDialog).toBeVisible();
  await page.getByRole('textbox', { name: 'CSV 텍스트 붙여넣기' }).fill('day,value,group\n2026-01-01,10,A\n2026-01-02,15,A\n2026-01-03,13,B');
  await pasteDialog.getByRole('button', { name: '차트에 반영하고 닫기' }).click();

  await expect(page.locator('.mission-panel__source strong')).toHaveText('직접 붙여넣은 CSV');
  await expect(pasteDialog).toBeHidden();
  await expect(page.getByRole('heading', { name: '어떤 차트가 어울릴까요?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '선 차트' }).first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first().locator('circle')).toHaveCount(3);
});

test('날짜 컬럼은 헤더명이 date여도 일·월·년 기준으로 다시 묶어 볼 수 있다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /CSV 붙여넣기 열기/ }).click();
  await page.getByRole('textbox', { name: 'CSV 텍스트 붙여넣기' }).fill(
    'date,value\n2025-12-31,10\n2026-01-01,20\n2026-01-15,30\n2026-02-01,40',
  );

  await expect(page.getByRole('group', { name: '날짜 집계 단위' })).toBeVisible();
  await expect(page.getByRole('button', { name: '일 기준' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('chart-svg').first().locator('circle')).toHaveCount(4);

  await page.getByRole('button', { name: '월 기준' }).click();
  await expect(page.getByRole('button', { name: '월 기준' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('chart-svg').first().locator('circle')).toHaveCount(3);

  await page.getByRole('button', { name: '년 기준' }).click();
  await expect(page.getByRole('button', { name: '년 기준' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('chart-svg').first().locator('circle')).toHaveCount(2);
  await expect(page.getByTestId('chart-svg').first().locator('text[data-axis="x"]')).toHaveText(['2025', '2026']);
});

test('숫자만 있는 데이터도 부족 상태로 버리지 않고 행 순서 차트로 보여준다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /CSV 붙여넣기 열기/ }).click();
  await page.getByRole('textbox', { name: 'CSV 텍스트 붙여넣기' }).fill('score\n10\n25\n15\n40');

  await expect(page.getByRole('heading', { name: '어떤 차트가 어울릴까요?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '막대 차트' }).first()).toBeVisible();
  await expect(page.getByText('행 순서 기준으로 숫자 값을 비교합니다.').first()).toBeVisible();
  await expect(page.getByRole('img', { name: '막대 차트 시각화, 4개 지점' })).toBeVisible();
});

test('대량 CSV는 차트 지점을 샘플링해 렌더링한다', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('CSV 파일 선택').setInputFiles(largeCsvPath);
  await expect(page.locator('.mission-panel__source strong')).toHaveText('내 CSV · large-timeseries.csv');
  await expect(page.getByRole('heading', { name: '선 차트' }).first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first()).toBeVisible();
  await expect(page.getByTestId('sampling-note').first()).toContainText('120개 중 36개');
});

test('대량 차트는 최근 보기와 상위값 필터로 표시 범위를 좁힐 수 있다', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('CSV 파일 선택').setInputFiles(largeCsvPath);
  await expect(page.getByRole('group', { name: '차트 표시 범위' })).toBeVisible();

  await page.getByRole('button', { name: '최근 12개 보기' }).click();
  await expect(page.getByRole('button', { name: '최근 12개 보기' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('chart-filter-note')).toContainText('120개 중 최근 12개 지점만 표시');
  await expect(page.getByTestId('chart-svg').first().locator('circle')).toHaveCount(12);
  await expect(page.getByTestId('sampling-note')).toHaveCount(0);

  await page.getByRole('button', { name: '상위 12개 필터' }).click();
  await expect(page.getByRole('button', { name: '상위 12개 필터' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('chart-filter-note')).toContainText('120개 중 값이 큰 상위 12개 지점만 필터링');
  await expect(page.getByTestId('chart-svg').first().locator('circle')).toHaveCount(12);
});

test('대량 차트는 마우스 휠로 데이터 표시 범위를 확대하고 되돌린다', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('CSV 파일 선택').setInputFiles(largeCsvPath);
  const zoomViewport = page.getByTestId('chart-zoom-viewport');
  await expect(zoomViewport).toBeVisible();
  await expect(page.getByTestId('chart-zoom-range')).toHaveText('전체 120개');

  await zoomViewport.hover();
  await page.mouse.wheel(0, -500);
  await expect(page.getByTestId('chart-zoom-range')).toContainText('/ 120');

  await page.mouse.wheel(0, -500);
  await page.mouse.wheel(0, -500);
  await page.mouse.wheel(0, -500);
  await expect(page.getByTestId('chart-zoom-range')).not.toHaveText('전체 120개');

  await page.mouse.wheel(0, 500);
  await expect(page.getByTestId('chart-zoom-range')).toContainText('/ 120');
});

test('산점도는 행 순서가 아니라 첫 번째 숫자 컬럼을 x축으로 사용한다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /CSV 붙여넣기 열기/ }).click();
  await page.getByRole('textbox', { name: 'CSV 텍스트 붙여넣기' }).fill('x,y,group\n100,1,A\n0,5,B\n50,3,C');

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
  const firstSampleButton = page.getByRole('button', { name: /샘플 불러오기: 월별 매출 CSV/ });
  await page.keyboard.press('Tab');
  await expect(firstSampleButton).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('.mission-panel__source strong')).toHaveText('월별 매출 CSV');

  const pasteToggle = page.getByRole('button', { name: /CSV 붙여넣기/ });
  await pasteToggle.click();
  await expect(pasteToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(pasteToggle).toHaveAttribute('aria-haspopup', 'dialog');

  const pasteDialog = page.getByRole('dialog', { name: 'CSV 텍스트 붙여넣기' });
  await expect(pasteDialog).toBeVisible();
  await expect(pasteDialog).toHaveAttribute('aria-modal', 'true');
  const pasteTextarea = page.getByRole('textbox', { name: 'CSV 텍스트 붙여넣기' });
  await expect(pasteTextarea).toBeFocused();
  await pasteTextarea.fill('header-only');

  await pasteDialog.getByRole('button', { name: '창 닫기' }).click();
  await expect(page.getByRole('button', { name: /CSV 붙여넣기 열기/ })).toBeFocused();
  await expect(page.getByRole('button', { name: /CSV 붙여넣기 열기/ })).toHaveAttribute('aria-expanded', 'false');

  await expect(page.getByRole('alert')).toContainText('헤더와 최소 1개 이상의 데이터 행이 필요합니다.');
});

test('좁은 화면에서도 차트 비교 레이아웃이 문서 폭을 밀어내지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/');

  await page.getByRole('button', { name: /샘플 불러오기: 월별 매출 CSV/ }).click();
  await expect(page.getByRole('heading', { name: '어떤 차트가 어울릴까요?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '선 차트' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /차트 비교용 데이터를 불러오세요/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'CSV 파일 선택' })).toBeVisible();
  await expect(page.getByRole('button', { name: /CSV 붙여넣기 열기/ })).toBeVisible();

  const sampleButton = page.getByRole('button', { name: /샘플 불러오기: 월별 매출 CSV/ });
  const isClipped = await sampleButton.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
  expect(isClipped).toBe(false);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
