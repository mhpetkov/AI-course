const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

async function runDefaultComparison(page) {
  await page.getByTestId('run-comparison-button').click();
  await expect(page.getByText('IDs with different dates from the main environment: 1')).toBeVisible();
}

test('loads the compare page with the initial empty state', async ({ page }) => {
  await expect(page.getByText('Environment Comparator')).toBeVisible();
  await expect(page.getByText('No output yet.')).toBeVisible();
  await expect(page.getByTestId('run-comparison-button')).toBeVisible();
});

test('runs the default comparison immediately', async ({ page }) => {
  await runDefaultComparison(page);

  await expect(page.getByText('Mismatched records: 1')).toBeVisible();
  await expect(page.getByText('Black listed file', { exact: true })).toBeVisible();
});

test('runs comparison and shows the mismatch count', async ({ page }) => {
  await runDefaultComparison(page);
  await expect(page.getByText('Mismatched records: 1')).toBeVisible();
  await expect(page.getByText('Black listed file', { exact: true })).toBeVisible();
  await expect(page.getByTestId('extract-button-mainDocument')).toBeVisible();
  await expect(page.getByTestId('extract-button-newDocument')).toBeVisible();
  await expect(page.getByTestId('extract-button-blackListFile')).toBeVisible();
  await expect(page.getByText('1002 | main app: MainApp.Records')).toBeVisible();
});

test('clears results after a successful comparison', async ({ page }) => {
  await runDefaultComparison(page);

  await page.getByTestId('clear-results-button').click();

  await expect(page.getByText('No output yet.')).toBeVisible();
  await expect(page.getByText('IDs with different dates from the main environment: 1')).toHaveCount(0);
});

test('switches the language label between English and Bulgarian', async ({ page }) => {
  await expect(page.getByTestId('language-toggle-button')).toBeVisible();
  await page.getByTestId('language-toggle-button').click();
  await expect(page.getByText('Български')).toBeVisible();
});
