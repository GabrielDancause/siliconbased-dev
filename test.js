import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/toml-converter.html');

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot.png', fullPage: true });

  await browser.close();
  console.log('Screenshot saved to screenshot.png');
})();
