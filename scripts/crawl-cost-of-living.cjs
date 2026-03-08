const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const CITIES = [
  { city: "Chiang Mai", country: "Thailand", region: "Southeast Asia", numbeo: "Chiang-Mai" },
  { city: "Bangkok", country: "Thailand", region: "Southeast Asia", numbeo: "Bangkok" },
  { city: "Bali (Canggu)", country: "Indonesia", region: "Southeast Asia", numbeo: "Bali" },
  { city: "Lisbon", country: "Portugal", region: "Europe", numbeo: "Lisbon" },
  { city: "Porto", country: "Portugal", region: "Europe", numbeo: "Porto" },
  { city: "Barcelona", country: "Spain", region: "Europe", numbeo: "Barcelona" },
  { city: "Berlin", country: "Germany", region: "Europe", numbeo: "Berlin" },
  { city: "Prague", country: "Czech Republic", region: "Europe", numbeo: "Prague" },
  { city: "Budapest", country: "Hungary", region: "Europe", numbeo: "Budapest" },
  { city: "Tbilisi", country: "Georgia", region: "Europe", numbeo: "Tbilisi" },
  { city: "Medellín", country: "Colombia", region: "Latin America", numbeo: "Medellin" },
  { city: "Mexico City", country: "Mexico", region: "Latin America", numbeo: "Mexico-City" },
  { city: "Playa del Carmen", country: "Mexico", region: "Latin America", numbeo: "Playa-Del-Carmen-Mexico" },
  { city: "Buenos Aires", country: "Argentina", region: "Latin America", numbeo: "Buenos-Aires" },
  { city: "Lima", country: "Peru", region: "Latin America", numbeo: "Lima" },
  { city: "Bogotá", country: "Colombia", region: "Latin America", numbeo: "Bogota" },
  { city: "Ho Chi Minh City", country: "Vietnam", region: "Southeast Asia", numbeo: "Ho-Chi-Minh-City" },
  { city: "Da Nang", country: "Vietnam", region: "Southeast Asia", numbeo: "Da-Nang" },
  { city: "Kuala Lumpur", country: "Malaysia", region: "Southeast Asia", numbeo: "Kuala-Lumpur" },
  { city: "Seoul", country: "South Korea", region: "East Asia", numbeo: "Seoul" },
  { city: "Tokyo", country: "Japan", region: "East Asia", numbeo: "Tokyo" },
  { city: "Taipei", country: "Taiwan", region: "East Asia", numbeo: "Taipei" },
  { city: "Dubai", country: "United Arab Emirates", region: "Middle East", numbeo: "Dubai" },
  { city: "Cape Town", country: "South Africa", region: "Africa", numbeo: "Cape-Town" },
  { city: "Nairobi", country: "Kenya", region: "Africa", numbeo: "Nairobi" },
  { city: "Marrakech", country: "Morocco", region: "Africa", numbeo: "Marrakech" },
  { city: "Split", country: "Croatia", region: "Europe", numbeo: "Split" },
  { city: "Athens", country: "Greece", region: "Europe", numbeo: "Athens" },
  { city: "Bucharest", country: "Romania", region: "Europe", numbeo: "Bucharest" },
  { city: "Sofia", country: "Bulgaria", region: "Europe", numbeo: "Sofia" },
  { city: "Belgrade", country: "Serbia", region: "Europe", numbeo: "Belgrade" },
  { city: "Tirana", country: "Albania", region: "Europe", numbeo: "Tirana" },
  { city: "Las Palmas", country: "Spain", region: "Europe", numbeo: "Las-Palmas-de-Gran-Canaria" },
  { city: "Florianopolis", country: "Brazil", region: "Latin America", numbeo: "Florianopolis" },
  { city: "Austin", country: "United States", region: "North America", numbeo: "Austin" },
  { city: "Denver", country: "United States", region: "North America", numbeo: "Denver" },
  { city: "Miami", country: "United States", region: "North America", numbeo: "Miami" },
  { city: "New York", country: "United States", region: "North America", numbeo: "New-York" },
  { city: "London", country: "United Kingdom", region: "Europe", numbeo: "London" },
  { city: "Amsterdam", country: "Netherlands", region: "Europe", numbeo: "Amsterdam" },
  { city: "Paris", country: "France", region: "Europe", numbeo: "Paris" },
  { city: "Singapore", country: "Singapore", region: "Southeast Asia", numbeo: "Singapore" }
];

async function getNumbeoData(numbeoId) {
  const url = `https://www.numbeo.com/cost-of-living/in/${numbeoId}?displayCurrency=USD`;
  try {
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);

    const getPrice = (label) => {
      let price = null;
      $('tr').each((i, el) => {
        const text = $(el).find('td').first().text().trim();
        if (text.includes(label)) {
          const priceText = $(el).find('.priceValue').text().trim();
          const match = priceText.replace(/,/g, '').match(/[\d.]+/);
          if (match) {
            price = parseFloat(match[0]);
          }
        }
      });
      return price;
    };

    return {
      rentStudioUSD: getPrice('1 Bedroom Apartment in City Centre') || getPrice('Apartment (1 bedroom) in City Centre'),
      mealCheapUSD: getPrice('Meal at an Inexpensive Restaurant') || getPrice('Meal, Inexpensive Restaurant'),
      coffeeUSD: getPrice('Cappuccino'),
      transportUSD: getPrice('Monthly Pass (Regular Price)') || getPrice('Local Transport Pass'),
    };
  } catch(e) {
    console.error(`Error fetching ${numbeoId}: ${e.message}`);
    return null;
  }
}

async function main() {
  const results = [];

  for (const c of CITIES) {
    console.log(`Fetching data for ${c.city}...`);
    const numbeoData = await getNumbeoData(c.numbeo);

    let rent = null;
    let meal = null;
    let coffee = null;
    let transport = null;

    if (numbeoData) {
      rent = numbeoData.rentStudioUSD;
      meal = numbeoData.mealCheapUSD;
      coffee = numbeoData.coffeeUSD;
      transport = numbeoData.transportUSD;
    }

    // According to issue requirements, we need these fields:
    // monthlyBudgetUSD, rentStudioUSD, mealCheapUSD, coffeeUSD, coworkingMonthlyUSD, internetSpeedMbps, safetyRating, nomadScore, climate

    let monthlyBudgetUSD = null;
    if (rent !== null && meal !== null) {
      // Basic estimated formula: Rent + 60 meals + 30 coffees + transport
      monthlyBudgetUSD = Math.round(rent + (meal * 60) + (coffee ? coffee * 30 : 100) + (transport ? transport : 50));
    }

    results.push({
      city: c.city,
      country: c.country,
      region: c.region,
      monthlyBudgetUSD: monthlyBudgetUSD,
      rentStudioUSD: rent,
      mealCheapUSD: meal,
      coffeeUSD: coffee,
      coworkingMonthlyUSD: null, // Scraper for coworking is complex, using null per instructions
      internetSpeedMbps: null, // Scraper for internet speed via NomadList returns 429
      safetyRating: null, // Scraper for safety returns 429
      nomadScore: null,
      climate: null
    });

    // Sleep to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  const dir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const outPath = path.join(dir, 'cost-of-living-index.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Saved ${results.length} cities to ${outPath}`);
}

main();
