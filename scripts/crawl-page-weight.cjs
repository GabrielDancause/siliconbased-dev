const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const { URL } = require('url');

// Hardcoded 100 popular websites across 7 industries
const sites = [
  // Tech
  { domain: 'google.com', industry: 'tech' },
  { domain: 'apple.com', industry: 'tech' },
  { domain: 'microsoft.com', industry: 'tech' },
  { domain: 'github.com', industry: 'tech' },
  { domain: 'stackoverflow.com', industry: 'tech' },
  { domain: 'aws.amazon.com', industry: 'tech' },
  { domain: 'cloudflare.com', industry: 'tech' },
  { domain: 'oracle.com', industry: 'tech' },
  { domain: 'ibm.com', industry: 'tech' },
  { domain: 'intel.com', industry: 'tech' },
  { domain: 'cisco.com', industry: 'tech' },
  { domain: 'adobe.com', industry: 'tech' },
  { domain: 'salesforce.com', industry: 'tech' },
  { domain: 'zoom.us', industry: 'tech' },
  { domain: 'atlassian.com', industry: 'tech' },

  // Media
  { domain: 'nytimes.com', industry: 'media' },
  { domain: 'cnn.com', industry: 'media' },
  { domain: 'bbc.co.uk', industry: 'media' },
  { domain: 'washingtonpost.com', industry: 'media' },
  { domain: 'theguardian.com', industry: 'media' },
  { domain: 'wsj.com', industry: 'media' },
  { domain: 'bloomberg.com', industry: 'media' },
  { domain: 'forbes.com', industry: 'media' },
  { domain: 'reuters.com', industry: 'media' },
  { domain: 'npr.org', industry: 'media' },
  { domain: 'foxnews.com', industry: 'media' },
  { domain: 'usatoday.com', industry: 'media' },
  { domain: 'buzzfeed.com', industry: 'media' },
  { domain: 'vice.com', industry: 'media' },

  // Ecommerce
  { domain: 'amazon.com', industry: 'ecommerce' },
  { domain: 'ebay.com', industry: 'ecommerce' },
  { domain: 'walmart.com', industry: 'ecommerce' },
  { domain: 'etsy.com', industry: 'ecommerce' },
  { domain: 'target.com', industry: 'ecommerce' },
  { domain: 'homedepot.com', industry: 'ecommerce' },
  { domain: 'bestbuy.com', industry: 'ecommerce' },
  { domain: 'costco.com', industry: 'ecommerce' },
  { domain: 'macys.com', industry: 'ecommerce' },
  { domain: 'wayfair.com', industry: 'ecommerce' },
  { domain: 'ikea.com', industry: 'ecommerce' },
  { domain: 'aliexpress.com', industry: 'ecommerce' },
  { domain: 'shein.com', industry: 'ecommerce' },
  { domain: 'nike.com', industry: 'ecommerce' },

  // Finance
  { domain: 'chase.com', industry: 'finance' },
  { domain: 'bankofamerica.com', industry: 'finance' },
  { domain: 'wellsfargo.com', industry: 'finance' },
  { domain: 'citi.com', industry: 'finance' },
  { domain: 'americanexpress.com', industry: 'finance' },
  { domain: 'capitalone.com', industry: 'finance' },
  { domain: 'paypal.com', industry: 'finance' },
  { domain: 'stripe.com', industry: 'finance' },
  { domain: 'fidelity.com', industry: 'finance' },
  { domain: 'vanguard.com', industry: 'finance' },
  { domain: 'schwab.com', industry: 'finance' },
  { domain: 'coinbase.com', industry: 'finance' },
  { domain: 'discover.com', industry: 'finance' },
  { domain: 'usbank.com', industry: 'finance' },
  { domain: 'robinhood.com', industry: 'finance' },

  // Social
  { domain: 'facebook.com', industry: 'social' },
  { domain: 'twitter.com', industry: 'social' },
  { domain: 'instagram.com', industry: 'social' },
  { domain: 'linkedin.com', industry: 'social' },
  { domain: 'pinterest.com', industry: 'social' },
  { domain: 'reddit.com', industry: 'social' },
  { domain: 'tiktok.com', industry: 'social' },
  { domain: 'snapchat.com', industry: 'social' },
  { domain: 'tumblr.com', industry: 'social' },
  { domain: 'discord.com', industry: 'social' },
  { domain: 'twitch.tv', industry: 'social' },
  { domain: 'quora.com', industry: 'social' },
  { domain: 'whatsapp.com', industry: 'social' },
  { domain: 'telegram.org', industry: 'social' },

  // Travel
  { domain: 'booking.com', industry: 'travel' },
  { domain: 'expedia.com', industry: 'travel' },
  { domain: 'airbnb.com', industry: 'travel' },
  { domain: 'tripadvisor.com', industry: 'travel' },
  { domain: 'kayak.com', industry: 'travel' },
  { domain: 'skyscanner.net', industry: 'travel' },
  { domain: 'hotels.com', industry: 'travel' },
  { domain: 'marriott.com', industry: 'travel' },
  { domain: 'hilton.com', industry: 'travel' },
  { domain: 'uber.com', industry: 'travel' },
  { domain: 'lyft.com', industry: 'travel' },
  { domain: 'delta.com', industry: 'travel' },
  { domain: 'aa.com', industry: 'travel' },
  { domain: 'united.com', industry: 'travel' },

  // Gaming
  { domain: 'ign.com', industry: 'gaming' },
  { domain: 'gamespot.com', industry: 'gaming' },
  { domain: 'steampowered.com', industry: 'gaming' },
  { domain: 'roblox.com', industry: 'gaming' },
  { domain: 'epicgames.com', industry: 'gaming' },
  { domain: 'ea.com', industry: 'gaming' },
  { domain: 'nintendo.com', industry: 'gaming' },
  { domain: 'playstation.com', industry: 'gaming' },
  { domain: 'xbox.com', industry: 'gaming' },
  { domain: 'pcgamer.com', industry: 'gaming' },
  { domain: 'polygon.com', industry: 'gaming' },
  { domain: 'kotaku.com', industry: 'gaming' },
  { domain: 'blizzard.com', industry: 'gaming' },
  { domain: 'minecraft.net', industry: 'gaming' }
];

const TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 3;

function makeRequest(targetUrl, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > MAX_REDIRECTS) {
      return reject(new Error('Too many redirects'));
    }

    const parsedUrl = new URL(targetUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PageWeightBot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      },
      timeout: TIMEOUT_MS
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, targetUrl).toString();
        }
        res.resume(); // Consume response data to free up memory
        return resolve(makeRequest(redirectUrl, redirectCount + 1));
      }

      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
      });

      res.on('end', () => {
        resolve({
          size,
          server: res.headers.server || 'Unknown',
          status: res.statusCode
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  const results = [];
  console.log(`Starting crawl of ${sites.length} websites...`);

  for (let i = 0; i < sites.length; i++) {
    const site = sites[i];
    const url = `https://${site.domain}`;
    console.log(`[${i + 1}/${sites.length}] Fetching ${url}...`);

    try {
      const data = await makeRequest(url);
      results.push({
        domain: site.domain,
        industry: site.industry,
        sizeBytes: data.size,
        server: data.server,
        status: data.status,
        error: null
      });
    } catch (err) {
      console.log(`  Error: ${err.message}`);
      // Fallback to estimated data if request fails completely
      // For study completeness, if network completely blocks us, use an estimate based on industry avg
      // But we record the error so we know it was synthesized
      results.push({
        domain: site.domain,
        industry: site.industry,
        sizeBytes: null, // We'll fill this later or skip it
        server: 'Unknown',
        status: 0,
        error: err.message
      });
    }

    // Small delay to be polite
    await new Promise(r => setTimeout(r, 200));
  }

  // Process data for summaries
  const validResults = results.filter(r => r.sizeBytes !== null && r.sizeBytes > 0);

  if (validResults.length === 0) {
    console.error("No valid results fetched. Perhaps network is completely blocked.");
  }

  // Calculate industry averages
  const industryStats = {};
  validResults.forEach(r => {
    if (!industryStats[r.industry]) {
      industryStats[r.industry] = { count: 0, totalSize: 0 };
    }
    industryStats[r.industry].count++;
    industryStats[r.industry].totalSize += r.sizeBytes;
  });

  const industryAverages = {};
  for (const [ind, data] of Object.entries(industryStats)) {
    industryAverages[ind] = Math.round(data.totalSize / data.count);
  }

  validResults.sort((a, b) => b.sizeBytes - a.sizeBytes);
  const top10Heaviest = validResults.slice(0, 10);
  const top10Lightest = [...validResults].sort((a, b) => a.sizeBytes - b.sizeBytes).slice(0, 10);

  const totalSizeAll = validResults.reduce((sum, r) => sum + r.sizeBytes, 0);
  const avgSizeAll = validResults.length > 0 ? Math.round(totalSizeAll / validResults.length) : 0;

  // Print Summary
  console.log('\n=== CRAWL SUMMARY ===');
  console.log(`Total valid sites: ${validResults.length}/${sites.length}`);
  console.log(`Overall Average Size: ${(avgSizeAll / 1024).toFixed(2)} KB`);
  console.log('\nAverage by Industry:');
  for (const [ind, avg] of Object.entries(industryAverages)) {
    console.log(`  ${ind}: ${(avg / 1024).toFixed(2)} KB`);
  }

  console.log('\nTop 10 Heaviest:');
  top10Heaviest.forEach((r, i) => console.log(`  ${i+1}. ${r.domain} - ${(r.sizeBytes / 1024).toFixed(2)} KB`));

  console.log('\nTop 10 Lightest:');
  top10Lightest.forEach((r, i) => console.log(`  ${i+1}. ${r.domain} - ${(r.sizeBytes / 1024).toFixed(2)} KB`));

  // Save to file
  const outputData = {
    crawlDate: new Date().toISOString(),
    totalSites: sites.length,
    validSites: validResults.length,
    avgSizeBytes: avgSizeAll,
    industryAverages: industryAverages,
    results: results
  };

  const outDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, 'page-weight-study.json');
  fs.writeFileSync(outFile, JSON.stringify(outputData, null, 2));
  console.log(`\nResults saved to ${outFile}`);
}

run().catch(console.error);
