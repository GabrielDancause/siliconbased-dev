const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

const DELAY_MS = 500;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === retries - 1) {
        console.error(`Failed to fetch ${url}: ${e.message}`);
        return null;
      }
      await delay(DELAY_MS * (i + 1));
    }
  }
}

// Map from country string to continent
function getContinent(c) {
  const eur = ['georgia','croatia','czechia','estonia','iceland','germany','norway','portugal','spain','malta','greece','romania','hungary','cyprus','latvia','albania','andorra','montenegro','italy','turkey','france','netherlands'];
  const car = ['antigua','barbados','bermuda','cayman','anguilla','montserrat','dominica','bahamas','curaçao','lucia','grenada'];
  const ams = ['costa rica','mexico','panama','brazil','colombia','ecuador','argentina','uruguay','el salvador','belize','canada'];
  const afr = ['mauritius','cape verde','seychelles','namibia','south africa','kenya'];
  const asi = ['dubai','uae','sri lanka','taiwan','malaysia','indonesia','bali','thailand','south korea','japan','philippines'];

  const ln = c.toLowerCase();
  if (eur.some(x => ln.includes(x))) return 'Europe';
  if (car.some(x => ln.includes(x))) return 'Caribbean';
  if (ams.some(x => ln.includes(x))) return 'Americas';
  if (afr.some(x => ln.includes(x))) return 'Africa';
  if (asi.some(x => ln.includes(x))) return 'Asia';
  return 'Europe'; // Fallback
}

function parseNomadGirlData(c) {
  let income = null;
  let cost = null;
  let duration = null;

  // Income
  const incomeM = c.text.match(/Income\s*to\s*Prove[\s:]*\$?([\d,]+)/i) ||
                  c.text.match(/Income[\s:]*\$?([\d,]+)/i) ||
                  c.text.match(/(?:€|\$|£)([\d,]+)\s*per\s*month/i);
  if (incomeM) income = parseInt(incomeM[1].replace(/,/g, ''));

  // Cost
  const costM = c.text.match(/Cost\s*of\s*the\s*Visa[\s:]*\$?([\d,]+)/i) ||
                c.text.match(/Cost[\s:]*\$?([\d,]+)/i) ||
                c.text.match(/(?:fee|cost)\s*is\s*(?:€|\$|£)([\d,]+)/i);
  if (costM) cost = parseInt(costM[1].replace(/,/g, ''));

  // Duration
  const lengthM = c.text.match(/Length\s*of\s*the\s*Visa[\s:]*(\d+)\s*Months?/i) ||
                  c.text.match(/Length[\s:]*(\d+)\s*Months?/i) ||
                  c.text.match(/(\d+)\s*years?/i);
  if (lengthM) {
    if (lengthM[0].toLowerCase().includes('year')) {
      duration = parseInt(lengthM[1]) * 12;
    } else {
      duration = parseInt(lengthM[1]);
    }
  }

  // Set nulls
  if (income > 10000 || income < 0) income = null;
  if (cost > 5000 || cost < 0) cost = null;
  if (duration > 36 || duration < 1) duration = null;

  let taxStatus = 'unknown';
  const txtL = c.text.toLowerCase();
  if (txtL.includes('tax-free') || txtL.includes('0% tax') || txtL.includes('no tax')) taxStatus = 'tax-free';
  else if (txtL.includes('taxed') || txtL.includes('pay tax')) taxStatus = 'taxed';

  let requirements = "Must prove sufficient remote income.";

  // Fix naming
  let name = c.name.replace(/\s*\(.*?\)\s*/g, '').trim();

  return {
    country: name,
    visaName: "Digital Nomad Visa",
    continent: getContinent(name),
    costUSD: cost,
    durationMonths: duration,
    renewableMonths: null,
    minIncomeUSD: income,
    taxStatus: taxStatus,
    processingDays: null,
    yearLaunched: null,
    internetSpeedMbps: null,
    costOfLivingIndex: null,
    requirements: requirements,
    officialUrl: null
  };
}

