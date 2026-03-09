const fs = require('fs');
const https = require('https');
const { JSDOM } = require('jsdom');

const CITIES = [
  { city: "Chiang Mai", country: "Thailand", region: "Southeast Asia", climate: "Tropical savanna" },
  { city: "Bangkok", country: "Thailand", region: "Southeast Asia", climate: "Tropical savanna" },
  { city: "Bali (Canggu)", numbeoCity: "Bali", country: "Indonesia", region: "Southeast Asia", climate: "Tropical monsoon" },
  { city: "Lisbon", country: "Portugal", region: "Europe", climate: "Mediterranean" },
  { city: "Porto", country: "Portugal", region: "Europe", climate: "Mediterranean" },
  { city: "Barcelona", country: "Spain", region: "Europe", climate: "Mediterranean" },
  { city: "Berlin", country: "Germany", region: "Europe", climate: "Oceanic" },
  { city: "Prague", country: "Czech Republic", region: "Europe", climate: "Oceanic / Humid continental" },
  { city: "Budapest", country: "Hungary", region: "Europe", climate: "Humid subtropical / Oceanic" },
  { city: "Tbilisi", country: "Georgia", region: "Europe", climate: "Humid subtropical" },
  { city: "Medellín", numbeoCity: "Medellin", country: "Colombia", region: "Latin America", climate: "Tropical rainforest" },
  { city: "Mexico City", country: "Mexico", region: "Latin America", climate: "Subtropical highland" },
  { city: "Playa del Carmen", country: "Mexico", region: "Latin America", climate: "Tropical savanna" },
  { city: "Buenos Aires", country: "Argentina", region: "Latin America", climate: "Humid subtropical" },
  { city: "Lima", country: "Peru", region: "Latin America", climate: "Mild desert" },
  { city: "Bogotá", numbeoCity: "Bogota", country: "Colombia", region: "Latin America", climate: "Oceanic / Mediterranean" },
  { city: "Ho Chi Minh City", country: "Vietnam", region: "Southeast Asia", climate: "Tropical savanna" },
  { city: "Da Nang", country: "Vietnam", region: "Southeast Asia", climate: "Tropical monsoon" },
  { city: "Kuala Lumpur", country: "Malaysia", region: "Southeast Asia", climate: "Tropical rainforest" },
  { city: "Seoul", country: "South Korea", region: "East Asia", climate: "Humid continental / Subtropical" },
  { city: "Tokyo", country: "Japan", region: "East Asia", climate: "Humid subtropical" },
  { city: "Taipei", country: "Taiwan", region: "East Asia", climate: "Humid subtropical" },
  { city: "Dubai", country: "United Arab Emirates", region: "Middle East", climate: "Hot desert" },
  { city: "Cape Town", country: "South Africa", region: "Africa", climate: "Mediterranean" },
  { city: "Nairobi", country: "Kenya", region: "Africa", climate: "Subtropical highland" },
  { city: "Marrakech", country: "Morocco", region: "Africa", climate: "Hot semi-arid" },
  { city: "Split", country: "Croatia", region: "Europe", climate: "Mediterranean" },
  { city: "Athens", country: "Greece", region: "Europe", climate: "Mediterranean" },
  { city: "Bucharest", country: "Romania", region: "Europe", climate: "Humid continental" },
  { city: "Sofia", country: "Bulgaria", region: "Europe", climate: "Humid continental" },
  { city: "Belgrade", country: "Serbia", region: "Europe", climate: "Humid subtropical" },
  { city: "Tirana", country: "Albania", region: "Europe", climate: "Mediterranean" },
  { city: "Las Palmas", country: "Spain", region: "Europe", climate: "Hot desert" },
  { city: "Florianopolis", country: "Brazil", region: "Latin America", climate: "Humid subtropical" },
  { city: "Austin", country: "United States", region: "North America", climate: "Humid subtropical" },
  { city: "Denver", country: "United States", region: "North America", climate: "Semi-arid" },
  { city: "Miami", country: "United States", region: "North America", climate: "Tropical monsoon" },
  { city: "New York", country: "United States", region: "North America", climate: "Humid subtropical" },
  { city: "London", country: "United Kingdom", region: "Europe", climate: "Oceanic" },
  { city: "Amsterdam", country: "Netherlands", region: "Europe", climate: "Oceanic" },
  { city: "Paris", country: "France", region: "Europe", climate: "Oceanic" },
  { city: "Singapore", country: "Singapore", region: "Southeast Asia", climate: "Tropical rainforest" }
];

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchPage(new URL(res.headers.location, url).href).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ data, status: res.statusCode }));
    }).on('error', reject);
  });
}

