const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { JSDOM } = require('jsdom');

// Disable strict SSL for headless crawling, though it shouldn't be strictly necessary for major domains.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const SITES = [
  // Tech
  { domain: 'google.com', industry: 'tech' },
  { domain: 'microsoft.com', industry: 'tech' },
  { domain: 'apple.com', industry: 'tech' },
  { domain: 'github.com', industry: 'tech' },
  { domain: 'cloudflare.com', industry: 'tech' },
  { domain: 'aws.amazon.com', industry: 'tech' },
  { domain: 'ibm.com', industry: 'tech' },
  { domain: 'oracle.com', industry: 'tech' },
  { domain: 'cisco.com', industry: 'tech' },
  { domain: 'salesforce.com', industry: 'tech' },
  { domain: 'intel.com', industry: 'tech' },
  { domain: 'adobe.com', industry: 'tech' },
  { domain: 'zoom.us', industry: 'tech' },
  { domain: 'atlassian.com', industry: 'tech' },
  // Media
  { domain: 'nytimes.com', industry: 'media' },
  { domain: 'cnn.com', industry: 'media' },
  { domain: 'bbc.com', industry: 'media' },
  { domain: 'wsj.com', industry: 'media' },
  { domain: 'forbes.com', industry: 'media' },
  { domain: 'bloomberg.com', industry: 'media' },
  { domain: 'reuters.com', industry: 'media' },
  { domain: 'theguardian.com', industry: 'media' },
  { domain: 'washingtonpost.com', industry: 'media' },
  { domain: 'foxnews.com', industry: 'media' },
  { domain: 'cnbc.com', industry: 'media' },
  { domain: 'npr.org', industry: 'media' },
  { domain: 'usatoday.com', industry: 'media' },
  { domain: 'time.com', industry: 'media' },
  // Ecommerce
  { domain: 'amazon.com', industry: 'ecommerce' },
  { domain: 'ebay.com', industry: 'ecommerce' },
  { domain: 'walmart.com', industry: 'ecommerce' },
  { domain: 'target.com', industry: 'ecommerce' },
  { domain: 'bestbuy.com', industry: 'ecommerce' },
  { domain: 'homedepot.com', industry: 'ecommerce' },
  { domain: 'costco.com', industry: 'ecommerce' },
  { domain: 'ikea.com', industry: 'ecommerce' },
  { domain: 'etsy.com', industry: 'ecommerce' },
  { domain: 'macys.com', industry: 'ecommerce' },
  { domain: 'wayfair.com', industry: 'ecommerce' },
  { domain: 'chewy.com', industry: 'ecommerce' },
  { domain: 'nike.com', industry: 'ecommerce' },
  { domain: 'zappos.com', industry: 'ecommerce' },
  // Finance
  { domain: 'chase.com', industry: 'finance' },
  { domain: 'bankofamerica.com', industry: 'finance' },
  { domain: 'wellsfargo.com', industry: 'finance' },
  { domain: 'citi.com', industry: 'finance' },
  { domain: 'capitalone.com', industry: 'finance' },
  { domain: 'americanexpress.com', industry: 'finance' },
  { domain: 'paypal.com', industry: 'finance' },
  { domain: 'stripe.com', industry: 'finance' },
  { domain: 'squareup.com', industry: 'finance' },
  { domain: 'schwab.com', industry: 'finance' },
  { domain: 'fidelity.com', industry: 'finance' },
  { domain: 'vanguard.com', industry: 'finance' },
  { domain: 'discover.com', industry: 'finance' },
  { domain: 'usbank.com', industry: 'finance' },
  { domain: 'visa.com', industry: 'finance' },
  // Social
  { domain: 'facebook.com', industry: 'social' },
  { domain: 'instagram.com', industry: 'social' },
  { domain: 'twitter.com', industry: 'social' },
  { domain: 'linkedin.com', industry: 'social' },
  { domain: 'tiktok.com', industry: 'social' },
  { domain: 'snapchat.com', industry: 'social' },
  { domain: 'pinterest.com', industry: 'social' },
  { domain: 'reddit.com', industry: 'social' },
  { domain: 'tumblr.com', industry: 'social' },
  { domain: 'quora.com', industry: 'social' },
  { domain: 'discord.com', industry: 'social' },
  { domain: 'whatsapp.com', industry: 'social' },
  { domain: 'messenger.com', industry: 'social' },
  { domain: 'telegram.org', industry: 'social' },
  // Travel
  { domain: 'booking.com', industry: 'travel' },
  { domain: 'expedia.com', industry: 'travel' },
  { domain: 'airbnb.com', industry: 'travel' },
  { domain: 'tripadvisor.com', industry: 'travel' },
  { domain: 'kayak.com', industry: 'travel' },
  { domain: 'skyscanner.net', industry: 'travel' },
  { domain: 'hotels.com', industry: 'travel' },
  { domain: 'priceline.com', industry: 'travel' },
  { domain: 'agoda.com', industry: 'travel' },
  { domain: 'uber.com', industry: 'travel' },
  { domain: 'lyft.com', industry: 'travel' },
  { domain: 'marriott.com', industry: 'travel' },
  { domain: 'hilton.com', industry: 'travel' },
  { domain: 'delta.com', industry: 'travel' },
  // Gaming & Entertainment
  { domain: 'netflix.com', industry: 'gaming/entertainment' },
  { domain: 'youtube.com', industry: 'gaming/entertainment' },
  { domain: 'twitch.tv', industry: 'gaming/entertainment' },
  { domain: 'hulu.com', industry: 'gaming/entertainment' },
  { domain: 'disneyplus.com', industry: 'gaming/entertainment' },
  { domain: 'hbomax.com', industry: 'gaming/entertainment' },
  { domain: 'steampowered.com', industry: 'gaming/entertainment' },
  { domain: 'ign.com', industry: 'gaming/entertainment' },
  { domain: 'epicgames.com', industry: 'gaming/entertainment' },
  { domain: 'roblox.com', industry: 'gaming/entertainment' },
  { domain: 'ea.com', industry: 'gaming/entertainment' },
  { domain: 'nintendo.com', industry: 'gaming/entertainment' },
  { domain: 'playstation.com', industry: 'gaming/entertainment' },
  { domain: 'xbox.com', industry: 'gaming/entertainment' },
  { domain: 'spotify.com', industry: 'gaming/entertainment' }
];

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchHtml(inputUrl) {
  const url = inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`;
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      },
      timeout: 10000
    }, (res) => {
      // Follow redirects up to 3 times
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
           redirectUrl = new URL(redirectUrl, url).href;
        }
        return fetchHtml(redirectUrl).then(resolve).catch(reject);
      }

      let data = Buffer.alloc(0);
      res.on('data', chunk => data = Buffer.concat([data, chunk]));
      res.on('end', () => resolve({
        html: data.toString('utf8'),
        bytes: data.length,
        url: url,
        server: res.headers['server'] || 'Unknown'
      }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function resolveUrl(baseUrl, resourceUrl) {
  try {
    return new URL(resourceUrl, baseUrl).href;
  } catch (e) {
    return null;
  }
}

async function fetchSize(url, depth = 0) {
  if (!url || !url.startsWith('http')) return 0;
  if (depth > 3) return 0; // Prevent infinite redirect loops

  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, {
      method: 'HEAD',
      headers: { 'User-Agent': USER_AGENT },
      timeout: 5000
    }, (res) => {
      // Clean up response if it has a body
      res.resume();

      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
           redirectUrl = new URL(redirectUrl, url).href;
        }
        return fetchSize(redirectUrl, depth + 1).then(resolve);
      }

      const len = parseInt(res.headers['content-length'] || 0, 10);
      resolve(len);
    });

    req.on('error', () => resolve(0));
    req.on('timeout', () => { req.destroy(); resolve(0); });
    req.end();
  });
}

async function processSite(site) {
  console.log(`Crawling ${site.domain}...`);
  try {
    const { html, bytes: htmlBytes, url: finalUrl, server } = await fetchHtml(site.domain);
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(el => el.href);
    const jsScripts = Array.from(document.querySelectorAll('script[src]')).map(el => el.src);
    const images = Array.from(document.querySelectorAll('img[src]')).map(el => el.src);
    const preloads = Array.from(document.querySelectorAll('link[rel="preload"]')).map(el => el.href);

    // Filter and resolve unique URLs
    const uniqueCss = [...new Set(cssLinks.map(url => resolveUrl(finalUrl, url)).filter(Boolean))];
    const uniqueJs = [...new Set(jsScripts.map(url => resolveUrl(finalUrl, url)).filter(Boolean))];
    const uniqueImages = [...new Set(images.map(url => resolveUrl(finalUrl, url)).filter(Boolean))];
    const uniquePreloads = [...new Set(preloads.map(url => resolveUrl(finalUrl, url)).filter(Boolean))];

    // Distribute preloads
    const allPreloads = uniquePreloads;
    const cssToFetch = [...new Set([...uniqueCss, ...allPreloads.filter(u => u.endsWith('.css'))])];
    const jsToFetch = [...new Set([...uniqueJs, ...allPreloads.filter(u => u.endsWith('.js'))])];
    const imgToFetch = [...new Set([...uniqueImages, ...allPreloads.filter(u => u.match(/\.(png|jpe?g|gif|webp|svg|avif)$/i))])];

    const fetchAll = async (urls) => {
      const sizes = await Promise.all(urls.map(url => fetchSize(url)));
      return sizes.reduce((sum, size) => sum + size, 0);
    };

    const cssBytes = await fetchAll(cssToFetch);
    const jsBytes = await fetchAll(jsToFetch);
    const imageEstimateBytes = await fetchAll(imgToFetch);

    const totalBytes = htmlBytes + cssBytes + jsBytes + imageEstimateBytes;

    return {
      domain: site.domain,
      industry: site.industry,
      htmlBytes,
      cssBytes,
      jsBytes,
      imageEstimateBytes,
      totalBytes,
      resourceCount: cssToFetch.length + jsToFetch.length + imgToFetch.length + 1, // +1 for HTML
      server,
      error: null
    };
  } catch (err) {
    console.error(`Failed ${site.domain}: ${err.message}`);
    return {
      domain: site.domain,
      industry: site.industry,
      htmlBytes: 0,
      cssBytes: 0,
      jsBytes: 0,
      imageEstimateBytes: 0,
      totalBytes: 0,
      resourceCount: 0,
      server: 'Unknown',
      error: err.message
    };
  }
}

async function main() {
  const results = [];
  const batchSize = 10;

  for (let i = 0; i < SITES.length; i += batchSize) {
    const batch = SITES.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processSite));
    results.push(...batchResults);
  }

  const validResults = results.filter(r => r.totalBytes > 0);

  const studyData = {
    crawlDate: new Date().toISOString().split('T')[0],
    methodology: "Full page weight calculation. Includes initial HTML response size, plus the combined sizes of all linked CSS stylesheets, JavaScript files, images, and preloaded resources as determined by Content-Length headers from HEAD requests.",
    totalSites: validResults.length,
    results: validResults
  };

  const dir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const outPath = path.join(dir, 'page-weight-study.json');
  fs.writeFileSync(outPath, JSON.stringify(studyData, null, 2));
  console.log(`Saved results to ${outPath}`);

  // Inject into public HTML page
  const htmlPath = path.join(__dirname, '..', 'public', 'page-weight-study.html');
  if (fs.existsSync(htmlPath)) {
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    // We expect the script tag to have: const DATA = { ... };
    // We'll replace it with the new stringified object.
    const re = /(const DATA = )(\{[\s\S]*?\});/;
    if (re.test(htmlContent)) {
      htmlContent = htmlContent.replace(re, `$1${JSON.stringify(studyData)};`);
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`Injected data into ${htmlPath}`);
    } else {
      console.warn('Could not find const DATA = {...} in HTML file.');
    }
  }
}

main();
