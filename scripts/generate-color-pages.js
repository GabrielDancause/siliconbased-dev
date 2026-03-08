import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'css-colors.json');
const templatePath = path.join(process.cwd(), 'templates', 'color-page.html');
const outDir = path.join(process.cwd(), 'public', 'colors');

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const colorsData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const template = fs.readFileSync(templatePath, 'utf-8');

// Helper to calculate contrast ratio between two relative luminances
function getContrastRatio(l1, l2) {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

// L of white is 1, L of black is 0
function generatePage(color) {
    const whiteContrastRatio = getContrastRatio(color.luminance, 1).toFixed(2);
    const blackContrastRatio = getContrastRatio(color.luminance, 0).toFixed(2);

    const isWhitePass = whiteContrastRatio >= 4.5;
    const isBlackPass = blackContrastRatio >= 4.5;

    const textColor = color.isLight ? '#000000' : '#ffffff';

    // Get related colors (same category)
    const related = colorsData.filter(c => c.category === color.category && c.name !== color.name).slice(0, 15);
    const relatedHtml = related.map(c =>
        `<a href="/colors/${c.name}.html" class="related-chip"><div class="related-dot" style="background-color: ${c.hex};"></div>${c.name}</a>`
    ).join('\n                ');

    let html = template;

    // Replace placeholders
    html = html.replace(/\{\{name\}\}/g, color.name);
    html = html.replace(/\{\{hex\}\}/g, color.hex);
    html = html.replace(/\{\{rgbString\}\}/g, color.rgb.string);
    html = html.replace(/\{\{hslString\}\}/g, color.hsl.string);
    html = html.replace(/\{\{category\}\}/g, color.category);
    html = html.replace(/\{\{categoryTitle\}\}/g, color.category.charAt(0).toUpperCase() + color.category.slice(1));
    html = html.replace(/\{\{textColor\}\}/g, textColor);

    // Contrast
    html = html.replace(/\{\{whiteContrast\}\}/g, `${whiteContrastRatio}:1`);
    html = html.replace(/\{\{blackContrast\}\}/g, `${blackContrastRatio}:1`);
    html = html.replace(/\{\{whiteBadgeClass\}\}/g, isWhitePass ? 'badge-pass' : 'badge-fail');
    html = html.replace(/\{\{blackBadgeClass\}\}/g, isBlackPass ? 'badge-pass' : 'badge-fail');

    // Harmonies
    html = html.replace(/\{\{compHex\}\}/g, color.complementary.hex);
    html = html.replace(/\{\{compName\}\}/g, color.complementary.closestMatch);

    html = html.replace(/\{\{ana1Hex\}\}/g, color.analogousColors[0].hex);
    html = html.replace(/\{\{ana1Name\}\}/g, color.analogousColors[0].closestMatch);

    html = html.replace(/\{\{tri1Hex\}\}/g, color.triadicColors[0].hex);
    html = html.replace(/\{\{tri1Name\}\}/g, color.triadicColors[0].closestMatch);

    // Related
    html = html.replace(/\{\{relatedColorsHtml\}\}/g, relatedHtml);

    fs.writeFileSync(path.join(outDir, `${color.name}.html`), html);
}

// Generate all individual color pages
colorsData.forEach(color => {
    generatePage(color);
});

console.log(`Successfully generated ${colorsData.length} color pages in public/colors/`);