function parseNumbeoValue(html, rowTitle) {
  // We use JSDOM instead of regex for reliable parsing
  const dom = new JSDOM(html);
  const rows = dom.window.document.querySelectorAll('tr');
  for (const row of rows) {
    const tds = row.querySelectorAll('td');
    if (tds.length >= 2) {
      const title = tds[0].textContent.trim();
      if (title.includes(rowTitle)) {
        const valText = tds[1].textContent.trim();
        const match = valText.match(/([\d,]+\.?\d*)/);
        if (match) {
          return parseFloat(match[1].replace(/,/g, ''));
        }
      }
    }
  }
  return null;
}

async function scrapeCity(cityInfo) {
  let cityName = cityInfo.numbeoCity || cityInfo.city;
  // Numbeo uses dashes for spaces in city names in URLs usually (e.g. Chiang-Mai instead of Chiang Mai)
  cityName = cityName.replace(/ /g, '-');
  const numbeoUrl = `https://www.numbeo.com/cost-of-living/in/${encodeURIComponent(cityName)}?displayCurrency=USD`;

  let rentStudioUSD = null;
  let mealCheapUSD = null;
  let coffeeUSD = null;

  try {
    const { data, status } = await fetchPage(numbeoUrl);
    if (status === 200 || status === 301 || status === 302) {
      rentStudioUSD = parseNumbeoValue(data, "1 Bedroom Apartment in City Centre") || parseNumbeoValue(data, "Apartment (1 bedroom) in City Centre");
      mealCheapUSD = parseNumbeoValue(data, "Meal at an Inexpensive Restaurant");
      coffeeUSD = parseNumbeoValue(data, "Cappuccino (Regular Size)") || parseNumbeoValue(data, "Cappuccino (regular)");
    } else {
      console.warn(`[WARN] HTTP ${status} for ${cityName} on Numbeo`);
    }
  } catch (err) {
    console.warn(`[ERROR] Failed to fetch Numbeo for ${cityName}: ${err.message}`);
  }

  if (rentStudioUSD && (rentStudioUSD < 100 || rentStudioUSD > 5000)) rentStudioUSD = null;
  if (mealCheapUSD && (mealCheapUSD < 1 || mealCheapUSD > 50)) mealCheapUSD = null;
  if (coffeeUSD && (coffeeUSD < 0.5 || coffeeUSD > 10)) coffeeUSD = null;

  // Monthly budget calculation
  // Base: rent + 60 meals + 30 coffees + $300 buffer (groceries/transport)
  let monthlyBudgetUSD = null;
  if (rentStudioUSD && mealCheapUSD && coffeeUSD) {
    monthlyBudgetUSD = Math.round(rentStudioUSD + (mealCheapUSD * 60) + (coffeeUSD * 30) + 300);
    // ensure within range
    if (monthlyBudgetUSD < 300 || monthlyBudgetUSD > 8000) monthlyBudgetUSD = null;
  }

  return {
    city: cityInfo.city,
    country: cityInfo.country,
    region: cityInfo.region,
    monthlyBudgetUSD,
    rentStudioUSD,
    mealCheapUSD,
    coffeeUSD,
    coworkingMonthlyUSD: null,
    internetSpeedMbps: null,
    safetyRating: null,
    nomadScore: null,
    climate: cityInfo.climate
  };
}

async function main() {
  console.log("Starting scraper...");
  const results = [];
  for (const cityInfo of CITIES) {
    console.log(`Scraping ${cityInfo.city}...`);
    const data = await scrapeCity(cityInfo);
    results.push(data);
    // small delay
    await new Promise(r => setTimeout(r, 500));
  }

  fs.writeFileSync('data/cost-of-living-index.json', JSON.stringify(results, null, 2));
  console.log("Done! Wrote 42 cities to data/cost-of-living-index.json");
}

main().catch(console.error);
