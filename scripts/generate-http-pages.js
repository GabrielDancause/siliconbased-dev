import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../data/http-codes.json');
const TEMPLATE_FILE = path.join(__dirname, '../templates/http-page.html');
const OUT_DIR = path.join(__dirname, '../public/http');

// Helper to get category label
function getCategoryLabel(category) {
  switch (category) {
    case 'informational': return '1xx Informational';
    case 'success': return '2xx Success';
    case 'redirection': return '3xx Redirection';
    case 'client-error': return '4xx Client Error';
    case 'server-error': return '5xx Server Error';
    default: return 'Unknown';
  }
}

// Helper to escape HTML to prevent XSS (even though we control the JSON, it's good practice)
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function generatePages() {
  // Read files
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');

  // Ensure output directory exists
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // Create lookup for related codes
  const codeLookup = data.reduce((acc, item) => {
    acc[item.code] = item;
    return acc;
  }, {});

  // Generate a page for each code
  data.forEach(item => {
    const commonCausesHtml = item.commonCauses.map(cause => `<li>${escapeHtml(cause)}</li>`).join('\n      ');
    const howToFixHtml = item.howToFix.map(fix => `<li>${escapeHtml(fix)}</li>`).join('\n      ');

    const relatedCodesHtml = item.relatedCodes.map(relCode => {
      const relItem = codeLookup[relCode];
      if (!relItem) return '';
      return `
      <a href="/http/${relItem.code}.html" class="related-card">
        <div class="related-code">${relItem.code}</div>
        <div class="related-name">${escapeHtml(relItem.name)}</div>
      </a>`;
    }).join('');

    let html = template
      .replace(/\{\{CODE\}\}/g, item.code)
      .replace(/\{\{NAME\}\}/g, escapeHtml(item.name))
      .replace(/\{\{DESCRIPTION\}\}/g, escapeHtml(item.description))
      .replace(/\{\{DESCRIPTION_JSON\}\}/g, item.description.replace(/"/g, '\\"'))
      .replace(/\{\{CATEGORY\}\}/g, item.category)
      .replace(/\{\{CATEGORY_LABEL\}\}/g, getCategoryLabel(item.category))
      .replace(/\{\{COMMON_CAUSES\}\}/g, commonCausesHtml)
      .replace(/\{\{HOW_TO_FIX\}\}/g, howToFixHtml)
      .replace(/\{\{EXAMPLE_RESPONSE\}\}/g, escapeHtml(item.exampleResponse))
      .replace(/\{\{RELATED_CODES\}\}/g, relatedCodesHtml);

    const outputPath = path.join(OUT_DIR, `${item.code}.html`);
    fs.writeFileSync(outputPath, html, 'utf-8');
    console.log(`Generated: ${outputPath}`);
  });

  console.log(`\nSuccessfully generated ${data.length} HTTP status pages.`);
}

generatePages();
