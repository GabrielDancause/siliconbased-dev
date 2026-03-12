const fs = require('fs');
const htmlPath = 'public/sourdough-study.html';
const jsonPath = 'data/sourdough-study.json';

let html = fs.readFileSync(htmlPath, 'utf8');
const dataStr = fs.readFileSync(jsonPath, 'utf8');

html = html.replace(
  /(<script>[\s\n]*const data = )[\s\S]*?(;\n[\s\n]*function renderChart)/,
  `$1${dataStr}$2`
);

fs.writeFileSync(htmlPath, html);
console.log('Injected JSON into HTML successfully.');
