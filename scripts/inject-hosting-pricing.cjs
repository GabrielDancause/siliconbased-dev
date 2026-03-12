const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/hosting-pricing.json');
const htmlPath = path.join(__dirname, '../public/hosting-pricing.html');

try {
  const jsonData = fs.readFileSync(dataPath, 'utf-8');
  let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  // Idempotent regex replacement
  const regex = /const pricingData = \[[\s\S]*?\];/g;
  htmlContent = htmlContent.replace(regex, `const pricingData = ${jsonData};`);

  fs.writeFileSync(htmlPath, htmlContent);
  console.log('Successfully injected pricing data into hosting-pricing.html');
} catch (error) {
  console.error('Error injecting data:', error);
}
