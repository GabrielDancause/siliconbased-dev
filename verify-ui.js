import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:4321/font-size-converter.html');

  // Wait for the UI to be fully rendered
  await page.waitForSelector('.tool-card');

  // Take a screenshot
  await page.screenshot({ path: 'font-size-converter-screenshot.png', fullPage: true });

  await browser.close();
  console.log('Screenshot saved as font-size-converter-screenshot.png');
})();
