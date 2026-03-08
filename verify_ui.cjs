const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/flexbox-playground.html');
  await page.waitForLoadState('networkidle');

  // Click on item 2 to show item properties
  await page.click('.flex-item:nth-child(2)');
  await page.waitForTimeout(500); // Wait for transition

  // Change align-self of item 2 to center
  await page.selectOption('#i-align-self', 'center');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'flexbox_screenshot.png', fullPage: true });
  await browser.close();
})();
