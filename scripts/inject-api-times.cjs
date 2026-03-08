const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'api-response-times.json');
const htmlPath = path.join(__dirname, '..', 'public', 'api-response-times.html');

if (!fs.existsSync(dataPath)) {
    console.error(`Error: Data file not found at ${dataPath}`);
    process.exit(1);
}

if (!fs.existsSync(htmlPath)) {
    console.error(`Error: HTML file not found at ${htmlPath}`);
    process.exit(1);
}

const jsonData = fs.readFileSync(dataPath, 'utf-8');
let htmlData = fs.readFileSync(htmlPath, 'utf-8');

if (htmlData.includes('__TEMPLATES_JSON__')) {
    htmlData = htmlData.replace('__TEMPLATES_JSON__', jsonData);
    fs.writeFileSync(htmlPath, htmlData, 'utf-8');
    console.log('Successfully injected API response times data into HTML file.');
} else {
    // If it's already injected, we could try to replace the array, but it's safer to just warn or do a regex replace
    // This regex looks for: const apiData = [...]; or const apiData = { ... };
    const regex = /(const\s+apiData\s*=\s*)([\s\S]*?)(;)/;
    if (regex.test(htmlData)) {
        htmlData = htmlData.replace(regex, `$1${jsonData}$3`);
        fs.writeFileSync(htmlPath, htmlData, 'utf-8');
        console.log('Successfully updated API response times data in HTML file.');
    } else {
        console.warn('Warning: Could not find __TEMPLATES_JSON__ or existing apiData object in HTML file.');
    }
}
