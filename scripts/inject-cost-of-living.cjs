const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'cost-of-living-index.json');
const htmlPath = path.join(__dirname, '..', 'public', 'cost-of-living-index.html');

if (!fs.existsSync(dataPath)) {
  console.error(`Data file not found at ${dataPath}`);
  process.exit(1);
}

if (!fs.existsSync(htmlPath)) {
  console.error(`HTML file not found at ${htmlPath}`);
  process.exit(1);
}

const data = fs.readFileSync(dataPath, 'utf8');
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace the placeholder. Use simple string replacement to avoid regex issues with large JSON.
const placeholder = '__TEMPLATES_JSON__';
if (html.includes(placeholder)) {
  html = html.replace(placeholder, data);
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`Successfully injected JSON data into ${htmlPath}`);
} else {
  console.warn(`Placeholder ${placeholder} not found in HTML file. Injection may have already occurred or file is malformed.`);
}
