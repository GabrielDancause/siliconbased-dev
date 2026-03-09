const fs = require('fs');
const path = require('path');

function main() {
  const dataPath = path.join(__dirname, '..', 'data', 'protein-per-dollar.json');
  const htmlPath = path.join(__dirname, '..', 'public', 'protein-per-dollar.html');

  if (!fs.existsSync(dataPath)) {
    console.error(`Data file not found at ${dataPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(htmlPath)) {
    console.error(`HTML file not found at ${htmlPath}`);
    process.exit(1);
  }

  const data = fs.readFileSync(dataPath, 'utf-8');
  let html = fs.readFileSync(htmlPath, 'utf-8');

  // Validate JSON data
  try {
    JSON.parse(data);
  } catch (e) {
    console.error('Data file is not valid JSON:', e);
    process.exit(1);
  }

  // Replace placeholder
  if (html.includes('__PROTEIN_DATA__')) {
    html = html.replace('__PROTEIN_DATA__', data);
    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log('Successfully injected protein data into protein-per-dollar.html');
  } else {
    console.log('Placeholder __PROTEIN_DATA__ not found in protein-per-dollar.html. It may have already been injected.');
  }
}

main();
