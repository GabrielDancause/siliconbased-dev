const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Disable strict SSL for headless crawling, though it shouldn't be strictly necessary for major domains.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const APIS = [
    { name: 'GitHub API', url: 'https://api.github.com', category: 'utility', requiresAuth: false, rateLimit: '60/hr unauth' },
    { name: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com/posts/1', category: 'utility', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'httpbin', url: 'https://httpbin.org/get', category: 'utility', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'Cat Facts', url: 'https://catfact.ninja/fact', category: 'fun', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'REST Countries', url: 'https://restcountries.com/v3.1/name/canada', category: 'geo', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'Open Meteo', url: 'https://api.open-meteo.com/v1/forecast?latitude=40.7&longitude=-74&current_weather=true', category: 'utility', requiresAuth: false, rateLimit: '10000/day' },
    { name: 'PokeAPI', url: 'https://pokeapi.co/api/v2/pokemon/pikachu', category: 'media', requiresAuth: false, rateLimit: '100/min' },
    { name: 'Dog API', url: 'https://dog.ceo/api/breeds/image/random', category: 'media', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'Chuck Norris', url: 'https://api.chucknorris.io/jokes/random', category: 'fun', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'Bored API', url: 'https://www.boredapi.com/api/activity', category: 'fun', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'IP API', url: 'https://ipapi.co/json/', category: 'geo', requiresAuth: false, rateLimit: '1000/day' },
    { name: 'Exchange Rate', url: 'https://open.er-api.com/v6/latest/USD', category: 'finance', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'Hacker News', url: 'https://hacker-news.firebaseio.com/v0/topstories.json', category: 'media', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'Wikipedia', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/JavaScript', category: 'data', requiresAuth: false, rateLimit: '200/s' },
    { name: 'OpenLibrary', url: 'https://openlibrary.org/api/books?bibkeys=ISBN:0451526538&format=json', category: 'data', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'Advice Slip', url: 'https://api.adviceslip.com/advice', category: 'fun', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'Nationalize', url: 'https://api.nationalize.io/?name=michael', category: 'data', requiresAuth: false, rateLimit: '1000/day' },
    { name: 'Agify', url: 'https://api.agify.io/?name=michael', category: 'data', requiresAuth: false, rateLimit: '1000/day' },
    { name: 'Universities', url: 'https://universities.hipolabs.com/search?country=United+States', category: 'data', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'CoinGecko', url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', category: 'finance', requiresAuth: false, rateLimit: '10-50/min' },
    { name: 'Numbers API', url: 'https://numbersapi.com/42', category: 'data', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'Deck of Cards', url: 'https://deckofcardsapi.com/api/deck/new/shuffle/', category: 'fun', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'Faker API', url: 'https://fakerapi.it/api/v1/persons?_quantity=1', category: 'data', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'Random User', url: 'https://randomuser.me/api/', category: 'data', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'SWAPI (Star Wars)', url: 'https://swapi.dev/api/people/1/', category: 'media', requiresAuth: false, rateLimit: '10000/day' },
    { name: 'Jikan (Anime)', url: 'https://api.jikan.moe/v4/anime/1', category: 'media', requiresAuth: false, rateLimit: '3/sec' },
    { name: 'TVMaze', url: 'https://api.tvmaze.com/singlesearch/shows?q=breaking+bad', category: 'media', requiresAuth: false, rateLimit: '20/10sec' },
    { name: 'Zippopotam', url: 'https://api.zippopotam.us/us/90210', category: 'geo', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'wttr.in', url: 'https://wttr.in/London?format=j1', category: 'utility', requiresAuth: false, rateLimit: 'Unknown' },
    { name: 'Quotable', url: 'https://api.quotable.io/random', category: 'fun', requiresAuth: false, rateLimit: 'Unknown' }
];

const NUM_REQUESTS = 5;
const DELAY_MS = 1000;

function fetchWithTiming(url, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        if (redirectCount > 5) {
            return reject(new Error('Too many redirects'));
        }

        const isHttps = url.startsWith('https://');
        const client = isHttps ? https : http;

        const startTime = performance.now();

        const req = client.get(url, {
            headers: {
                'User-Agent': 'siliconbased-dev-benchmark/1.0',
                'Accept': 'application/json, text/plain, */*'
            },
            timeout: 10000
        }, (res) => {
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const redirectUrl = res.headers.location.startsWith('http')
                    ? res.headers.location
                    : new URL(res.headers.location, url).toString();

                req.abort();
                return fetchWithTiming(redirectUrl, redirectCount + 1)
                    .then(resolve)
                    .catch(reject);
            }

            let data = '';
            res.on('data', chunk => data += chunk);

            res.on('end', () => {
                const endTime = performance.now();
                resolve({
                    statusCode: res.statusCode,
                    timeMs: endTime - startTime
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('timeout', () => {
            req.abort();
            reject(new Error('Timeout'));
        });
    });
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log(`Starting API Benchmark... Testing ${APIS.length} APIs`);
    const results = [];

    for (const api of APIS) {
        console.log(`\nTesting: ${api.name} (${api.url})`);

        const times = [];
        let lastStatus = null;
        let successCount = 0;

        for (let i = 0; i < NUM_REQUESTS; i++) {
            try {
                const res = await fetchWithTiming(api.url);
                lastStatus = res.statusCode;

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    times.push(res.timeMs);
                    successCount++;
                } else {
                    console.log(`  Req ${i+1}: HTTP ${res.statusCode}`);
                }
            } catch (err) {
                console.log(`  Req ${i+1}: Error - ${err.message}`);
                lastStatus = lastStatus || 'Error';
            }

            if (i < NUM_REQUESTS - 1) {
                await sleep(DELAY_MS);
            }
        }

        let avgMs = null;
        let minMs = null;
        let maxMs = null;

        if (times.length > 0) {
            minMs = Math.min(...times);
            maxMs = Math.max(...times);
            const sum = times.reduce((a, b) => a + b, 0);
            const rawAvg = sum / times.length;

            // Validate average 1-30000ms
            if (rawAvg >= 1 && rawAvg <= 30000) {
                avgMs = rawAvg;
            }
        }

        const apiResult = {
            name: api.name,
            url: api.url,
            category: api.category,
            requiresAuth: api.requiresAuth,
            rateLimit: api.rateLimit,
            avgMs: avgMs,
            minMs: minMs,
            maxMs: maxMs,
            statusCode: lastStatus
        };

        console.log(`  Result: Avg=${avgMs ? Math.round(avgMs) : 'null'}ms, Min=${minMs ? Math.round(minMs) : 'null'}ms, Max=${maxMs ? Math.round(maxMs) : 'null'}ms, Status=${lastStatus}`);

        results.push(apiResult);
    }

    const dir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const outPath = path.join(dir, 'api-response-times.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    console.log(`\nSaved benchmark results to ${outPath}`);
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});