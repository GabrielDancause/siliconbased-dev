import fs from 'fs';
import path from 'path';

// Directories
const dataFile = path.resolve('data/regex-patterns.json');
const templateFile = path.resolve('templates/regex-page.html');
const outDir = path.resolve('public/regex');

// Load Data
const regexData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const template = fs.readFileSync(templateFile, 'utf8');

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Helper to escape HTML content
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper specifically for injecting into HTML attributes (like data-*)
function escapeAttr(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Generate pages
for (const item of regexData) {
  const {
    slug,
    title,
    pattern,
    flags,
    description,
    testStrings,
    explanation,
    languageExamples,
    commonVariations,
    relatedPatterns
  } = item;

  const url = `https://siliconbased.dev/regex/${slug}.html`;

  // Build explanation rows
  const explanationRows = explanation.map(ex => `
    <tr>
      <td class="part">${escapeHtml(ex.part)}</td>
      <td>${escapeHtml(ex.desc)}</td>
    </tr>
  `).join('');

  // Build examples rows
  const examplesRows = testStrings.map(test => `
    <li>
      <span class="status-icon ${test.match ? 'status-match' : 'status-nomatch'}">
        ${test.match ? '✓' : '✗'}
      </span>
      <span class="example-text">${escapeHtml(test.string)}</span>
    </li>
  `).join('');

  // Build language snippets
  const languageSnippets = Object.entries(languageExamples).map(([lang, code]) => `
    <div style="margin-bottom: 1.5rem;">
      <div class="code-header">
        <span class="code-lang">${lang}</span>
        <button class="copy-btn" data-clipboard="${escapeAttr(code)}" onclick="copyToClipboard(this.dataset.clipboard, this)">Copy</button>
      </div>
      <pre>${escapeHtml(code)}</pre>
    </div>
  `).join('');

  // Build common variations
  let commonVariationsSection = '';
  if (commonVariations && commonVariations.length > 0) {
    const variationsList = commonVariations.map(variation => `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">${escapeHtml(variation.name || variation.desc)}</h3>
        <div class="code-header">
          <span class="code-lang">Variation</span>
          <button class="copy-btn" data-clipboard="${escapeAttr(variation.pattern)}" onclick="copyToClipboard(this.dataset.clipboard, this)">Copy Regex</button>
        </div>
        <pre class="pattern-display" style="font-size: 1.1rem;">${escapeHtml(variation.pattern)}</pre>
      </div>
    `).join('');

    commonVariationsSection = `
      <div class="card">
        <h2>Common Variations</h2>
        <div style="margin-top: 1rem;">
          ${variationsList}
        </div>
      </div>
    `;
  }

  // Build related tags
  const relatedTags = relatedPatterns.map(relSlug => {
    const relTitle = relSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return `<a href="/regex/${relSlug}.html" class="tag">${relTitle}</a>`;
  }).join('');

  // Generate JSON-LD
  const jsonLd = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": `Regex for ${title}`,
      "description": description,
      "url": url,
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All"
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": `Regex for ${title}`,
      "description": description,
      "author": {
        "@type": "Organization",
        "name": "siliconbased.dev",
        "url": "https://siliconbased.dev"
      }
    }
  ], null, 2);

  const initialTestValue = testStrings.length > 0 ? escapeHtml(testStrings[0].string) : '';

  // Replace placeholders
  let html = template;
  html = html.replaceAll('{{title}}', () => escapeHtml(title));
  html = html.replaceAll('{{description}}', () => escapeHtml(description));
  html = html.replaceAll('{{pattern}}', () => escapeHtml(pattern));
  html = html.replaceAll('{{pattern_attr}}', () => escapeAttr(pattern)); // escaped for data attributes
  html = html.replaceAll('{{flags}}', () => escapeHtml(flags));
  html = html.replaceAll('{{flags_attr}}', () => escapeAttr(flags));
  html = html.replaceAll('{{explanation_rows}}', () => explanationRows);
  html = html.replaceAll('{{examples_rows}}', () => examplesRows);
  html = html.replaceAll('{{language_snippets}}', () => languageSnippets);
  html = html.replaceAll('{{common_variations_section}}', () => commonVariationsSection);
  html = html.replaceAll('{{related_tags}}', () => relatedTags);
  html = html.replaceAll('{{jsonLd}}', () => jsonLd);
  html = html.replaceAll('{{test_initial_value}}', () => initialTestValue);

  // Write file
  const outFile = path.join(outDir, `${slug}.html`);
  fs.writeFileSync(outFile, html, 'utf8');
}

console.log(`Generated ${regexData.length} regex pages.`);
