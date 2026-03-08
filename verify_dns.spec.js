import { test, expect } from '@playwright/test';

test('verify DNS Lookup tool renders and works', async ({ page }) => {
  // Navigate to the local dev server
  await page.goto('http://localhost:4321/dns-lookup.html');

  // Verify basic structure
  await expect(page.locator('h1')).toHaveText('DNS Lookup Tool');
  await expect(page.locator('#domainInput')).toBeVisible();
  await expect(page.locator('#typeInput')).toBeVisible();
  await expect(page.locator('#resolverInput')).toBeVisible();
  await expect(page.locator('#lookupBtn')).toBeVisible();

  // Test functionality (Query "example.com" for A record)
  await page.fill('#domainInput', 'example.com');
  await page.selectOption('#typeInput', 'A');
  await page.selectOption('#resolverInput', 'google');

  // Submit the form
  await page.click('#lookupBtn');

  // Wait for the result card to appear and populate
  await expect(page.locator('#resultCard')).toBeVisible();

  // Wait for success status
  await expect(page.locator('.status-success')).toBeVisible({ timeout: 10000 });

  // Verify at least one row was populated in the table
  const rows = await page.locator('#recordsBody tr').count();
  expect(rows).toBeGreaterThan(0);

  // Take a screenshot of the results
  await page.screenshot({ path: 'dns-lookup-test.png', fullPage: true });
});
