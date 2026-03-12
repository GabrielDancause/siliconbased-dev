const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/css-framework-sizes.json');
const htmlPath = path.join(__dirname, '../public/css-framework-sizes.html');

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

// Use a safe replace that can handle the raw JSON block without issues
const startTag = '<!-- INJECT_JSON_START -->';
const endTag = '<!-- INJECT_JSON_END -->';

if (html.includes('__TEMPLATES_JSON__')) {
    html = html.replace('__TEMPLATES_JSON__', `${startTag}\n      const frameworkData = ${data};\n      ${endTag}`);
} else if (html.includes(startTag) && html.includes(endTag)) {
    const startIndex = html.indexOf(startTag);
    const endIndex = html.indexOf(endTag) + endTag.length;
    html = html.slice(0, startIndex) + `${startTag}\n      const frameworkData = ${data};\n      ${endTag}` + html.slice(endIndex);
}

fs.writeFileSync(htmlPath, html);
console.log('Successfully injected JSON data into public/css-framework-sizes.html');
