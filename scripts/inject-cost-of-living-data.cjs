const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/cost-of-living-index.json');
const htmlPath = path.join(__dirname, '../public/cost-of-living-index.html');

try {
    const data = fs.readFileSync(dataPath, 'utf8');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // We replace either the placeholder or any existing injected array
    // to make this script idempotent.
    const regex = /(<script id="data-store" type="application\/json">\s*)(?:__TEMPLATES_JSON__|\[[\s\S]*?\])(\s*<\/script>)/;

    if (regex.test(html)) {
        html = html.replace(regex, `$1${data}$2`);
        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log('Successfully injected cost-of-living-index.json into public/cost-of-living-index.html');
    } else {
        console.error('Could not find injection point in HTML.');
    }
} catch (err) {
    console.error('Error during injection:', err);
    process.exit(1);
}
