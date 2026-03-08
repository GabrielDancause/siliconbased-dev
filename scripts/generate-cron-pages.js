import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../data/cron-expressions.json');
const templatePath = path.join(__dirname, '../templates/cron-page.html');
const outDir = path.join(__dirname, '../public/cron');

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Read data and template
const cronData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const template = fs.readFileSync(templatePath, 'utf-8');

// Function to replace all occurrences of a string
const replaceAll = (str, find, replace) => {
  return str.split(find).join(replace);
};

// Process each cron expression
cronData.forEach(item => {
  let html = template;

  // Global replacements
  html = replaceAll(html, '{{slug}}', item.slug);
  html = replaceAll(html, '{{expression}}', item.expression);
  html = replaceAll(html, '{{humanReadable}}', item.humanReadable);
  html = replaceAll(html, '{{useCase}}', item.useCase);

  // Field breakdown
  const parts = item.expression.split(' ');
  const isSixPart = parts.length === 6;
  const pMinute = isSixPart ? parts[1] : parts[0];
  const pHour = isSixPart ? parts[2] : parts[1];
  const pDom = isSixPart ? parts[3] : parts[2];
  const pMonth = isSixPart ? parts[4] : parts[3];
  const pDow = isSixPart ? parts[5] : parts[4];

  html = replaceAll(html, '{{partMinute}}', pMinute);
  html = replaceAll(html, '{{partHour}}', pHour);
  html = replaceAll(html, '{{partDom}}', pDom);
  html = replaceAll(html, '{{partMonth}}', pMonth);
  html = replaceAll(html, '{{partDow}}', pDow);

  html = replaceAll(html, '{{fieldMinute}}', item.fields.minute.split(': ')[1]);
  html = replaceAll(html, '{{fieldHour}}', item.fields.hour.split(': ')[1]);
  html = replaceAll(html, '{{fieldDom}}', item.fields.dayOfMonth.split(': ')[1]);
  html = replaceAll(html, '{{fieldMonth}}', item.fields.month.split(': ')[1]);
  html = replaceAll(html, '{{fieldDow}}', item.fields.dayOfWeek.split(': ')[1]);

  // Next Runs HTML
  const nextRunsHtml = item.nextRuns.map(run => `<li>${run}</li>`).join('\n                ');
  html = replaceAll(html, '{{nextRunsHtml}}', nextRunsHtml);

  // Related Expressions HTML
  const relatedHtml = item.relatedExpressions.map(slug => {
    // Find human readable name for related slug
    const relatedItem = cronData.find(c => c.slug === slug);
    const relatedName = relatedItem ? relatedItem.humanReadable : slug.replace(/-/g, ' ');
    return `<a href="/cron/${slug}" class="tag">${relatedName}</a>`;
  }).join('\n                ');
  html = replaceAll(html, '{{relatedHtml}}', relatedHtml);

  // Write the file
  const outPath = path.join(outDir, `${item.slug}.html`);
  fs.writeFileSync(outPath, html);
});

console.log(`Successfully generated ${cronData.length} cron pages in public/cron/`);
