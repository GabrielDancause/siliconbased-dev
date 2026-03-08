import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:4321/user-agent-parser.html');

  // Wait for the textarea to be visible
  await page.waitForSelector('#uaInput');

  // Fill in a custom User Agent to verify parsing update works
  await page.fill('#uaInput', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1');

  // Give it a tiny moment to process the 'input' event and update UI
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'test-screenshot.png', fullPage: true });

  await browser.close();
})();
