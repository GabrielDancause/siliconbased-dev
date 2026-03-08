import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/ip-lookup.html');

  // Wait for the page to load
  await page.waitForTimeout(1000);

  // Take screenshot of the initial state
  await page.screenshot({ path: 'ip-lookup-initial.png', fullPage: true });

  // Test lookup for a public IPv4
  await page.fill('#ipInput', '8.8.8.8');
  await page.click('#lookupBtn');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'ip-lookup-ipv4.png', fullPage: true });

  // Test lookup for an IPv6
  await page.fill('#ipInput', '2001:4860:4860::8888');
  await page.click('#lookupBtn');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'ip-lookup-ipv6.png', fullPage: true });

  await browser.close();
  console.log('Screenshots generated: ip-lookup-initial.png, ip-lookup-ipv4.png, ip-lookup-ipv6.png');
})();