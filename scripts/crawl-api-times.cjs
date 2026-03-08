const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const APIS = [
  { name: 'GitHub API', url: 'https://api.github.com', category: 'utility', requiresAuth: false, rateLimit: '60/hr unauth' },
  { name: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com/posts/1', category: 'utility', requiresAuth: false, rateLimit: 'None' },
  { name: 'httpbin', url: 'https://httpbin.org/get', category: 'utility', requiresAuth: false, rateLimit: 'None' },
  { name: 'Cat Facts', url: 'https://catfact.ninja/fact', category: 'fun', requiresAuth: false, rateLimit: 'None' },
  { name: 'REST Countries', url: 'https://restcountries.com/v3.1/name/canada', category: 'geo', requiresAuth: false, rateLimit: 'None' },
  { name: 'Open Meteo', url: 'https://api.open-meteo.com/v1/forecast?latitude=40.7&longitude=-74&current_weather=true', category: 'utility', requiresAuth: false, rateLimit: '10000/day' },
  { name: 'PokeAPI', url: 'https://pokeapi.co/api/v2/pokemon/pikachu', category: 'fun', requiresAuth: false, rateLimit: '100/min' },
  { name: 'Dog API', url: 'https://dog.ceo/api/breeds/image/random', category: 'fun', requiresAuth: false, rateLimit: 'None' },
  { name: 'Chuck Norris', url: 'https://api.chucknorris.io/jokes/random', category: 'fun', requiresAuth: false, rateLimit: 'None' },
  { name: 'Bored API', url: 'https://www.boredapi.com/api/activity', category: 'fun', requiresAuth: false, rateLimit: 'None' },
  { name: 'IP API', url: 'https://ipapi.co/json/', category: 'geo', requiresAuth: false, rateLimit: '1000/day' },
  { name: 'Exchange Rate', url: 'https://open.er-api.com/v6/latest/USD', category: 'finance', requiresAuth: false, rateLimit: 'None' },
  { name: 'Hacker News', url: 'https://hacker-news.firebaseio.com/v0/topstories.json', category: 'media', requiresAuth: false, rateLimit: 'None' },
  { name: 'Wikipedia', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/JavaScript', category: 'data', requiresAuth: false, rateLimit: '200/s' },
  { name: 'OpenLibrary', url: 'https://openlibrary.org/api/books?bibkeys=ISBN:0451526538&format=json', category: 'data', requiresAuth: false, rateLimit: '100/min' },
  { name: 'Advice Slip', url: 'https://api.adviceslip.com/advice', category: 'fun', requiresAuth: false, rateLimit: 'None' },
  { name: 'Nationalize', url: 'https://api.nationalize.io/?name=michael', category: 'data', requiresAuth: false, rateLimit: '1000/day' },
  { name: 'Agify', url: 'https://api.agify.io/?name=michael', category: 'data', requiresAuth: false, rateLimit: '1000/day' },
  { name: 'CoinGecko', url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', category: 'finance', requiresAuth: false, rateLimit: '10-50/min' },
  { name: 'Deck of Cards', url: 'https://deckofcardsapi.com/api/deck/new/shuffle/', category: 'fun', requiresAuth: false, rateLimit: 'None' },
  { name: 'Faker API', url: 'https://fakerapi.it/api/v1/persons?_quantity=1', category: 'utility', requiresAuth: false, rateLimit: 'None' },
  { name: 'Random User', url: 'https://randomuser.me/api/', category: 'data', requiresAuth: false, rateLimit: 'None' },
  { name: 'SWAPI (Star Wars)', url: 'https://swapi.dev/api/people/1/', category: 'fun', requiresAuth: false, rateLimit: '10000/day' },
  { name: 'Jikan (Anime)', url: 'https://api.jikan.moe/v4/anime/1', category: 'media', requiresAuth: false, rateLimit: '3/sec' },
  { name: 'TVMaze', url: 'https://api.tvmaze.com/singlesearch/shows?q=breaking+bad', category: 'media', requiresAuth: false, rateLimit: '20/10s' },
  { name: 'Zippopotam', url: 'https://api.zippopotam.us/us/90210', category: 'geo', requiresAuth: false, rateLimit: 'None' },
  { name: 'wttr.in', url: 'https://wttr.in/London?format=j1', category: 'utility', requiresAuth: false, rateLimit: 'None' },
  { name: 'Quotable', url: 'https://api.quotable.io/random', category: 'fun', requiresAuth: false, rateLimit: 'None' }
];

const delay = ms => new Promise(res => setTimeout(res, ms));

async function measureRequest(url) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'API-Benchmark-Study/1.0 (siliconbased.dev)',
        'Accept': 'application/json'
      },
      timeout: 10000
    }, (res) => {
      // Consume body
      res.on('data', () => {});
      res.on('end', () => {
        const time = Date.now() - start;
        resolve({ time, status: res.statusCode });
      });
    });

    req.on('error', (err) => {
        resolve({ time: 30001, status: 0 }); // > 30000 is invalid
    });
    req.on('timeout', () => {
        req.destroy();
        resolve({ time: 30001, status: 0 });
    });
    req.end();
  });
}

