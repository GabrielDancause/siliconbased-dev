const https = require("https");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");
const path = require("path");

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
  { city: "Las Palmas", country: "Spain", region: "Europe", numbeo: "Las-Palmas" },
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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(fetchUrl(res.headers.location.startsWith('http') ? res.headers.location : `https://www.numbeo.com${res.headers.location}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({code: res.statusCode, data}));
    }).on('error', reject);
  });
}

function extractNumber(text) {
  if (!text) return null;
  const match = text.replace(/,/g, '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

function getClimate(region) {
    const map = {
        "Southeast Asia": "Tropical, hot and humid year-round",
        "Europe": "Temperate, distinct seasons",
        "Latin America": "Varies from tropical to temperate",
        "East Asia": "Temperate, four distinct seasons",
        "Middle East": "Desert, hot and arid",
        "Africa": "Varies by region, generally warm",
        "North America": "Varies widely, generally temperate"
    };
    return map[region] || "Varies";
}

async function scrapeCity(cityInfo) {
  console.log(`Scraping ${cityInfo.city}...`);
  try {
      const url = `https://www.numbeo.com/cost-of-living/in/${cityInfo.numbeo}?displayCurrency=USD`;
      const res = await fetchUrl(url);

      const dom = new JSDOM(res.data);
      const document = dom.window.document;

      let rentStudioUSD = null;
      let mealCheapUSD = null;
      let coffeeUSD = null;
      let internetSpeedMbps = null;
      let singlePersonWithoutRent = null;

      const rows = document.querySelectorAll('tr');
      for (const row of rows) {
          const text = row.textContent.replace(/\s+/g, ' ').trim();
          const td2 = row.querySelector('td:nth-child(2)');
          const val = td2 ? extractNumber(td2.textContent) : null;

          if (text.includes("Meal, Inexpensive Restaurant") || text.includes("Meal at an Inexpensive Restaurant")) {
              if (val !== null && mealCheapUSD === null) mealCheapUSD = val;
          } else if (text.includes("1 Bedroom Apartment in City Centre")) {
              if (val !== null && rentStudioUSD === null) rentStudioUSD = val;
          } else if (text.includes("Cappuccino (regular)")) {
              if (val !== null && coffeeUSD === null) coffeeUSD = val;
          } else if (text.includes("Internet")) {
               if (val !== null && internetSpeedMbps === null) internetSpeedMbps = val;
          }
      }

      const lis = document.querySelectorAll('li');
      for (const li of lis) {
          if (li.textContent.includes('single person')) {
             const match = li.textContent.replace(/,/g, '').match(/[\d.]+\$/);
             if (match) {
                 singlePersonWithoutRent = parseFloat(match[0].replace('$', ''));
             }
          }
      }

      // Calculate a realistic nomad monthly budget
      // (Single person living cost without rent + City center studio + Coworking + extra padding for short-term stays)
      let monthlyBudgetUSD = null;
      if (singlePersonWithoutRent !== null && rentStudioUSD !== null) {
          const coworkingMonthlyUSD = 150; // default assumption for coworking
          monthlyBudgetUSD = Math.round(singlePersonWithoutRent + rentStudioUSD + coworkingMonthlyUSD + 150);
          // Sanity checks
          if (monthlyBudgetUSD < 300) monthlyBudgetUSD = 300;
          if (monthlyBudgetUSD > 8000) monthlyBudgetUSD = 8000;
      }

      const safetyRating = null; // We'll leave this null over fake, as per instructions
      const nomadScore = null;

      const climate = getClimate(cityInfo.region);

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
          safetyRating,
          nomadScore,
          climate
      };

  } catch (err) {
      console.error(`Failed to scrape ${cityInfo.city}:`, err.message);
      return {
          city: cityInfo.city,
          country: cityInfo.country,
          region: cityInfo.region,
          monthlyBudgetUSD: null,
          rentStudioUSD: null,
          mealCheapUSD: null,
          coffeeUSD: null,
          coworkingMonthlyUSD: null,
          internetSpeedMbps: null,
          safetyRating: null,
          nomadScore: null,
          climate: getClimate(cityInfo.region)
      };
  }
}

async function main() {
    const results = [];
    for (const city of CITIES) {
        const data = await scrapeCity(city);
        results.push(data);
        await sleep(200); // Be nice to Numbeo
    }

    fs.mkdirSync(path.join(__dirname, "../data"), { recursive: true });
    fs.writeFileSync(path.join(__dirname, "../data/cost-of-living-index.json"), JSON.stringify(results, null, 2));
    console.log("Data saved to data/cost-of-living-index.json");
}

main().catch(console.error);
