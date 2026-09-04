import { expect, test } from '@playwright/test';

test('customer catalog discovery works on desktop and mobile', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByText('100 products found', { exact: true })).toBeVisible();
  await expect(page.locator('.product-card').first()).toBeVisible();

  const search = page.getByPlaceholder('Search in products...');
  await search.fill('AeroBook');
  await expect(page.locator('.product-card').first()).toContainText('AeroBook');

  await page.getByRole('link', { name: /View Details/ }).first().click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Customer Reviews' })).toBeVisible();
});
