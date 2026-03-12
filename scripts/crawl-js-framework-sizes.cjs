const https = require('https');
const fs = require('fs');
const path = require('path');

const frameworks = [
  { name: 'React', npm: 'react', github: 'facebook/react' },
  { name: 'Vue', npm: 'vue', github: 'vuejs/core' },
  { name: 'Svelte', npm: 'svelte', github: 'sveltejs/svelte' },
  { name: 'Solid', npm: 'solid-js', github: 'solidjs/solid' },
  { name: 'Preact', npm: 'preact', github: 'preactjs/preact' },
  { name: 'Alpine.js', npm: 'alpinejs', github: 'alpinejs/alpine' },
  { name: 'Lit', npm: 'lit', github: 'lit/lit' },
  { name: 'Angular', npm: '@angular/core', github: 'angular/angular' }
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const fetchJson = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'User-Agent': 'JS-Framework-Crawler/1.0 (Contact: data@siliconbased.dev)',
      'Accept': 'application/json'
    };
    https.get(url, { headers: { ...defaultHeaders, ...options.headers } }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const urlObj = new URL(url);
          redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
        }
        return fetchJson(redirectUrl, options).then(resolve).catch(reject);
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          console.warn(`Warning: ${url} returned ${res.statusCode}`);
          resolve(null);
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          console.warn(`Failed to parse JSON from ${url}`);
          resolve(null);
        }
      });
    }).on('error', reject);
  });
};

async function crawl() {
  const results = [];

  for (const fw of frameworks) {
    console.log(`Crawling ${fw.name}...`);
    let sizeData = null, npmData = null, githubData = null;

    // Bundlephobia
    try {
      sizeData = await fetchJson(`https://bundlephobia.com/api/size?package=${encodeURIComponent(fw.npm)}`);
      await sleep(2000);
    } catch (e) {
      console.warn(`Error fetching bundlephobia for ${fw.npm}:`, e);
    }

    // npm
    try {
      npmData = await fetchJson(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(fw.npm)}`);
      await sleep(2000);
    } catch (e) {
      console.warn(`Error fetching npm for ${fw.npm}:`, e);
    }

    // GitHub
    try {
      githubData = await fetchJson(`https://api.github.com/repos/${fw.github}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
      await sleep(2000);
    } catch (e) {
      console.warn(`Error fetching github for ${fw.github}:`, e);
    }

    const version = sizeData?.version || null;
    const minifiedKB = sizeData?.size !== undefined ? Number((sizeData.size / 1024).toFixed(2)) : null;
    const gzippedKB = sizeData?.gzip !== undefined ? Number((sizeData.gzip / 1024).toFixed(2)) : null;
    const npmWeeklyDownloads = npmData?.downloads !== undefined ? npmData.downloads : null;
    const githubStars = githubData?.stargazers_count !== undefined ? githubData.stargazers_count : null;

    results.push({
      framework: fw.name,
      version: version || 'unknown',
      minifiedKB,
      gzippedKB,
      npmWeeklyDownloads,
      githubStars,
      license: githubData?.license?.spdx_id || 'Unknown',
      language: githubData?.language || 'Unknown'
    });
  }

  const outDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'js-framework-sizes.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Saved ${results.length} frameworks to ${outPath}`);
}

crawl().catch(console.error);
