import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const monthlyCsvPath = join(here, '../src/test/fixtures/monthly-sales.csv');
const largeCsvPath = join(here, '../src/test/fixtures/large-timeseries.csv');

test('초기 화면은 기능 없는 흐름 버튼 없이 입력 대기 상태를 보여준다', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /데이터 입력/ })).toBeVisible();
  await expect(page.locator('.mission-panel__source strong')).toHaveText('아직 데이터 없음');
  await expect(page.getByRole('heading', { name: 'CSV를 넣으면 차트가 바로 열립니다' })).toBeVisible();
  await expect(page.getByRole('button', { name: /샘플 불러오기: 월별 매출/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '입력 지우기' })).toBeDisabled();
});

test('샘플 CSV를 선택하면 차트 후보와 대안 선택이 동작한다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /샘플 불러오기: 월별 매출/ }).click();

  await expect(page.getByText('월별 매출').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: '선 차트' }).first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first().locator('circle')).toHaveCount(5);
  await expect(page.getByLabel('값')).toHaveValue('revenue');
  await page.getByLabel('값').selectOption('visitors');
  await expect(page.getByLabel('값')).toHaveValue('visitors');
  await expect(page.getByTestId('chart-svg').first().locator('circle')).toHaveCount(5);
  await expect(page.getByRole('tab')).toHaveCount(8);
  await expect(page.getByRole('tab', { name: '선 차트' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: '가로 막대 차트' })).toBeVisible();

  await page.getByRole('tab', { name: '막대 차트', exact: true }).click();
  await expect(page.getByRole('heading', { name: '막대 차트' }).first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first()).toBeVisible();
  await expect(page.getByRole('tab', { name: '막대 차트', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('파이와 도넛 차트는 별도 확대 오버레이 없이 비중 차트로 보여준다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /샘플 불러오기: 월별 매출/ }).click();
  await page.getByRole('tab', { name: '파이 차트' }).click();

  await expect(page.getByRole('img', { name: /파이 차트 시각화/ }).first()).toBeVisible();
  await expect(page.getByTestId('chart-zoom-viewport')).toHaveCount(0);
  await expect(page.getByTestId('chart-zoom-label')).toHaveCount(0);

  await page.getByRole('tab', { name: '도넛 차트' }).click();
  await expect(page.getByRole('img', { name: /도넛 차트 시각화/ }).first()).toBeVisible();
  await expect(page.getByTestId('chart-zoom-viewport')).toHaveCount(0);
});

test('차트 후보는 별도 이동 버튼 없이 탭으로 선택한다', async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await page.goto('/');

  await page.getByRole('button', { name: /샘플 불러오기: 월별 매출/ }).click();
  await expect(page.getByRole('tablist', { name: '차트 종류 선택' })).toBeVisible();
  await expect(page.getByRole('button', { name: '차트 후보 왼쪽으로 이동' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '차트 후보 오른쪽으로 이동' })).toHaveCount(0);
  await expect(page.getByRole('tab')).toHaveCount(8);

  await page.getByRole('tab', { name: '영역 차트' }).click();
  await expect(page.getByRole('tab', { name: '영역 차트' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: '영역 차트' }).first()).toBeVisible();
});

test('범주형 차트는 동일 범주를 합산해 중복 라벨을 줄인다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /월별 매출/ }).click();
  await page.getByRole('tab', { name: '막대 차트', exact: true }).click();

  const chart = page.getByRole('img', { name: '막대 차트 시각화, 3개 지점' }).first();
  await expect(chart).toBeVisible();
  await expect(chart).toContainText('검색');
  await expect(chart).toContainText('광고');
  await expect(chart).toContainText('추천');
});

test('막대 차트도 날짜 기준 월별 집계로 바꿔 볼 수 있다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /CSV 붙여넣기 열기|텍스트 붙여넣기 열기/ }).click();
  await page.getByRole('textbox', { name: 'CSV 텍스트 붙여넣기' }).fill(
    'date,value,group\n2026-01-01,10,A\n2026-01-15,20,A\n2026-02-01,30,B',
  );
  await page.getByRole('tab', { name: '막대 차트', exact: true }).click();

  await expect(page.getByLabel('기준')).toHaveValue('group');
  await page.getByLabel('기준').selectOption('date');
  await expect(page.getByLabel('날짜 표시 방식')).toBeVisible();
  await page.getByLabel('날짜 표시 방식').selectOption('month');

  const chart = page.getByRole('img', { name: '막대 차트 시각화, 2개 지점' }).first();
  await expect(chart).toBeVisible();
  await expect(chart).toContainText('2026-01');
  await expect(chart).toContainText('2026-02');
});

