const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/js-framework-sizes.json');
const frameworks = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Calculate stats
const validSizes = frameworks.filter(f => f.minifiedKB !== null).sort((a, b) => a.minifiedKB - b.minifiedKB);
const smallestFw = validSizes.length > 0 ? validSizes[0] : { framework: 'Unknown', minifiedKB: 0 };
const itemsAnalyzed = frameworks.length;

const astroPath = path.join(__dirname, '../src/pages/index.astro');
let astroContent = fs.readFileSync(astroPath, 'utf8');

const newStudy = `{ emoji: "📦", name: "JavaScript Framework Bundle Size Comparison 2026", slug: "/js-framework-sizes", stat: "${smallestFw.minifiedKB}KB", statLabel: "Smallest Core", desc: "Analyzed ${itemsAnalyzed} modern JavaScript frameworks. Compared minified sizes, GitHub stars, and npm downloads." }`;

// Add new study to the `studies` array
const studiesRegex = /const studies = \[\s*([\s\S]*?)\s*\];/;
const match = astroContent.match(studiesRegex);

if (match) {
  let innerArray = match[1];

  // Only add if it doesn't already exist
  if (!innerArray.includes('/js-framework-sizes')) {
      const updatedArray = innerArray.trim() ? `${innerArray},\n  ${newStudy}` : `  ${newStudy}`;
      astroContent = astroContent.replace(studiesRegex, `const studies = [\n  ${updatedArray}\n];`);
      fs.writeFileSync(astroPath, astroContent);
      console.log('Updated src/pages/index.astro with the new study.');
  } else {
      console.log('Study already exists in src/pages/index.astro.');
  }
} else {
  console.error('Could not find studies array in src/pages/index.astro');
}
