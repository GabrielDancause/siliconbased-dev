const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'api-response-times.json');
const htmlPath = path.join(__dirname, '..', 'public', 'api-response-times.html');

try {
    const dataContent = fs.readFileSync(dataPath, 'utf8');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Make sure we have actual JSON data
    const parsed = JSON.parse(dataContent);
    if (!Array.isArray(parsed)) {
        throw new Error("Data is not an array");
    }

    // Replace the block in the HTML
    // We are looking for: const apiData = [ ... ];
    const regex = /const apiData = \[[\s\S]*?\];/;
    const replacement = `const apiData = ${dataContent};`;

    if (!regex.test(htmlContent)) {
        throw new Error("Could not find the target block to replace in the HTML file.");
    }

    const newHtmlContent = htmlContent.replace(regex, replacement);

    fs.writeFileSync(htmlPath, newHtmlContent, 'utf8');
    console.log('Successfully injected API response times into HTML.');

} catch (err) {
    console.error('Error injecting data:', err);
    process.exit(1);
}
