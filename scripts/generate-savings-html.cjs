const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/savings-rates-study.json');
const htmlPath = path.join(__dirname, '../public/savings-rate-comparison.html');

try {
  const data = fs.readFileSync(dataPath, 'utf8');
  let html = fs.readFileSync(htmlPath, 'utf8');

  // We want to replace everything between <script type="application/json" id="savings-data"> and </script>
  // This ensures the script is repeatable on subsequent runs.
  const regex = /(<script type="application\/json" id="savings-data">\s*)[\s\S]*?(\s*<\/script>)/i;

  if (regex.test(html)) {
    html = html.replace(regex, () => `<script type="application/json" id="savings-data">\n${data}\n</script>`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('Successfully injected savings data into public/savings-rate-comparison.html');
  } else {
    console.error('Could not find the target script tag in public/savings-rate-comparison.html');
    process.exit(1);
  }
} catch (e) {
  console.error('Error generating savings HTML:', e.message);
  process.exit(1);
}
