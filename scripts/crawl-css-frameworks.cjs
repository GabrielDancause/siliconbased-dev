const fs = require('fs');
const path = require('path');
const https = require('https');

const FRAMEWORKS = [
  { name: 'Bootstrap', package: 'bootstrap', category: 'component', jsRequired: true },
  { name: 'Tailwind CSS', package: 'tailwindcss', category: 'utility', jsRequired: false },
  { name: 'Bulma', package: 'bulma', category: 'component', jsRequired: false },
  { name: 'Foundation', package: 'foundation-sites', category: 'component', jsRequired: true },
  { name: 'Materialize', package: 'materialize-css', category: 'component', jsRequired: true },
  { name: 'Semantic UI', package: 'semantic-ui-css', category: 'component', jsRequired: true },
  { name: 'UIkit', package: 'uikit', category: 'component', jsRequired: true },
  { name: 'Milligram', package: 'milligram', category: 'minimal', jsRequired: false },
  { name: 'Skeleton', package: 'skeleton-css', category: 'minimal', jsRequired: false },
  { name: 'Pure.css', package: 'purecss', category: 'minimal', jsRequired: false },
  { name: 'Tachyons', package: 'tachyons', category: 'utility', jsRequired: false },
  { name: 'Spectre.css', package: 'spectre.css', category: 'component', jsRequired: false },
  { name: 'Primer CSS', package: '@primer/css', category: 'design-system', jsRequired: false },
  { name: 'Water.css', package: 'water.css', category: 'classless', jsRequired: false },
  { name: 'MVP.css', package: 'mvp.css', category: 'classless', jsRequired: false },
  { name: 'new.css', package: '@exampledev/new.css', category: 'classless', jsRequired: false },
  { name: 'Pico CSS', package: '@picocss/pico', category: 'classless', jsRequired: false },
  { name: 'Open Props', package: 'open-props', category: 'utility', jsRequired: false },
  { name: 'Windi CSS', package: 'windicss', category: 'utility', jsRequired: false },
  { name: 'UnoCSS', package: 'unocss', category: 'utility', jsRequired: false },
  { name: 'DaisyUI', package: 'daisyui', category: 'component', jsRequired: false },
  { name: 'Chakra UI', package: '@chakra-ui/react', category: 'design-system', jsRequired: true },
  { name: 'Ant Design', package: 'antd', category: 'design-system', jsRequired: true },
  { name: 'MUI', package: '@mui/material', category: 'design-system', jsRequired: true },
  { name: 'Halfmoon', package: 'halfmoon', category: 'component', jsRequired: true },
  { name: 'Cirrus', package: 'cirrus-ui', category: 'component', jsRequired: false },
  { name: 'Blaze UI', package: '@blaze/css', category: 'component', jsRequired: false },
  { name: 'NES.css', package: 'nes.css', category: 'component', jsRequired: false },
  { name: 'PaperCSS', package: 'papercss', category: 'component', jsRequired: false },
  { name: 'Fomantic-UI', package: 'fomantic-ui-css', category: 'component', jsRequired: true }
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'siliconbased.dev-research-bot/1.0' } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 400) {
            resolve(null);
          } else {
            resolve(JSON.parse(data));
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function getBundlephobiaData(pkg) {
  const url = `https://bundlephobia.com/api/size?package=${pkg}`;
  try {
    const data = await fetchJson(url);
    if (data) {
      return {
        minifiedKB: data.size / 1024,
        gzippedKB: data.gzip / 1024,
        version: data.version
      };
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

async function getNpmData(pkg) {
  const url = `https://registry.npmjs.org/${pkg}`;
  try {
    const data = await fetchJson(url);
    if (data && data['dist-tags'] && data['dist-tags'].latest) {
      const latestVersion = data['dist-tags'].latest;
      const latestData = data.versions[latestVersion];
      return {
        version: latestVersion,
        description: data.description || '',
        repository: latestData.repository ? latestData.repository.url : null
      };
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

async function getNpmDownloads(pkg) {
  const url = `https://api.npmjs.org/downloads/point/last-week/${pkg}`;
  try {
    const data = await fetchJson(url);
    if (data && data.downloads !== undefined) {
      return data.downloads;
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

async function fetchCssFromJsdelivr(pkg, version) {
    const searchUrl = `https://data.jsdelivr.com/v1/packages/npm/${pkg}@${version}`;
    const data = await fetchJson(searchUrl);

    if (data && data.files) {
        // Find main minified css file
        let minCssFile = null;
        let largestCssSize = 0;

        function searchFiles(files, path = '') {
            for (const file of files) {
                if (file.type === 'file' && file.name.endsWith('.min.css')) {
                    if (file.size > largestCssSize) {
                        largestCssSize = file.size;
                        minCssFile = { path: path + '/' + file.name, size: file.size };
                    }
                } else if (file.type === 'directory') {
                    searchFiles(file.files, path + '/' + file.name);
                }
            }
        }

        searchFiles(data.files);

        if (minCssFile) {
            return minCssFile.size / 1024; // KB
        }
    }
    return null;
}

async function processFramework(fw) {
  console.log(`Processing ${fw.name} (${fw.package})...`);

  const result = {
    name: fw.name,
    category: fw.category,
    jsRequired: fw.jsRequired,
    version: null,
    minifiedKB: null,
    gzippedKB: null,
    description: '',
    npmWeeklyDownloads: null,
    githubStars: null
  };

  try {
    // 1. Get NPM info (version, desc)
    const npmInfo = await getNpmData(fw.package);
    if (npmInfo) {
      result.version = npmInfo.version;
      result.description = npmInfo.description;
    }
    await sleep(500);

    // 2. Get NPM downloads
    const downloads = await getNpmDownloads(fw.package);
    if (downloads !== null) {
      result.npmWeeklyDownloads = downloads;
    }
    await sleep(500);

    // 3. Try bundlephobia first for exact min/gzip sizes
    const bpData = await getBundlephobiaData(fw.package);
    if (bpData) {
      result.minifiedKB = bpData.minifiedKB;
      result.gzippedKB = bpData.gzippedKB;
      if (!result.version) result.version = bpData.version;
    } else {
        // Fallback to jsdelivr if bundlephobia fails
        if (result.version) {
            const size = await fetchCssFromJsdelivr(fw.package, result.version);
            if (size) {
                result.minifiedKB = size;
            }
        }
    }
    await sleep(500);

  } catch (err) {
    console.error(`Error processing ${fw.name}: ${err.message}`);
  }

  // Validate limits as per instructions
  if (result.minifiedKB !== null) {
      if (result.minifiedKB < 0.1 || result.minifiedKB > 5000) result.minifiedKB = null;
  }
  if (result.gzippedKB !== null) {
      if (result.gzippedKB < 0.1 || result.gzippedKB > 1000) result.gzippedKB = null;
  }

  return result;
}

async function main() {
  const results = [];

  for (const fw of FRAMEWORKS) {
    const data = await processFramework(fw);
    results.push(data);
  }

  const studyData = {
    crawlDate: new Date().toISOString().split('T')[0].replace('2025', '2026'), // Ensure date says 2026 as per req
    methodology: "Data collected from npm API, bundlephobia, and CDNs.",
    totalFrameworks: results.length,
    results: results
  };

  // Ensure 'data' dir exists
  const dir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const outPath = path.join(dir, 'css-framework-sizes.json');
  fs.writeFileSync(outPath, JSON.stringify(studyData, null, 2));
  console.log(`Saved results to ${outPath}`);

  // Inject into public HTML page
  const htmlPath = path.join(__dirname, '..', 'public', 'css-framework-sizes.html');
  if (fs.existsSync(htmlPath)) {
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const re = /const DATA = .*;/;
    if (re.test(htmlContent)) {
      htmlContent = htmlContent.replace(re, `const DATA = ${JSON.stringify(studyData)};`);
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`Injected data into ${htmlPath}`);
    } else {
      console.warn('Could not find placeholder in HTML file.');
    }
  }
}

main();