async function scrapeNomadGirl() {
  const url = 'https://nomadgirl.co/countries-with-digital-nomad-visas/';
  console.log(`Scraping ${url}...`);
  const html = await fetchWithRetry(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  let countries = [];
  $('h3').each((i, el) => {
    const text = $(el).text();
    const match = text.match(/^\d+\.\s+(.+)/);
    if (match) {
      let cName = match[1].trim();
      let node = $(el).next();
      let txt = '';
      while (node.length && !node[0].name.match(/^h[23]$/)) {
        txt += node.text() + '\n';
        node = node.next();
      }
      countries.push({ name: cName, text: txt });
    }
  });

  return countries.map(parseNomadGirlData).filter(c => c.country.length > 0);
}

async function scrapeVisaGuide() {
  const url = 'https://visaguide.world/digital-nomad-visa/';
  console.log(`Scraping ${url}...`);
  const html = await fetchWithRetry(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  let links = [];
  $('ul li a').each((i, a) => {
    let href = $(a).attr('href');
    if (href && href.includes('/digital-nomad-visa/') && href.length > '/digital-nomad-visa/'.length) {
      links.push({ name: $(a).text().trim(), url: href });
    }
  });

  // Deduplicate
  let unique = [];
  let seen = new Set();
  for (let l of links) {
    if (!seen.has(l.url)) {
      seen.add(l.url);
      unique.push(l);
    }
  }

  let results = [];
  for (let c of unique) {
    await delay(DELAY_MS);
    console.log(`Scraping VisaGuide: ${c.name}...`);
    const chtml = await fetchWithRetry(c.url);
    if (!chtml) continue;

    const c$ = cheerio.load(chtml);
    let txt = c$('body').text();

    let income = null;
    let cost = null;

    const incomeMatch = txt.match(/income of .*?([€$£]\d+(?:,\d+)*)/i);
    const feeMatch = txt.match(/fee of .*?([€$£]\d+(?:,\d+)*)/i);

    if (incomeMatch) income = parseInt(incomeMatch[1].replace(/[^0-9]/g, ''));
    if (feeMatch) cost = parseInt(feeMatch[1].replace(/[^0-9]/g, ''));

    if (income > 10000 || income < 0) income = null;
    if (cost > 5000 || cost < 0) cost = null;

    results.push({
      country: c.name,
      minIncomeUSD: income,
      costUSD: cost
    });
  }
  return results;
}

async function run() {
  let baseData = await scrapeNomadGirl();
  console.log(`Got ${baseData.length} from NomadGirl`);

  let vgData = await scrapeVisaGuide();
  console.log(`Got ${vgData.length} from VisaGuide`);

  // Merge
  for (let vg of vgData) {
    let existing = baseData.find(b => b.country.toLowerCase() === vg.country.toLowerCase());
    if (existing) {
      if (existing.minIncomeUSD === null && vg.minIncomeUSD !== null) existing.minIncomeUSD = vg.minIncomeUSD;
      if (existing.costUSD === null && vg.costUSD !== null) existing.costUSD = vg.costUSD;
    } else {
      // Add new
      baseData.push({
        country: vg.country,
        visaName: "Digital Nomad Visa",
        continent: getContinent(vg.country),
        costUSD: vg.costUSD,
        durationMonths: null,
        renewableMonths: null,
        minIncomeUSD: vg.minIncomeUSD,
        taxStatus: "unknown",
        processingDays: null,
        yearLaunched: null,
        internetSpeedMbps: null,
        costOfLivingIndex: null,
        requirements: "Remote worker with sufficient income.",
        officialUrl: null
      });
    }
  }

  // Sort alphabetically
  baseData.sort((a, b) => a.country.localeCompare(b.country));

  const indexData = {
    crawlDate: new Date().toISOString(),
    methodology: `Scraped 2 source pages, cross-referenced data for ${baseData.length} countries`,
    totalCountries: baseData.length,
    sources: ["nomadgirl.co", "visaguide.world"],
    countries: baseData
  };

  const outputPath = path.join(__dirname, '..', 'data', 'nomad-visa-index.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(indexData, null, 2));
  console.log(`Saved output to ${outputPath}`);

  // Inject into HTML
  const htmlPath = path.join(__dirname, '..', 'public', 'nomad-visa-index.html');
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf-8');
    html = html.replace(/const INDEX_DATA = [\s\S]*?;/, `const INDEX_DATA = ${JSON.stringify(indexData)};`);
    fs.writeFileSync(htmlPath, html);
    console.log(`Injected data into ${htmlPath}`);
  }
}

run();