test('막대 차트와 가로 막대 차트는 20개씩 구간을 넘겨 볼 수 있다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /CSV 붙여넣기 열기|텍스트 붙여넣기 열기/ }).click();
  const rows = ['item,value'];
  for (let index = 1; index <= 45; index += 1) {
    rows.push(`항목${index},${index * 10}`);
  }
  await page.getByRole('textbox', { name: 'CSV 텍스트 붙여넣기' }).fill(rows.join('\n'));
  await page.getByRole('button', { name: '차트에 반영하고 닫기' }).click();

  await page.getByRole('tab', { name: /막대 차트/ }).first().click();
  await expect(page.getByRole('region', { name: '막대 차트 표시 구간' })).toContainText('1-20 / 45');
  await expect(page.getByRole('img', { name: /막대 차트 시각화, 전체 45개 중 1-20 구간 20개/ }).first()).toBeVisible();
  await page.getByRole('region', { name: '막대 차트 표시 구간' }).getByRole('button', { name: '다음' }).click();
  await expect(page.getByRole('region', { name: '막대 차트 표시 구간' })).toContainText('21-40 / 45');

  await page.getByRole('tab', { name: '가로 막대 차트' }).click();
  await expect(page.getByRole('region', { name: '막대 차트 표시 구간' })).toContainText('1-20 / 45');
  await page.getByRole('region', { name: '막대 차트 표시 구간' }).getByRole('button', { name: '다음' }).click();
  await page.getByRole('region', { name: '막대 차트 표시 구간' }).getByRole('button', { name: '다음' }).click();
  await expect(page.getByRole('region', { name: '막대 차트 표시 구간' })).toContainText('41-45 / 45');
});

test('CSV 파일 선택과 데이터 비우기가 실제로 동작한다', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('CSV 파일 선택').setInputFiles(monthlyCsvPath);
  await expect(page.locator('.mission-panel__source strong')).toHaveText('내 CSV · monthly-sales.csv');

  await page.getByRole('button', { name: '입력 지우기' }).click();
  await expect(page.locator('.mission-panel__source strong')).toHaveText('아직 데이터 없음');
  await expect(page.getByRole('heading', { name: 'CSV를 넣으면 차트가 바로 열립니다' })).toBeVisible();
});

test('CSV 파일을 드래그앤드롭으로 바로 불러올 수 있다', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('csv-drop-zone').dispatchEvent('dragover', {
    dataTransfer: await page.evaluateHandle(() => new DataTransfer()),
  });
  await expect(page.getByTestId('csv-drop-zone')).toHaveClass(/is-dragging/);

  const dataTransfer = await page.evaluateHandle(() => {
    const transfer = new DataTransfer();
    const file = new File(['day,value\n2026-01-01,10\n2026-01-02,20'], 'drop-sales.csv', { type: 'text/csv' });
    transfer.items.add(file);
    return transfer;
  });
  await page.getByTestId('csv-drop-zone').dispatchEvent('drop', { dataTransfer });

  await expect(page.locator('.mission-panel__source strong')).toHaveText('내 CSV · drop-sales.csv');
  await expect(page.getByRole('heading', { name: '선 차트' }).first()).toBeVisible();
  await expect(page.getByRole('img', { name: '선 차트 시각화, 2개 지점' }).first()).toBeVisible();
});

