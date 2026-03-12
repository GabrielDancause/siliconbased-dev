const https = require('https');
const fs = require('fs');
const path = require('path');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchData = (url) => {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        };

        https.get(url, options, (res) => {
            let data = '';

            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(fetchData(res.headers.location));
            }

            if (res.statusCode !== 200) {
                return reject(new Error(`Status Code: ${res.statusCode}`));
            }

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (e) => {
            reject(e);
        });
    });
};

async function main() {
    const results = [];
    const metadata = {
        pagesAttempted: 0,
        pagesSucceeded: 0,
        successfulPagesList: [],
        totalItemsCollected: 0
    };

    console.log('Starting CoinGecko API pagination test...');

    for (let page = 1; page <= 5; page++) {
        metadata.pagesAttempted++;
        const url = `https://api.coingecko.com/api/v3/exchanges?per_page=50&page=${page}`;
        console.log(`Fetching page ${page}: ${url}`);

        try {
            const data = await fetchData(url);

            if (Array.isArray(data)) {
                const itemCount = data.length;
                console.log(`Successfully fetched page ${page}. Received ${itemCount} items.`);

                // map items to handle 'null over fake' explicitly
                const cleanedData = data.map(item => ({
                    id: item.id || null,
                    name: item.name || null,
                    year_established: item.year_established || null,
                    country: item.country || null,
                    description: item.description || null,
                    url: item.url || null,
                    image: item.image || null,
                    has_trading_incentive: item.has_trading_incentive !== undefined ? item.has_trading_incentive : null,
                    trust_score: item.trust_score !== undefined ? item.trust_score : null,
                    trust_score_rank: item.trust_score_rank !== undefined ? item.trust_score_rank : null,
                    trade_volume_24h_btc: item.trade_volume_24h_btc !== undefined ? item.trade_volume_24h_btc : null,
                    trade_volume_24h_btc_normalized: item.trade_volume_24h_btc_normalized !== undefined ? item.trade_volume_24h_btc_normalized : null
                }));

                results.push(...cleanedData);
                metadata.pagesSucceeded++;
                metadata.successfulPagesList.push(page);
                metadata.totalItemsCollected += itemCount;
            } else {
                console.log(`Page ${page} returned non-array data.`);
            }
        } catch (error) {
            console.error(`Error fetching page ${page}:`, error.message);
        }

        if (page < 5) {
            console.log('Waiting 10 seconds before next request...');
            await delay(10000); // 10 second delay
        }
    }

    console.log('\\n--- Fetching Complete ---');
    console.log(`Pages Attempted: ${metadata.pagesAttempted}`);
    console.log(`Pages Succeeded: ${metadata.pagesSucceeded}`);
    console.log(`Successful Pages: ${metadata.successfulPagesList.join(', ')}`);
    console.log(`Total Items Collected: ${metadata.totalItemsCollected}`);

    const finalOutput = {
        metadata,
        data: results
    };

    // Save JSON
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    const jsonPath = path.join(dataDir, 'test-pagination.json');
    fs.writeFileSync(jsonPath, JSON.stringify(finalOutput, null, 2));
    console.log(`Saved results to ${jsonPath}`);

}

main();
