import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('file:///app/dist/api-response-times.html', { waitUntil: 'networkidle' });

  // Wait for dynamic elements to render
  await page.waitForSelector('#stat-fastest', { state: 'visible' });
  await page.waitForSelector('#barChart', { state: 'visible' });
  await page.waitForSelector('#dataTable', { state: 'visible' });

  // take a screenshot
  await page.screenshot({ path: 'api_benchmark.png', fullPage: true });

  await browser.close();
  console.log('Screenshot saved to api_benchmark.png');
})();