test('CSV 텍스트 붙여넣기 흐름도 로컬 입력으로 선 차트를 보여준다', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByLabel('처리 방식').getByText('로컬 처리')).toBeVisible();
  await expect(page.getByLabel('처리 방식').getByText('업로드 없음')).toBeVisible();
  await page.getByRole('button', { name: /CSV 붙여넣기 열기|텍스트 붙여넣기 열기/ }).click();
  const pasteDialog = page.getByRole('dialog', { name: 'CSV 텍스트 붙여넣기' });
  await expect(pasteDialog).toBeVisible();
  await page.getByRole('textbox', { name: 'CSV 텍스트 붙여넣기' }).fill('day,value,group\n2026-01-01,10,A\n2026-01-02,15,A\n2026-01-03,13,B');
  await pasteDialog.getByRole('button', { name: '차트에 반영하고 닫기' }).click();

  await expect(page.locator('.mission-panel__source strong')).toHaveText('직접 붙여넣은 CSV');
  await expect(pasteDialog).toBeHidden();
  await expect(page.getByRole('heading', { name: '선 차트' }).first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first().locator('circle')).toHaveCount(3);
});

test('날짜 컬럼은 원본 흐름과 일·월·년 집계를 선택해 볼 수 있다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /CSV 붙여넣기 열기|텍스트 붙여넣기 열기/ }).click();
  await page.getByRole('textbox', { name: 'CSV 텍스트 붙여넣기' }).fill(
    'date,value\n2025-12-31,10\n2026-01-01,20\n2026-01-15,30\n2026-02-01,40',
  );

  await expect(page.getByLabel('날짜 표시 방식')).toBeVisible();
  await expect(page.getByLabel('날짜 표시 방식')).toHaveValue('raw');
  await expect(page.getByRole('img', { name: '선 차트 시각화, 4개 지점' }).first()).toBeVisible();

  await page.getByLabel('날짜 표시 방식').selectOption('month');
  await expect(page.getByLabel('날짜 표시 방식')).toHaveValue('month');
  await expect(page.getByLabel('날짜 집계 계산')).toBeVisible();
  await expect(page.getByLabel('날짜 집계 계산')).toHaveValue('sum');
  await expect(page.getByRole('img', { name: '선 차트 시각화, 3개 지점' }).first()).toBeVisible();

  await page.getByLabel('날짜 집계 계산').selectOption('average');
  await expect(page.getByLabel('날짜 집계 계산')).toHaveValue('average');
  await expect(page.getByRole('img', { name: '선 차트 시각화, 3개 지점' }).first()).toBeVisible();

  await page.getByLabel('날짜 표시 방식').selectOption('year');
  await expect(page.getByLabel('날짜 표시 방식')).toHaveValue('year');
  await expect(page.getByRole('img', { name: '선 차트 시각화, 2개 지점' }).first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first()).toContainText('2025');
  await expect(page.getByTestId('chart-svg').first()).toContainText('2026');
});

test('숫자만 있는 데이터도 부족 상태로 버리지 않고 행 순서 차트로 보여준다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /CSV 붙여넣기 열기|텍스트 붙여넣기 열기/ }).click();
  await page.getByRole('textbox', { name: 'CSV 텍스트 붙여넣기' }).fill('score\n10\n25\n15\n40');

  await expect(page.getByRole('heading', { name: '막대 차트' }).first()).toBeVisible();
  await expect(page.getByText(/행 순서 기준으로 숫자 값을 비교합니다/).first()).toBeVisible();
  await expect(page.getByRole('img', { name: '막대 차트 시각화, 4개 지점' })).toBeVisible();
});

test('대량 CSV도 전체 지점을 유지해 렌더링한다', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('CSV 파일 선택').setInputFiles(largeCsvPath);
  await expect(page.locator('.mission-panel__source strong')).toHaveText('내 CSV · large-timeseries.csv');
  await expect(page.getByRole('heading', { name: '선 차트' }).first()).toBeVisible();
  await expect(page.getByTestId('chart-svg').first()).toBeVisible();
  await expect(page.getByRole('img', { name: '선 차트 시각화, 120개 지점' }).first()).toBeVisible();
  await expect(page.getByTestId('sampling-note')).toHaveCount(0);
});

test('대량 차트는 별도 필터 버튼 없이 전체 범위를 유지한다', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('CSV 파일 선택').setInputFiles(largeCsvPath);
  await expect(page.getByRole('group', { name: '차트 표시 범위' })).toHaveCount(0);
  await expect(page.getByTestId('sampling-note')).toHaveCount(0);
});

