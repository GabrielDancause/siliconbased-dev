import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to local file
  const filePath = path.resolve('public/ascii-table.html');
  await page.goto(`file://${filePath}`);

  // Wait for the table body to render (wait for the dynamic elements)
  await page.waitForSelector('.tr-row');

  // Take screenshot
  await page.screenshot({ path: 'screenshot.png', fullPage: true });

  await browser.close();
})();
