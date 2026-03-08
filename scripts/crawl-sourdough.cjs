const fs = require('fs');
const https = require('https');

// Helper to fetch HTML from URL
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchHtml(res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href));
      }
      if (res.statusCode !== 200) {
        return resolve(null); // Return null on failure to not crash the whole process
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => resolve(null));
  });
}

// 50+ Real Sourdough Recipe URLs
const urls = [
  "https://www.theperfectloaf.com/beginners-sourdough-bread/",
  "https://www.theperfectloaf.com/best-sourdough-recipe/",
  "https://www.theperfectloaf.com/high-hydration-sourdough-bread/",
  "https://www.theperfectloaf.com/simple-weekday-sourdough-bread/",
  "https://www.theperfectloaf.com/sourdough-pizza-dough-and-recipes/",
  "https://www.theperfectloaf.com/spelt-sourdough-bread/",
  "https://www.theperfectloaf.com/rye-sourdough-bread/",
  "https://www.theperfectloaf.com/whole-wheat-sourdough-bread/",
  "https://www.theperfectloaf.com/sourdough-sandwich-bread-with-pre-gelatinized-flour/",
  "https://www.theperfectloaf.com/sourdough-baguettes/",
  "https://www.theperfectloaf.com/sourdough-ciabatta/",
  "https://www.theperfectloaf.com/rosemary-sourdough/",
  "https://www.theperfectloaf.com/jalapeno-cheddar-sourdough-bread/",
  "https://www.theperfectloaf.com/walnut-cranberry-sourdough/",
  "https://www.kingarthurbaking.com/recipes/extra-tangy-sourdough-bread-recipe",
  "https://www.kingarthurbaking.com/recipes/rustic-sourdough-bread-recipe",
  "https://www.kingarthurbaking.com/recipes/naturally-leavened-sourdough-bread-recipe",
  "https://www.kingarthurbaking.com/recipes/sourdough-pizza-crust-recipe",
  "https://www.kingarthurbaking.com/recipes/basic-sourdough-bread-recipe",
  "https://www.kingarthurbaking.com/recipes/sourdough-sandwich-bread-recipe",
  "https://www.kingarthurbaking.com/recipes/sourdough-focaccia-recipe",
  "https://www.kingarthurbaking.com/recipes/no-knead-sourdough-bread-recipe",
  "https://www.kingarthurbaking.com/recipes/whole-wheat-sourdough-bread-recipe",
  "https://www.kingarthurbaking.com/recipes/rye-sourdough-bread-recipe",
  "https://www.kingarthurbaking.com/recipes/sourdough-baguettes-recipe",
  "https://www.kingarthurbaking.com/recipes/sourdough-english-muffins-recipe",
  "https://www.kingarthurbaking.com/recipes/sourdough-cinnamon-rolls-recipe",
  "https://www.kingarthurbaking.com/recipes/sourdough-waffles-or-pancakes-recipe",
  "https://www.seriouseats.com/how-to-make-sourdough-bread",
  "https://www.seriouseats.com/sourdough-starter-recipe",
  "https://www.seriouseats.com/sourdough-focaccia-recipe",
  "https://www.seriouseats.com/sourdough-pizza-recipe",
  "https://www.seriouseats.com/sourdough-waffles-recipe",
  "https://www.seriouseats.com/sourdough-pancakes-recipe",
  "https://breadtopia.com/sourdough-no-knead-bread/",
  "https://breadtopia.com/spelt-bread-recipe/",
  "https://breadtopia.com/whole-wheat-sourdough-bread/",
  "https://breadtopia.com/sourdough-rye-bread/",
  "https://breadtopia.com/sourdough-pizza/",
  "https://breadtopia.com/sourdough-waffles-and-pancakes/",
  "https://breadtopia.com/sourdough-english-muffins/",
  "https://breadtopia.com/einkorn-sourdough-bread/",
  "https://breadtopia.com/kamut-sourdough-bread/",
  "https://food52.com/recipes/80565-table-loaf",
  "https://food52.com/recipes/82761-sourdough-bread-recipe",
  "https://food52.com/recipes/82335-sourdough-focaccia-recipe",
  "https://food52.com/recipes/83020-sourdough-pizza-dough-recipe",
  "https://food52.com/recipes/82877-sourdough-discard-crackers-recipe",
  "https://food52.com/recipes/83151-sourdough-waffles-recipe",
  "https://www.allrecipes.com/recipe/260540/chef-johns-sourdough-bread/",
  "https://www.allrecipes.com/recipe/276136/easy-sourdough-bread/",
  "https://www.allrecipes.com/recipe/279815/sourdough-pizza-crust/",
  "https://www.allrecipes.com/recipe/238122/sourdough-waffles/",
  "https://www.allrecipes.com/recipe/212005/sourdough-pancakes/",
  "https://www.bonappetit.com/recipe/sourdough-bread",
  "https://www.bonappetit.com/recipe/sourdough-focaccia",
  "https://www.bonappetit.com/recipe/sourdough-pizza",
  "https://www.bonappetit.com/recipe/sourdough-waffles",
  "https://www.bonappetit.com/recipe/sourdough-pancakes"
];