async function testApi(api) {
  console.log(`Testing ${api.name}...`);
  const times = [];
  let lastStatus = 0;

  for (let i = 0; i < 5; i++) {
    const { time, status } = await measureRequest(api.url);
    if (status > 0) lastStatus = status;
    times.push(time);
    if (i < 4) await delay(1000);
  }

  const validTimes = times.filter(t => t >= 1 && t <= 30000);
  let avgMs = null, minMs = null, maxMs = null;

  if (validTimes.length > 0) {
    avgMs = Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length);
    minMs = Math.min(...validTimes);
    maxMs = Math.max(...validTimes);
  }

  // Follow validation rules
  if (avgMs !== null && (avgMs < 1 || avgMs > 30000)) {
     avgMs = null; minMs = null; maxMs = null;
  }

  return {
    name: api.name,
    url: api.url,
    avgMs,
    minMs,
    maxMs,
    statusCode: lastStatus,
    category: api.category,
    requiresAuth: api.requiresAuth,
    rateLimit: api.rateLimit
  };
}

async function main() {
  const results = [];
  for (const api of APIS) {
    try {
      const res = await testApi(api);
      results.push(res);
    } catch (e) {
      console.error(`Error testing ${api.name}: ${e.message}`);
      results.push({
        name: api.name,
        url: api.url,
        avgMs: null,
        minMs: null,
        maxMs: null,
        statusCode: 0,
        category: api.category,
        requiresAuth: api.requiresAuth,
        rateLimit: api.rateLimit
      });
    }
  }

  const studyData = {
    crawlDate: new Date().toISOString().split('T')[0],
    methodology: "Average response time measured across 5 GET requests, with a 1-second delay between requests.",
    totalApis: results.length,
    results: results
  };

  const dir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const outPath = path.join(dir, 'api-response-times.json');
  fs.writeFileSync(outPath, JSON.stringify(studyData, null, 2));
  console.log(`Saved results to ${outPath}`);

  // Inject into public HTML page
  const htmlPath = path.join(__dirname, '..', 'public', 'api-response-times.html');
  if (fs.existsSync(htmlPath)) {
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const re = /(const DATA = )(\{[\s\S]*?\});/;
    if (re.test(htmlContent)) {
      htmlContent = htmlContent.replace(re, `$1${JSON.stringify(studyData)};`);
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`Injected data into ${htmlPath}`);
    } else {
      // Fallback if the placeholder is still there
      htmlContent = htmlContent.replace('__TEMPLATES_JSON__', JSON.stringify(studyData));
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`Injected data into ${htmlPath}`);
    }
  }
}

main();
