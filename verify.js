import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/schema-generator.html');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'schema-generator-screenshot.png', fullPage: true });
  await browser.close();
  console.log('Screenshot saved to schema-generator-screenshot.png');
})();
