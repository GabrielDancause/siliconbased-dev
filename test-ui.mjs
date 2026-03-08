import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1080 });
  await page.goto('http://localhost:4321/sourdough-study.html', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'sourdough-screenshot.png', fullPage: true });
  await browser.close();
  console.log('Screenshot saved to sourdough-screenshot.png');
})();
