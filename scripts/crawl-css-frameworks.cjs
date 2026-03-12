const https = require('https');
const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const frameworks = [
  { name: 'Bootstrap', package: 'bootstrap', category: 'component', jsRequired: true, description: 'The most popular HTML, CSS, and JS library in the world.' },
  { name: 'Tailwind CSS', package: 'tailwindcss', category: 'utility', jsRequired: false, description: 'A utility-first CSS framework for rapid UI development.' },
  { name: 'Bulma', package: 'bulma', category: 'component', jsRequired: false, description: 'Free, open source, and modern CSS framework based on Flexbox.' },
  { name: 'Foundation', package: 'foundation-sites', category: 'component', jsRequired: true, description: 'The most advanced responsive front-end framework in the world.' },
  { name: 'Materialize', package: 'materialize-css', category: 'component', jsRequired: true, description: 'A modern responsive front-end framework based on Material Design.' },
  { name: 'Semantic UI', package: 'semantic-ui', category: 'component', jsRequired: true, description: 'A UI component framework based around useful principles from natural language.' },
  { name: 'UIkit', package: 'uikit', category: 'component', jsRequired: true, description: 'A lightweight and modular front-end framework.' },
  { name: 'Milligram', package: 'milligram', category: 'minimal', jsRequired: false, description: 'A minimalist CSS framework.' },
  { name: 'Skeleton', package: 'skeleton-css', category: 'minimal', jsRequired: false, description: 'A dead simple, responsive boilerplate.' },
  { name: 'Pure.css', package: 'purecss', category: 'minimal', jsRequired: false, description: 'A set of small, responsive CSS modules that you can use in every web project.' },
  { name: 'Tachyons', package: 'tachyons', category: 'utility', jsRequired: false, description: 'Functional css for humans.' },
  { name: 'Spectre.css', package: 'spectre.css', category: 'minimal', jsRequired: false, description: 'A lightweight, responsive and modern CSS framework.' },
  { name: 'Primer CSS', package: '@primer/css', category: 'design-system', jsRequired: false, description: 'The CSS framework that powers GitHub.' },
  { name: 'Water.css', package: 'water.css', category: 'classless', jsRequired: false, description: 'A drop-in collection of CSS styles to make simple websites like this just a little bit nicer.' },
  { name: 'MVP.css', package: 'mvp.css', category: 'classless', jsRequired: false, description: 'A minimalist stylesheet for HTML elements.' },
  { name: 'new.css', package: '@exampledev/new.css', category: 'classless', jsRequired: false, description: 'A classless CSS framework to write modern websites using only HTML.' },
  { name: 'Pico CSS', package: '@picocss/pico', category: 'classless', jsRequired: false, description: 'Minimal UI component framework.' },
  { name: 'Open Props', package: 'open-props', category: 'utility', jsRequired: false, description: 'Supercharged CSS variables.' },
  { name: 'Vanilla Extract', package: '@vanilla-extract/css', category: 'utility', jsRequired: false, description: 'Zero-runtime Stylesheets-in-TypeScript.' },
  { name: 'Stitches', package: '@stitches/react', category: 'utility', jsRequired: true, description: 'CSS-in-JS with near-zero runtime.' },
  { name: 'Windi CSS', package: 'windicss', category: 'utility', jsRequired: false, description: 'Next generation utility-first CSS framework.' },
  { name: 'UnoCSS', package: 'unocss', category: 'utility', jsRequired: false, description: 'The instant on-demand atomic CSS engine.' },
  { name: 'DaisyUI', package: 'daisyui', category: 'component', jsRequired: false, description: 'The most popular component library for Tailwind CSS.' },
  { name: 'Chakra UI', package: '@chakra-ui/react', category: 'component', jsRequired: true, description: 'A simple, modular and accessible component library that gives you the building blocks you need to build your React applications.' },
  { name: 'Ant Design', package: 'antd', category: 'component', jsRequired: true, description: 'An enterprise-class UI design language and React UI library.' },
  { name: 'MUI', package: '@mui/material', category: 'component', jsRequired: true, description: 'The React UI library you always wanted.' },
  { name: 'Blaze UI', package: '@blaze/css', category: 'component', jsRequired: false, description: 'Open source modular component framework.' },
  { name: 'Cirrus', package: 'cirrus-ui', category: 'component', jsRequired: false, description: 'A component and utility centric SCSS framework designed for rapid prototyping.' },
  { name: 'Fomantic-UI', package: 'fomantic-ui', category: 'component', jsRequired: true, description: 'A community fork of Semantic-UI.' },
  { name: 'Halfmoon', package: 'halfmoon', category: 'component', jsRequired: true, description: 'Front-end framework with a built-in dark mode and full customizability using CSS variables.' },
  { name: 'NES.css', package: 'nes.css', category: 'minimal', jsRequired: false, description: 'NES-style CSS Framework.' }
];

const fetchJson = (url) => new Promise((resolve, reject) => {
  https.get(url, { headers: { 'User-Agent': 'NodeJS/CssCrawl' } }, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch (e) { resolve(null); }
    });
  }).on('error', reject);
});

