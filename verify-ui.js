import { chromium } from 'playwright';
import { resolve } from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const filePath = `file://${resolve('public/word-counter.html')}`;
  console.log(`Loading ${filePath}`);

  await page.goto(filePath);

  // Set some text to see the counters update
  await page.fill('#inputText', 'Hello world! This is a test of the word counter.\n\nIt should count paragraphs, sentences, words, and characters properly.\n\nIs it working? Yes it is.');

  // Wait a moment for JS to process
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'word-counter-screenshot.png', fullPage: true });

  await browser.close();
  console.log('Screenshot saved to word-counter-screenshot.png');
})();