test('대량 차트는 라이브러리 브러시로 표시 범위를 조절할 수 있다', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('CSV 파일 선택').setInputFiles(largeCsvPath);
  await expect(page.getByTestId('sampling-note')).toHaveCount(0);
  await expect(page.locator('.recharts-brush')).toBeVisible();
});

test('3만 행 시계열은 성능 보호 렌더링을 적용한다', async ({ page }) => {
  await page.goto('/');

  const start = new Date('2026-01-01T00:00:00Z');
  const lines = ['day,revenue,visitors,channel'];
  for (let index = 0; index < 30000; index += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    const date = day.toISOString().slice(0, 10);
    lines.push(`${date},${1000000 + index * 37},${2000 + (index % 500)},채널${index % 6}`);
  }

  await page.getByLabel('CSV 파일 선택').setInputFiles({
    name: 'thirty-thousand.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(lines.join('\n')),
  });

  await expect(page.getByTestId('render-notice')).toContainText('전체 30,000개 데이터를 기준으로 계산했고');
  await expect(page.getByRole('img', { name: /선 차트 시각화, 전체 30,000개 중 900개 대표 지점/ }).first()).toBeVisible();
  await expect(page.locator('.recharts-brush')).toBeVisible();
});

test('산점도는 첫 번째 숫자 컬럼을 x축으로 사용해 렌더링한다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /CSV 붙여넣기 열기|텍스트 붙여넣기 열기/ }).click();
  await page.getByRole('textbox', { name: 'CSV 텍스트 붙여넣기' }).fill('x,y,group\n100,1,A\n0,5,B\n50,3,C');

  await expect(page.getByRole('heading', { name: '산점도' }).first()).toBeVisible();
  await expect(page.getByRole('img', { name: '산점도 시각화, 3개 지점' }).first()).toBeVisible();
  await expect(page.getByLabel('산점도 X축 컬럼')).toHaveValue('x');
  await expect(page.getByLabel('산점도 Y축 컬럼')).toHaveValue('y');
  await page.getByLabel('산점도 X축 컬럼').selectOption('y');
  await page.getByLabel('산점도 Y축 컬럼').selectOption('x');
  await expect(page.getByLabel('산점도 X축 컬럼')).toHaveValue('y');
  await expect(page.getByLabel('산점도 Y축 컬럼')).toHaveValue('x');
});

test('키보드 입력과 오류 알림은 접근성 역할을 유지한다', async ({ page }) => {
  await page.goto('/');

  const themeLightButton = page.getByRole('button', { name: '라이트' });
  const firstSampleButton = page.getByRole('button', { name: /샘플 불러오기: 월별 매출/ });
  await page.keyboard.press('Tab');
  await expect(themeLightButton).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(firstSampleButton).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('.mission-panel__source strong')).toHaveText('월별 매출');

  const pasteToggle = page.getByRole('button', { name: /CSV 붙여넣기|텍스트 붙여넣기/ });
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
  await expect(page.getByRole('button', { name: /CSV 붙여넣기 열기|텍스트 붙여넣기 열기/ })).toBeFocused();
  await expect(page.getByRole('button', { name: /CSV 붙여넣기 열기|텍스트 붙여넣기 열기/ })).toHaveAttribute('aria-expanded', 'false');

  await expect(page.getByRole('alert')).toContainText('헤더와 최소 1개 이상의 데이터 행이 필요합니다.');
});

test('좁은 화면에서도 차트 비교 레이아웃이 문서 폭을 밀어내지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/');

  await page.getByRole('button', { name: /샘플 불러오기: 월별 매출/ }).click();
  await expect(page.getByRole('heading', { name: '선 차트' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /데이터 입력/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'CSV 파일 선택' })).toBeVisible();
  await expect(page.getByRole('button', { name: /CSV 붙여넣기 열기|텍스트 붙여넣기 열기/ })).toBeVisible();

  const sampleButton = page.getByRole('button', { name: /샘플 불러오기: 월별 매출/ });
  const isClipped = await sampleButton.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
  expect(isClipped).toBe(false);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test('화면 모드를 바꾸면 상태가 유지된다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: '라이트' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
