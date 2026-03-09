const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'api-response-times.json');
const htmlPath = path.join(__dirname, '..', 'public', 'api-response-times.html');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
let html = fs.readFileSync(htmlPath, 'utf8');

const jsonStr = JSON.stringify(data, null, 2);

// Make this replacement idempotent so it works on subsequent runs without a placeholder.
const regex = /const apiData = \[[\s\S]*?\];/;
html = html.replace(regex, `const apiData = ${jsonStr};`);

fs.writeFileSync(htmlPath, html);
console.log('Injected API data into HTML successfully');
