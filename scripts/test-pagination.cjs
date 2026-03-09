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

    // Generate HTML
    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    // Pick 5 samples, handling case if we got none or less than 5
    const samples = results.slice(0, 5).map(r => ({
        id: r.id || null,
        name: r.name || null,
        year_established: r.year_established || null,
        url: r.url || null
    }));

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pagination Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
        .metadata { background: #f0f0f0; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 0.5rem; border: 1px solid #ccc; text-align: left; }
        th { background: #eee; }
    </style>
</head>
<body>
    <h1>Pagination Test Results</h1>

    <div class="metadata">
        <h2>Metadata</h2>
        <p><strong>Pages Attempted:</strong> ${metadata.pagesAttempted}</p>
        <p><strong>Pages Succeeded:</strong> ${metadata.pagesSucceeded}</p>
        <p><strong>Successful Pages List:</strong> ${metadata.successfulPagesList.join(', ')}</p>
        <p><strong>Total Items Collected:</strong> ${metadata.totalItemsCollected}</p>
    </div>

    <h2>Sample Data (First 5 Items)</h2>
    ${samples.length > 0 ? `
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Year Established</th>
                <th>URL</th>
            </tr>
        </thead>
        <tbody>
            ${samples.map(s => `
            <tr>
                <td>${s.id !== null ? s.id : 'N/A'}</td>
                <td>${s.name !== null ? s.name : 'N/A'}</td>
                <td>${s.year_established !== null ? s.year_established : 'N/A'}</td>
                <td>${s.url !== null ? `<a href="${s.url}" target="_blank">${s.url}</a>` : 'N/A'}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    ` : '<p>No data collected.</p>'}
</body>
</html>`;

    const htmlPath = path.join(publicDir, 'test-pagination-results.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`Saved HTML report to ${htmlPath}`);
}

main();