function extractJsonLd(html) {
  const matches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of matches) {
    try {
      const data = JSON.parse(match[1]);
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) return item;
        }
      } else if (data['@graph']) {
        for (const item of data['@graph']) {
          if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) return item;
        }
      } else {
        if (data['@type'] === 'Recipe' || (Array.isArray(data['@type']) && data['@type'].includes('Recipe'))) return data;
      }
    } catch (e) {}
  }
  return null;
}

function calculateHydration(ingredientsStr, html) {
  let waterG = 0;
  let flourG = 0;

  // Simple heuristic based on text if structured data missing
  const text = ingredientsStr.toLowerCase();

  // Try to find explicit hydration in text
  const hydrationMatch = html.match(/(\d{2,3})(?:\.\d+)?%\s*hydration/i);
  if (hydrationMatch) return parseFloat(hydrationMatch[1]);

  // Rough estimation logic from text could go here, but parsing natural language ingredients is tough.
  // Instead, look for grams.
  const flourMatches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(g|grams|gram)\s+(?:of\s+)?(?:bread\s+flour|all-purpose\s+flour|whole\s+wheat\s+flour|rye\s+flour|flour)/g)];
  for (const m of flourMatches) flourG += parseFloat(m[1]);

  const waterMatches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(g|grams|gram)\s+(?:of\s+)?(?:water|h2o)/g)];
  for (const m of waterMatches) waterG += parseFloat(m[1]);

  // If no grams, try cups
  if (flourG === 0) {
    const fCups = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(?:cup|cups)\s+(?:of\s+)?(?:bread\s+flour|all-purpose\s+flour|whole\s+wheat\s+flour|rye\s+flour|flour)/g)];
    for (const m of fCups) flourG += parseFloat(m[1]) * 120; // 1 cup flour ~ 120g
  }
  if (waterG === 0) {
    const wCups = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(?:cup|cups)\s+(?:of\s+)?(?:water)/g)];
    for (const m of wCups) waterG += parseFloat(m[1]) * 240; // 1 cup water ~ 240g
  }

  if (flourG > 0 && waterG > 0) {
    let hyd = (waterG / flourG) * 100;
    if (hyd >= 50 && hyd <= 120) return Math.round(hyd);
  }

  return null;
}

function determineFlourType(ingredientsStr) {
  const t = ingredientsStr.toLowerCase();
  if (t.includes('bread flour') && t.includes('whole wheat')) return 'whole wheat blend';
  if (t.includes('bread flour')) return 'bread flour';
  if (t.includes('all-purpose') || t.includes('all purpose')) return 'all-purpose';
  if (t.includes('whole wheat')) return 'whole wheat';
  if (t.includes('rye')) return 'rye';
  if (t.includes('spelt')) return 'spelt';
  return 'bread flour'; // Default guess if unclear but it's sourdough
}

function parseDuration(isoStr) {
  if (!isoStr) return null;
  const match = isoStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  const h = parseInt(match[1] || 0, 10);
  const m = parseInt(match[2] || 0, 10);
  return h * 60 + m;
}

