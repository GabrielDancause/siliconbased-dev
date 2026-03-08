const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const SOURCES = [
  'https://www.kingarthurbaking.com/recipes/sourdough',
  'https://www.theperfectloaf.com/recipes/',
  'https://breadtopia.com/sourdough-bread-recipes/',
  'https://www.seriouseats.com/sourdough-recipes-5117160',
  'https://www.allrecipes.com/search?q=sourdough+bread',
  'https://www.simplyrecipes.com/?s=sourdough',
  'https://sallysbakingaddiction.com/?s=sourdough',
  'https://alexandracooks.com/?s=sourdough'
];

async function fetchHtml(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    return await res.text();
  } catch (e) {
    console.error(`Error fetching ${url}: ${e.message}`);
    return '';
  }
}

async function getRecipeUrls() {
  const allUrls = new Set();

  for (const source of SOURCES) {
    console.log(`Scanning source for links: ${source}`);
    const html = await fetchHtml(source);
    if (!html) continue;

    const dom = new JSDOM(html);
    const links = Array.from(dom.window.document.querySelectorAll('a'))
      .map(a => a.href)
      .filter(href => href && (href.includes('/recipe') || href.includes('sourdough')) && !href.includes('search') && !href.includes('category') && !href.includes('tag'));

    const cleanLinks = links.map(l => {
      if (l.startsWith('/')) {
        try { return new URL(l, source).href; } catch(e) { return null; }
      }
      return l;
    }).filter(l => l && l.startsWith('http'));

    cleanLinks.forEach(l => allUrls.add(l.split('#')[0].split('?')[0]));
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`Found ${allUrls.size} unique potential recipe URLs`);
  return Array.from(allUrls);
}

function parseIngredientWeight(ingredient, type) {
  ingredient = ingredient.toLowerCase();

  // Exclude starter/levain/leaven from flour/water calculations unless explicitly handled
  if (ingredient.includes('starter') || ingredient.includes('levain') || ingredient.includes('leaven')) {
    return 0; // We'll ignore starter for simplicity as instructed, or handled carefully
  }

  // 1. Look for explicit grams
  const gMatch = ingredient.match(/(\d+(?:\.\d+)?)\s*(?:g|grams)\b/i);
  if (gMatch) {
    return parseFloat(gMatch[1]);
  }

  // 2. Look for cups
  const cupMatch = ingredient.match(/(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+)\s*(?:c|cup|cups)\b/i);
  if (cupMatch) {
    let cups = 0;
    const parts = cupMatch[1].split(/\s+/);
    for (const part of parts) {
      if (part.includes('/')) {
        const [num, den] = part.split('/');
        cups += parseFloat(num) / parseFloat(den);
      } else {
        cups += parseFloat(part);
      }
    }
    return type === 'flour' ? cups * 120 : cups * 237;
  }

  // 3. Look for tablespoons
  const tbspMatch = ingredient.match(/(\d+(?:\.\d+)?|\d+\/\d+)\s*(?:tbsp|tablespoon|tablespoons)\b/i);
  if (tbspMatch) {
    let tbsp = 0;
    if (tbspMatch[1].includes('/')) {
      const [num, den] = tbspMatch[1].split('/');
      tbsp = parseFloat(num) / parseFloat(den);
    } else {
      tbsp = parseFloat(tbspMatch[1]);
    }
    return type === 'flour' ? tbsp * 8 : tbsp * 15;
  }

  return 0;
}

function isFlour(ingredient) {
  const i = ingredient.toLowerCase();
  if (i.includes('starter') || i.includes('levain') || i.includes('leaven')) return false;
  return i.includes('flour') || i.includes('rye') || i.includes('spelt') || i.includes('einkorn');
}

function isWater(ingredient) {
  const i = ingredient.toLowerCase();
  if (i.includes('starter') || i.includes('levain') || i.includes('leaven')) return false;
  return i.includes('water') || i.includes('milk') || i.includes('buttermilk');
}

function calculateHydration(ingredients) {
  let totalFlour = 0;
  let totalWater = 0;

  for (const ing of ingredients) {
    if (isFlour(ing)) {
      totalFlour += parseIngredientWeight(ing, 'flour');
    } else if (isWater(ing)) {
      totalWater += parseIngredientWeight(ing, 'water');
    }
  }

  if (totalFlour > 0 && totalWater > 0) {
    const hydration = (totalWater / totalFlour) * 100;
    if (hydration >= 55 && hydration <= 100) {
      return Math.round(hydration * 10) / 10;
    }
  }
  return null;
}