const getMinifiedSize = (pkg, version, pathsToTry) => new Promise((resolve) => {
  if (pathsToTry.length === 0) return resolve(null);
  const p = pathsToTry[0];
  const url = `https://unpkg.com/${pkg}@${version}${p}`;
  const req = https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'NodeJS/CssCrawl' } }, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const newUrl = res.headers.location.startsWith('http') ? res.headers.location : `https://unpkg.com${res.headers.location}`;
        const redirReq = https.request(newUrl, { method: 'HEAD', headers: { 'User-Agent': 'NodeJS/CssCrawl' } }, (redirRes) => {
            if (redirRes.statusCode === 200 && redirRes.headers['content-length']) {
                resolve(parseInt(redirRes.headers['content-length'], 10));
            } else {
                resolve(getMinifiedSize(pkg, version, pathsToTry.slice(1)));
            }
        });
        redirReq.on('error', () => resolve(getMinifiedSize(pkg, version, pathsToTry.slice(1))));
        redirReq.end();
    } else if (res.statusCode === 200 && res.headers['content-length']) {
      resolve(parseInt(res.headers['content-length'], 10));
    } else {
      resolve(getMinifiedSize(pkg, version, pathsToTry.slice(1)));
    }
  });
  req.on('error', () => resolve(getMinifiedSize(pkg, version, pathsToTry.slice(1))));
  req.end();
});

async function main() {
  console.log('Starting crawl of CSS framework sizes...');
  const results = [];

  for (const fw of frameworks) {
    console.log(`Processing ${fw.name}...`);

    // 1. Get latest version from npm
    const npmData = await fetchJson(`https://registry.npmjs.org/${fw.package}/latest`);
    const version = npmData ? npmData.version : null;
    if (!version) {
        console.log(`  Failed to get version for ${fw.package}`);
        continue;
    }

    // 2. Get Bundlephobia stats
    const bpData = await fetchJson(`https://bundlephobia.com/api/size?package=${fw.package}`);
    let gzippedKB = null;
    let minifiedKBBp = null;
    if (bpData && bpData.gzip) gzippedKB = bpData.gzip / 1024;
    if (bpData && bpData.size) minifiedKBBp = bpData.size / 1024;

    // 3. Try to get exact CSS minified size from unpkg if it's primarily a CSS framework
    let minifiedKB = minifiedKBBp;

    const paths = [
        `/dist/${fw.package.split('/').pop()}.min.css`,
        `/dist/css/${fw.package.split('/').pop()}.min.css`,
        `/css/${fw.package.split('/').pop()}.min.css`,
        `/dist/style.min.css`,
        `/css/style.min.css`,
        `/dist/index.min.css`,
        `/index.min.css`,
        `/dist/tailwind.min.css`,
        `/dist/foundation.min.css`,
        `/dist/materialize.min.css`,
        `/dist/semantic.min.css`,
        `/dist/css/uikit.min.css`,
        `/dist/milligram.min.css`,
        `/css/skeleton.css`,
        `/build/pure-min.css`,
        `/css/tachyons.min.css`,
        `/dist/spectre.min.css`,
        `/dist/primer.css`,
        `/out/water.min.css`,
        `/mvp.css`,
        `/new.min.css`,
        `/css/pico.min.css`,
        `/dist/daisyui.css`,
        `/dist/blaze.min.css`,
        `/dist/cirrus.min.css`,
        `/dist/semantic.min.css`,
        `/css/halfmoon.min.css`,
        `/css/nes.min.css`
    ];

    const unpkgSize = await getMinifiedSize(fw.package, version, paths);
    if (unpkgSize && unpkgSize > 100) { // filter out tiny files which might be stubs
        minifiedKB = unpkgSize / 1024;
    }

    // Validation
    let finalMinifiedKB = minifiedKB ? Number(minifiedKB.toFixed(2)) : null;
    let finalGzippedKB = gzippedKB ? Number(gzippedKB.toFixed(2)) : null;

    if (finalMinifiedKB !== null && (finalMinifiedKB < 0.1 || finalMinifiedKB > 5000)) {
        finalMinifiedKB = null;
    }
    if (finalGzippedKB !== null && (finalGzippedKB < 0.1 || finalGzippedKB > 1000)) {
        finalGzippedKB = null;
    }

    results.push({
      name: fw.name,
      version: version,
      minifiedKB: finalMinifiedKB,
      gzippedKB: finalGzippedKB,
      category: fw.category,
      githubStars: null, // Scraped via Github API ideally, hard to do unauth
      npmWeeklyDownloads: null, // Hard to do without another API call per fw
      jsRequired: fw.jsRequired,
      description: fw.description
    });

    await delay(500); // polite delay
  }

  // Try to get npm downloads from bulk api point
  const bulkNpmUrl = `https://api.npmjs.org/downloads/point/last-week/${frameworks.map(f => f.package).join(',')}`;
  const bulkNpmData = await fetchJson(bulkNpmUrl);
  if (bulkNpmData) {
      for (const res of results) {
          const pkg = frameworks.find(f => f.name === res.name).package;
          if (bulkNpmData[pkg] && bulkNpmData[pkg].downloads) {
              res.npmWeeklyDownloads = bulkNpmData[pkg].downloads;
          }
      }
  }

  const finalData = {
    crawlDate: "2026-03-09T00:00:00.000Z", // As requested, dates say 2026
    methodology: "Data sourced directly from npm registry, Unpkg, and Bundlephobia APIs in real-time. Sizes reflect the primary CSS file minified size where applicable, or overall package bundle size.",
    totalFrameworks: results.length,
    results: results.sort((a, b) => (b.minifiedKB || 0) - (a.minifiedKB || 0))
  };

  const dir = path.join(__dirname, '../data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'css-framework-sizes.json'), JSON.stringify(finalData, null, 2));
  console.log(`Saved data for ${results.length} frameworks to data/css-framework-sizes.json`);
}

main().catch(console.error);