async function scrape() {
  const recipes = [];
  let successCount = 0;

  for (const url of urls) {
    console.log(`Fetching ${url}...`);
    const html = await fetchHtml(url);
    if (!html) continue;

    const recipeData = extractJsonLd(html);
    if (!recipeData) {
      console.log(`No JSON-LD found for ${url}`);
      continue;
    }

    const name = recipeData.name || 'Unknown Recipe';
    const domain = new URL(url).hostname.replace('www.', '');

    // Ingredients
    let ingredients = recipeData.recipeIngredient || [];
    if (typeof ingredients === 'string') ingredients = [ingredients];
    const ingredientsStr = ingredients.join('\n');

    // Stats
    const hydration = calculateHydration(ingredientsStr, html);
    const flourType = determineFlourType(ingredientsStr);

    // Temp
    let ovenTempF = null;
    const tempMatch = html.match(/(?:bake|oven).*?(?:at\s+)?(\d{3})\s*(?:°|degrees|F)/i);
    if (tempMatch && parseInt(tempMatch[1]) >= 300 && parseInt(tempMatch[1]) <= 600) {
      ovenTempF = parseInt(tempMatch[1]);
    } else {
      // Look in instructions
      let instructions = recipeData.recipeInstructions || [];
      if (Array.isArray(instructions)) {
        instructions = instructions.map(i => i.text || i).join(' ');
      }
      const tMatch2 = instructions.match(/(\d{3})\s*(?:°|degrees|F)/i);
      if (tMatch2 && parseInt(tMatch2[1]) >= 300 && parseInt(tMatch2[1]) <= 600) {
        ovenTempF = parseInt(tMatch2[1]);
      }
    }

    // Time
    const bakeTimeMin = parseDuration(recipeData.cookTime) || (html.match(/bake.*?for.*?(\d{2})\s*min/i) ? parseInt(html.match(/bake.*?for.*?(\d{2})\s*min/i)[1]) : null);
    const totalTimeHours = parseDuration(recipeData.totalTime) ? Math.round(parseDuration(recipeData.totalTime) / 60 * 10) / 10 : null;

    // Ferment / Proof
    let bulkFermentHours = null;
    let proofHours = null;
    const bulkMatch = html.match(/bulk ferment.*?(?:for\s+)?(\d+(?:\.\d+)?)\s*hours/i);
    if (bulkMatch) bulkFermentHours = parseFloat(bulkMatch[1]);
    const proofMatch = html.match(/proof.*?(?:for\s+)?(\d+(?:\.\d+)?)\s*hours/i);
    if (proofMatch) proofHours = parseFloat(proofMatch[1]);

    const usesDutchOven = html.toLowerCase().includes('dutch oven') || html.toLowerCase().includes('combo cooker');
    const usesStarter = html.toLowerCase().includes('starter') || html.toLowerCase().includes('levain');

    // Only include if it's somewhat valid (has ingredients)
    if (ingredients.length > 0) {
      recipes.push({
        recipeName: name,
        sourceUrl: url,
        sourceDomain: domain,
        hydration: hydration || null,
        flourType,
        ovenTempF: ovenTempF || null,
        bakeTimeMin: bakeTimeMin || null,
        bulkFermentHours: bulkFermentHours || null,
        proofHours: proofHours || null,
        usesDutchOven,
        usesStarter,
        totalTimeHours: totalTimeHours || null
      });
      successCount++;
    }

    // Sleep a tiny bit to avoid hammering
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`Successfully parsed ${successCount} recipes.`);

  // Calculate Aggregates
  const totalRecipes = recipes.length;
  if (totalRecipes === 0) {
    console.error("No recipes found!");
    return;
  }

  const hydrations = recipes.map(r => r.hydration).filter(h => h !== null);
  const avgHydration = hydrations.length ? hydrations.reduce((sum, h) => sum + h, 0) / hydrations.length : 0;

  const temps = recipes.map(r => r.ovenTempF).filter(t => t !== null);
  const avgOvenTempF = temps.length ? Math.round(temps.reduce((sum, t) => sum + t, 0) / temps.length) : 0;

  const bakes = recipes.map(r => r.bakeTimeMin).filter(b => b !== null);
  const avgBakeTimeMin = bakes.length ? Math.round(bakes.reduce((sum, b) => sum + b, 0) / bakes.length) : 0;

  const bulks = recipes.map(r => r.bulkFermentHours).filter(b => b !== null);
  const avgBulkFermentHours = bulks.length ? Math.round(bulks.reduce((sum, b) => sum + b, 0) / bulks.length * 10) / 10 : 0;

  const dutchOvenCount = recipes.filter(r => r.usesDutchOven).length;
  const dutchOvenPct = Math.round((dutchOvenCount / totalRecipes) * 100);

  const hydrationDistribution = {"60-65": 0, "65-70": 0, "70-75": 0, "75-80": 0, "80-85": 0, "85+": 0};
  hydrations.forEach(h => {
    if (h < 65) hydrationDistribution["60-65"]++;
    else if (h < 70) hydrationDistribution["65-70"]++;
    else if (h < 75) hydrationDistribution["70-75"]++;
    else if (h < 80) hydrationDistribution["75-80"]++;
    else if (h < 85) hydrationDistribution["80-85"]++;
    else hydrationDistribution["85+"]++;
  });

  const flourTypeBreakdown = {};
  recipes.forEach(r => {
    flourTypeBreakdown[r.flourType] = (flourTypeBreakdown[r.flourType] || 0) + 1;
  });

  const uniqueSources = [...new Set(recipes.map(r => r.sourceDomain))];

  const finalData = {
    crawlDate: new Date().toISOString(),
    methodology: `Scraped ${totalRecipes} recipe pages from ${uniqueSources.length} sources, extracted structured recipe data`,
    totalRecipes,
    sources: uniqueSources,
    recipes,
    analysis: {
      avgHydration: Math.round(avgHydration * 10) / 10,
      medianHydration: hydrations.sort((a,b)=>a-b)[Math.floor(hydrations.length/2)] || 0,
      hydrationDistribution,
      flourTypeBreakdown,
      avgOvenTempF,
      dutchOvenPct,
      avgBakeTimeMin,
      avgBulkFermentHours
    }
  };

  // Write JSON file
  fs.writeFileSync('data/sourdough-study.json', JSON.stringify(finalData, null, 2));
  console.log("Wrote data/sourdough-study.json");

  // Inject into HTML using Regex to allow repeatable runs
  if (fs.existsSync('public/sourdough-study.html')) {
    let htmlContent = fs.readFileSync('public/sourdough-study.html', 'utf8');
    htmlContent = htmlContent.replace(/(<script id="study-data" type="application\/json">)[\s\S]*?(<\/script>)/, `$1\n${JSON.stringify(finalData)}\n$2`);
    fs.writeFileSync('public/sourdough-study.html', htmlContent);
    console.log("Injected data into public/sourdough-study.html");
  }
}

scrape().catch(console.error);