function determineFlourType(ingredients) {
  const joined = ingredients.join(' ').toLowerCase();
  if (joined.includes('bread flour')) return 'Bread Flour';
  if (joined.includes('whole wheat')) return 'Whole Wheat';
  if (joined.includes('rye')) return 'Rye Blend';
  if (joined.includes('all-purpose') || joined.includes('all purpose')) return 'All-Purpose';
  return 'Mixed/Other';
}

function extractNumber(str) {
  if (!str) return null;
  const match = String(str).match(/\d+/);
  return match ? parseInt(match[0]) : null;
}

function parseDurationToMinutes(duration) {
  if (!duration || typeof duration !== 'string') return null;
  // PT1H30M
  let mins = 0;
  const hMatch = duration.match(/(\d+)H/);
  if (hMatch) mins += parseInt(hMatch[1]) * 60;
  const mMatch = duration.match(/(\d+)M/);
  if (mMatch) mins += parseInt(mMatch[1]);
  return mins > 0 ? mins : null;
}

async function processRecipe(url) {
  const html = await fetchHtml(url);
  if (!html) return null;

  const dom = new JSDOM(html);
  const scripts = dom.window.document.querySelectorAll('script[type="application/ld+json"]');

  let recipeData = null;

  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      if (data['@type'] === 'Recipe') {
        recipeData = data;
        break;
      } else if (data['@graph']) {
        const found = data['@graph'].find(item => item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe')));
        if (found) {
          recipeData = found;
          break;
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  if (!recipeData || !recipeData.recipeIngredient) return null;

  const ingredients = Array.isArray(recipeData.recipeIngredient) ? recipeData.recipeIngredient : [recipeData.recipeIngredient];
  const hydration = calculateHydration(ingredients);
  const flourType = determineFlourType(ingredients);

  // Try to find oven temp
  let ovenTempF = null;
  let bakeTimeMin = parseDurationToMinutes(recipeData.cookTime);
  let bulkFermentHours = null;
  let dutchOven = false;

  const instructions = recipeData.recipeInstructions ? JSON.stringify(recipeData.recipeInstructions).toLowerCase() : '';

  // Oven temp regex
  const tempMatch = instructions.match(/(?:bake|oven|preheat).*?(\d{3})\s*(?:°|degrees|f\b)/i);
  if (tempMatch) {
    const temp = parseInt(tempMatch[1]);
    if (temp >= 300 && temp <= 550) ovenTempF = temp;
  }

  // Dutch oven
  if (instructions.includes('dutch oven') || instructions.includes('combo cooker') || ingredients.join(' ').toLowerCase().includes('dutch oven')) {
    dutchOven = true;
  }

  // Bulk ferment hours
  if (instructions.includes('bulk') || instructions.includes('ferment')) {
    const hoursMatch = instructions.match(/(?:bulk|ferment|rise).*?(\d+(?:\.\d+)?)\s*hour/i);
    if (hoursMatch) {
      const hrs = parseFloat(hoursMatch[1]);
      if (hrs >= 1 && hrs <= 24) bulkFermentHours = hrs;
    }
  }

  // Bake time from instructions if cookTime is missing
  if (!bakeTimeMin) {
    const timeMatch = instructions.match(/bake.*?(\d+)\s*min/i);
    if (timeMatch) {
      const mins = parseInt(timeMatch[1]);
      if (mins >= 15 && mins <= 120) bakeTimeMin = mins;
    }
  }

  // Final validation
  if (ovenTempF && (ovenTempF < 300 || ovenTempF > 550)) ovenTempF = null;
  if (bakeTimeMin && (bakeTimeMin < 15 || bakeTimeMin > 120)) bakeTimeMin = null;
  if (bulkFermentHours && (bulkFermentHours < 1 || bulkFermentHours > 24)) bulkFermentHours = null;
  if (hydration && (hydration < 55 || hydration > 100)) return null; // Reject completely if hydration is weird, or we can just set to null?
  // Actually instructions say: "If outside this range, set to null"
  let finalHydration = hydration;
  if (hydration !== null && (hydration < 55 || hydration > 100)) {
    finalHydration = null;
  }

  // If we couldn't get hydration at all, we'll still keep the recipe but it has null hydration.
  // Wait, let's look at instructions: "If you calculate something outside this range, flag it as an outlier or set to null". "If you can't calculate hydration for a recipe, set it to null - don't fake it".

  return {
    name: recipeData.name || 'Unknown Recipe',
    url: url,
    source: new URL(url).hostname.replace('www.', ''),
    hydration: finalHydration,
    flourType: flourType,
    ovenTempF: ovenTempF,
    dutchOven: dutchOven,
    bakeTimeMin: bakeTimeMin,
    bulkFermentHours: bulkFermentHours
  };
}

async function main() {
  console.log('Starting Sourdough Recipe Crawler...');
  const urls = await getRecipeUrls();
  const recipes = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i+1}/${urls.length}] Processing ${url}...`);
    const recipe = await processRecipe(url);
    if (recipe) {
      recipes.push(recipe);
      console.log(`  -> Success: ${recipe.name} (${recipe.hydration ? recipe.hydration + '%' : 'null hyd'})`);
    } else {
      console.log(`  -> Failed/No recipe data`);
    }

    // Stop early if we have enough
    if (recipes.length >= 150) {
      console.log('Reached 150 recipes, stopping crawl.');
      break;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nCrawl complete. Successfully processed ${recipes.length} recipes.`);

  // Analytics
  const validHydration = recipes.filter(r => r.hydration !== null).map(r => r.hydration);
  const validTemp = recipes.filter(r => r.ovenTempF !== null).map(r => r.ovenTempF);
  const validBake = recipes.filter(r => r.bakeTimeMin !== null).map(r => r.bakeTimeMin);
  const validBulk = recipes.filter(r => r.bulkFermentHours !== null).map(r => r.bulkFermentHours);

  const avgHydration = validHydration.length ? validHydration.reduce((a, b) => a + b, 0) / validHydration.length : 0;
  const sortedHydration = [...validHydration].sort((a,b) => a-b);
  const medianHydration = validHydration.length ? sortedHydration[Math.floor(sortedHydration.length / 2)] : 0;

  const avgTemp = validTemp.length ? validTemp.reduce((a, b) => a + b, 0) / validTemp.length : 0;
  const avgBake = validBake.length ? validBake.reduce((a, b) => a + b, 0) / validBake.length : 0;
  const avgBulk = validBulk.length ? validBulk.reduce((a, b) => a + b, 0) / validBulk.length : 0;

  const hydrationDist = { "55-60": 0, "60-65": 0, "65-70": 0, "70-75": 0, "75-80": 0, "80-85": 0, "85-90": 0, "90+": 0 };
  validHydration.forEach(h => {
    if (h < 60) hydrationDist["55-60"]++;
    else if (h < 65) hydrationDist["60-65"]++;
    else if (h < 70) hydrationDist["65-70"]++;
    else if (h < 75) hydrationDist["70-75"]++;
    else if (h < 80) hydrationDist["75-80"]++;
    else if (h < 85) hydrationDist["80-85"]++;
    else if (h < 90) hydrationDist["85-90"]++;
    else hydrationDist["90+"]++;
  });

  const tempDist = { "350-399": 0, "400-449": 0, "450-499": 0, "500+": 0 };
  validTemp.forEach(t => {
    if (t < 400) tempDist["350-399"]++;
    else if (t < 450) tempDist["400-449"]++;
    else if (t < 500) tempDist["450-499"]++;
    else tempDist["500+"]++;
  });

  const flourTypes = {};
  recipes.forEach(r => {
    flourTypes[r.flourType] = (flourTypes[r.flourType] || 0) + 1;
  });

  const dutchOvenCount = recipes.filter(r => r.dutchOven).length;

  const result = {
    crawlDate: new Date().toISOString(),
    methodology: "Data scraped from top sourdough recipe sites. Hydration calculated as (total water weight / total flour weight) * 100, ignoring starter weight. Recipes with incalculable or extreme hydration (<55% or >100%) were excluded from hydration averages.",
    totalRecipes: recipes.length,
    sources: [...new Set(recipes.map(r => r.source))],
    recipes: recipes,
    analysis: {
      avgHydration: Math.round(avgHydration * 10) / 10,
      medianHydration: Math.round(medianHydration * 10) / 10,
      hydrationDistribution: hydrationDist,
      flourTypeBreakdown: flourTypes,
      avgOvenTempF: Math.round(avgTemp),
      ovenTempDistribution: tempDist,
      dutchOvenPct: recipes.length ? Math.round((dutchOvenCount / recipes.length) * 100) : 0,
      avgBakeTimeMin: Math.round(avgBake),
      avgBulkFermentHours: Math.round(avgBulk * 10) / 10
    }
  };

  const outPath = path.join(__dirname, '..', 'data', 'sourdough-study.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`Saved results to ${outPath}`);
}

main().catch(console.error);
