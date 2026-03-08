const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/cooking-oil-comparison.json', 'utf8'));

const faq = [
  { q: "What oil has the highest smoke point?", a: "Avocado oil has one of the highest smoke points at 520°F (271°C), making it excellent for deep frying and high-heat cooking." },
  { q: "Is avocado oil better than olive oil for cooking?", a: "For high-heat cooking, avocado oil is better due to its 520°F smoke point compared to olive oil's 350°F-465°F. For lower heat or finishing, olive oil is excellent." },
  { q: "What is the healthiest cooking oil?", a: "Extra virgin olive oil and avocado oil are widely considered the healthiest options due to their high monounsaturated fat content and beneficial plant compounds." },
  { q: "Can you fry with olive oil?", a: "Yes, you can pan-fry with light or refined olive oil (smoke point 465°F). Extra virgin olive oil (smoke point 350°F) is better for low-heat cooking or finishing." },
  { q: "What oil should I use for deep frying?", a: "Oils with high smoke points and neutral flavors are best for deep frying, such as avocado oil, peanut oil, safflower oil, and canola oil." }
];

const schema = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Cooking Oil Smoke Points & Nutrition Comparison 2026",
    "url": "https://28grams.vip/cooking-oil-comparison",
    "description": "The definitive comparison of every cooking oil — smoke point, fat composition, calories, best uses.",
    "datePublished": "2026-01-01",
    "publisher": {
      "@type": "Organization",
      "name": "28grams.vip",
      "url": "https://28grams.vip"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  }
];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cooking Oil Smoke Points & Nutrition Comparison 2026 | 28grams.vip</title>
  <meta name="description" content="The definitive comparison of every cooking oil — smoke point, fat composition, calories, best uses.">
  <link rel="canonical" href="https://28grams.vip/cooking-oil-comparison">
  <style>
    :root {
      --bg-color: #0a0b10;
      --card-bg: #111318;
      --border-color: #1e2030;
      --accent: #C2185B;
      --text-primary: #e0e0e0;
      --text-secondary: #888;
    }
    body {
      background-color: var(--bg-color);
      color: var(--text-primary);
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    header, main, footer {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1, h2, h3 {
      color: var(--accent);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.5rem;
    }
    .card h3 {
      margin-top: 0;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .metric span:first-child {
      color: var(--text-secondary);
    }
    .faq-item {
      margin-bottom: 1.5rem;
    }
    .faq-item h4 {
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }
    .faq-item p {
      color: var(--text-secondary);
      margin-top: 0;
    }
    a {
      color: var(--accent);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    footer {
      border-top: 1px solid var(--border-color);
      margin-top: 2rem;
      text-align: center;
      color: var(--text-secondary);
    }
    .methodology {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
  </style>
  <script type="application/ld+json">
    ${JSON.stringify(schema, null, 2)}
  </script>
</head>
<body>
  <header>
    <h1>Cooking Oil Smoke Points & Nutrition Comparison 2026</h1>
    <p>The definitive comparison of every cooking oil — smoke point, fat composition, calories, best uses.</p>
  </header>
  <main>
    <div class="methodology">
      <h2>Methodology</h2>
      <p>Data collected in 2026 from comprehensive guides, medical sources, and the USDA FoodData Central. Smoke points and nutritional values represent typical averages, as exact values can vary slightly by brand and refinement process.</p>
    </div>

    <h2>Oil Comparison</h2>
    <div class="grid">
      ${data.map(oil => `
      <div class="card">
        <h3>${oil.name}</h3>
        <div class="metric"><span>Smoke Point:</span> <span>${oil.smokePointF}&deg;F / ${oil.smokePointC}&deg;C</span></div>
        <div class="metric"><span>Best For:</span> <span style="text-transform: capitalize;">${oil.bestFor}</span></div>
        <div class="metric"><span>Flavor:</span> <span style="text-transform: capitalize;">${oil.flavor}</span></div>
        <div class="metric"><span>Calories (100ml):</span> <span>${oil.caloriesPer100ml} kcal</span></div>
        <div class="metric" style="margin-top: 1rem;"><span>Fat Profile:</span> <span></span></div>
        <div class="metric" style="padding-left: 1rem; font-size: 0.9em;"><span>Saturated:</span> <span>${oil.saturatedFatPct}%</span></div>
        <div class="metric" style="padding-left: 1rem; font-size: 0.9em;"><span>Monounsaturated:</span> <span>${oil.monoFatPct}%</span></div>
        <div class="metric" style="padding-left: 1rem; font-size: 0.9em;"><span>Polyunsaturated:</span> <span>${oil.polyFatPct}%</span></div>
        <div class="metric" style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem;"><span>Price Range:</span> <span style="text-transform: capitalize;">${oil.priceRange}</span></div>
      </div>
      `).join('')}
    </div>

    <h2>Frequently Asked Questions</h2>
    <div class="faq">
      ${faq.map(item => `
      <div class="faq-item">
        <h4>${item.q}</h4>
        <p>${item.a}</p>
      </div>
      `).join('')}
    </div>
  </main>
  <footer>
    <p>&copy; 2026 <a href="https://28grams.vip">28grams.vip</a> &middot; A GAB Ventures property</p>
  </footer>
</body>
</html>`;

fs.writeFileSync('public/cooking-oil-comparison.html', html);
console.log('Created public/cooking-oil-comparison.html');
