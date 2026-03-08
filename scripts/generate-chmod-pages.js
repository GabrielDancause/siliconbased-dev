import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT_DIR, 'data', 'chmod-combos.json');
const TEMPLATE_FILE = path.join(ROOT_DIR, 'templates', 'chmod-page.html');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'chmod');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read data and template
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');

function generateSecurityBadge(security) {
  if (security === 'safe') return '<span class="badge badge-safe">Safe</span>';
  if (security === 'moderate') return '<span class="badge badge-moderate">Moderate Risk</span>';
  if (security === 'dangerous') return '<span class="badge badge-dangerous">Dangerous</span>';
  return '';
}

function renderPermissionRow(name, hasPerm) {
  const icon = hasPerm ? '✓' : '✗';
  const colorClass = hasPerm ? 'perm-yes' : 'perm-no';
  return `
    <div class="perm-row">
      <span class="perm-name">${name}</span>
      <span class="perm-icon ${colorClass}">${icon}</span>
    </div>
  `;
}

function generateGridHTML(combo) {
  const roles = [
    { key: 'owner', label: 'Owner (User)' },
    { key: 'group', label: 'Group' },
    { key: 'others', label: 'Others (Public)' }
  ];

  let html = '';
  for (const role of roles) {
    const perms = combo[role.key];
    html += `
      <div class="grid-col">
        <div class="col-header">${role.label}</div>
        ${renderPermissionRow('Read (r)', perms.read)}
        ${renderPermissionRow('Write (w)', perms.write)}
        ${renderPermissionRow('Execute (x)', perms.execute)}
      </div>
    `;
  }
  return html;
}

function generateRelatedLinks(currentCombo) {
  // Find related combinations: same owner, same group, etc.
  const related = data
    .filter(c => c.octal !== currentCombo.octal)
    .sort((a, b) => {
      // Calculate a similarity score
      let scoreA = 0;
      let scoreB = 0;
      if (a.octal[0] === currentCombo.octal[0]) scoreA += 10;
      if (a.octal[1] === currentCombo.octal[1]) scoreA += 5;
      if (a.octal[2] === currentCombo.octal[2]) scoreA += 2;

      if (b.octal[0] === currentCombo.octal[0]) scoreB += 10;
      if (b.octal[1] === currentCombo.octal[1]) scoreB += 5;
      if (b.octal[2] === currentCombo.octal[2]) scoreB += 2;

      return scoreB - scoreA;
    })
    .slice(0, 5); // take top 5

  // If we don't have enough, just take some random ones
  if (related.length < 5) {
      const extra = data.filter(c => c.octal !== currentCombo.octal && !related.find(r => r.octal === c.octal));
      related.push(...extra.slice(0, 5 - related.length));
  }

  let html = '';
  for (const rel of related) {
    html += `
      <a href="/chmod/${rel.octal}.html" class="related-link">
        <span class="related-octal code-font">${rel.octal}</span>
        <span class="related-symbolic code-font">${rel.symbolic}</span>
      </a>
    `;
  }
  return html;
}

function generateJsonLd(combo) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `chmod ${combo.octal} (${combo.symbolic}) — Linux File Permissions Explained`,
    "description": combo.commonUse,
    "url": `https://siliconbased.dev/chmod/${combo.octal}.html`
  };
  return JSON.stringify(schema, null, 2);
}

let generatedCount = 0;

for (const combo of data) {
  let pageContent = template
    .replace(/\{\{octal\}\}/g, combo.octal)
    .replace(/\{\{symbolic\}\}/g, combo.symbolic)
    .replace(/\{\{title\}\}/g, combo.title)
    .replace(/\{\{commonUse\}\}/g, combo.commonUse)
    .replace(/\{\{securityBadge\}\}/g, generateSecurityBadge(combo.security))
    .replace(/\{\{gridHTML\}\}/g, generateGridHTML(combo))
    .replace(/\{\{relatedLinks\}\}/g, generateRelatedLinks(combo))
    .replace(/\{\{jsonLd\}\}/g, generateJsonLd(combo));

  const outputPath = path.join(OUTPUT_DIR, `${combo.octal}.html`);
  fs.writeFileSync(outputPath, pageContent);
  generatedCount++;
}

console.log(`Generated ${generatedCount} chmod HTML pages in public/chmod/`);
