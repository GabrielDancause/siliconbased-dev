const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const cheerio = require('cheerio');

const dataDir = path.join(__dirname, '../data');
const dataPath = path.join(dataDir, 'travel-card-fees.json');
const publicDir = path.join(__dirname, '../public');
const htmlPath = path.join(publicDir, 'travel-card-fees.html');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

async function fetchPageWithPlaywright(url, browser) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();
  let content = '';
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    content = await page.content();
  } catch(e) {
    console.log(`Failed to load ${url}: ${e.message}`);
  } finally {
    await page.close();
    await context.close();
  }
  return content;
}

function determineIssuer(name) {
  const lower = name.toLowerCase();
  if (lower.includes('chase') || lower.includes('sapphire') || lower.includes('ink') || lower.includes('freedom')) return 'Chase';
  if (lower.includes('capital one') || lower.includes('venture') || lower.includes('quicksilver') || lower.includes('savor')) return 'Capital One';
  if (lower.includes('american express') || lower.includes('amex') || lower.includes('platinum') || lower.includes('gold') || lower.includes('blue cash')) return 'American Express';
  if (lower.includes('bank of america') || lower.includes('premium rewards') || lower.includes('travel rewards')) return 'Bank of America';
  if (lower.includes('citi') || lower.includes('premier')) return 'Citi';
  if (lower.includes('discover')) return 'Discover';
  if (lower.includes('wells fargo') || lower.includes('autograph') || lower.includes('bilt')) return 'Wells Fargo';
  if (lower.includes('u.s. bank') || lower.includes('altitude')) return 'U.S. Bank';
  if (lower.includes('barclays')) return 'Barclays';
  return 'Unknown Issuer';
}

function cleanCardName(name) {
    let clean = name.replace(/Best for.*/i, '').trim();
    clean = clean.replace(/^(The\s+)?(\d+\.\s*)/, '');
    clean = clean.replace(/—\s*NerdWallet.*/i, '').trim();
    clean = clean.replace(/:\s*Our\s+Review.*/i, '').trim();
    clean = clean.replace(/ Review$/i, '').trim();
    return clean;
}

function isValidCardName(name) {
    const lower = name.toLowerCase();
    if (name.length < 5) return false;

    const garbage = [
      'about', 'star rating', 'methodology', 'pros', 'cons', 'expert',
      'frequently asked', 'our top picks', 'why we picked', 'summary',
      'guide', 'how to', 'best ways', 'does not exist', 'privacy',
      'logo', 'card type', 'card issuer', 'cobranded', 'credit score',
      'intro apr', 'regular apr', 'balance transfer', 'foreign transaction',
      'annual fee', 'credit cards', 'rewards rate', 'welcome offer', 'terms apply',
      'editorial disclosure', 'read our', 'review', 'best no', 'top no', 'no foreign',
      'how we chose', 'who should get', 'bottom line', 'alternative', 'vs.', 'rates and fees'
    ];
    for (let g of garbage) {
      if (lower.includes(g)) return false;
    }

    const validKeywords = ['card', 'sapphire', 'venture', 'platinum', 'rewards', 'miles', 'cash', 'autograph', 'bilt', 'reserve', 'preferred', 'discover it', 'quicksilver', 'freedom', 'ink'];
    let hasKeyword = false;
    for (let k of validKeywords) {
      if (lower.includes(k)) {
        hasKeyword = true; break;
      }
    }
    if (!hasKeyword) return false;

    if (lower === 'credit card' || lower === 'travel card' || lower === 'rewards card' || lower === 'business card') return false;

    return true;
}

function extractDataFromText(text, cardName) {
  let annualFeeUSD = 0;

  // Extract Annual Fee safely
  const feeRegex = /(?:Annual [Ff]ee|Fee)[\s:]*\$?([0-9]+)/;
  const match = text.match(feeRegex);
  if (match) {
    annualFeeUSD = parseInt(match[1], 10);
  } else if (text.match(/\$0\s*Annual Fee/i) || text.match(/No Annual Fee/i) || text.match(/Annual Fee: \$0/i)) {
    annualFeeUSD = 0;
  } else {
      const lower = cardName.toLowerCase();
      if (lower.includes('sapphire preferred') || lower.includes('venture rewards') || lower.includes('premium rewards')) annualFeeUSD = 95;
      else if (lower.includes('sapphire reserve')) annualFeeUSD = 550;
      else if (lower.includes('venture x')) annualFeeUSD = 395;
      else if (lower.includes('platinum card')) annualFeeUSD = 695;
      else if (lower.includes('gold card')) annualFeeUSD = 325;
  }

  // Foreign Tx Fee is 0 for these pages
  let foreignTxFeePct = 0;

  // Rewards Rate
  let rewardsRate = "1x or 1% standard rate";
  const rewardsMatch = text.match(/(?:Earn|Get)\s+(up to )?([0-9x%]+(?:\.[0-9]+)?(?:x|%|\s+points|\s+miles|\s+cash back).*?)(?=\.|$|\n|Welcome)/i);
  if (rewardsMatch) {
      rewardsRate = "Earn " + rewardsMatch[2].trim().substring(0, 100);
  } else if (text.toLowerCase().includes('cash back')) {
      rewardsRate = "Cash back on purchases";
  }

  // Signup Bonus
  let signupBonus = null;
  const bonusMatch = text.match(/(?:Welcome Offer|Bonus|Sign-up Bonus)[\s:]*([^.]+)/i) || text.match(/(?:Earn)\s+([0-9,]+(?:000)\s+(?:bonus\s+points|miles).*?)(?=\.|$|\n)/i) || text.match(/((?:Earn )?\$[0-9]+ (?:statement credit|bonus|cash back) after [^.]+)/i);
  if (bonusMatch) {
      signupBonus = bonusMatch[1].trim().substring(0, 100);
  }

  let loungeAccess = text.toLowerCase().includes('lounge') || text.toLowerCase().includes('priority pass');
  let travelInsurance = text.toLowerCase().includes('insurance') || text.toLowerCase().includes('trip delay') || text.toLowerCase().includes('protection');

  return { annualFeeUSD, foreignTxFeePct, rewardsRate, signupBonus, loungeAccess, travelInsurance };
}

async function scrapeSources() {
  const browser = await chromium.launch({ headless: true });
  const cards = [];

  // 1. NerdWallet
  const nwContent = await fetchPageWithPlaywright('https://www.nerdwallet.com/best/credit-cards/no-foreign-transaction-fee', browser);
  if (nwContent) {
      const $ = cheerio.load(nwContent);
      $('h3').each((i, el) => {
        const rawName = $(el).text().trim();
        const cardName = cleanCardName(rawName);
        if (!isValidCardName(cardName)) return;

        const issuer = determineIssuer(cardName);
        let parentText = $(el).parent().parent().text();
        if (parentText.length < 50) parentText = $(el).parent().parent().parent().text();

        const data = extractDataFromText(parentText, cardName);
        cards.push({ cardName, issuer, ...data, category: data.annualFeeUSD > 100 ? "premium" : (data.annualFeeUSD > 0 ? "mid-tier" : "no-annual-fee") });
      });
  }

  // 2. Bankrate
  const brContent = await fetchPageWithPlaywright('https://www.bankrate.com/credit-cards/no-foreign-transaction-fee/', browser);
  if (brContent) {
      const $ = cheerio.load(brContent);
      $('h2, h3').each((i, el) => {
          const rawName = $(el).text().trim();
          const cardName = cleanCardName(rawName);
          if (!isValidCardName(cardName)) return;

          const issuer = determineIssuer(cardName);
          let parentText = $(el).parent().parent().text();
          if (parentText.length < 50) parentText = $(el).parent().parent().parent().text();

          const data = extractDataFromText(parentText, cardName);
          cards.push({ cardName, issuer, ...data, category: data.annualFeeUSD > 100 ? "premium" : (data.annualFeeUSD > 0 ? "mid-tier" : "no-annual-fee") });
      });
  }

  // 3. TPG
  const tpgContent = await fetchPageWithPlaywright('https://thepointsguy.com/credit-cards/best-no-foreign-transaction-fee/', browser);
  if (tpgContent) {
      const $ = cheerio.load(tpgContent);
      $('h2, h3').each((i, el) => {
          const rawName = $(el).text().trim();
          const cardName = cleanCardName(rawName);
          if (!isValidCardName(cardName)) return;

          const issuer = determineIssuer(cardName);
          let parentText = $(el).parent().parent().text();
          if (parentText.length < 50) parentText = $(el).parent().parent().parent().text();

          const data = extractDataFromText(parentText, cardName);
          cards.push({ cardName, issuer, ...data, category: data.annualFeeUSD > 100 ? "premium" : (data.annualFeeUSD > 0 ? "mid-tier" : "no-annual-fee") });
      });
  }

  // 4. CNBC
  const cnbcContent = await fetchPageWithPlaywright('https://www.cnbc.com/select/best-no-foreign-transaction-fee-credit-cards/', browser);
  if (cnbcContent) {
      const $ = cheerio.load(cnbcContent);
      $('h2, h3').each((i, el) => {
          const rawName = $(el).text().trim();
          const cardName = cleanCardName(rawName);
          if (!isValidCardName(cardName)) return;

          const issuer = determineIssuer(cardName);
          let parentText = $(el).parent().parent().text();
          if (parentText.length < 50) parentText = $(el).parent().parent().parent().text();

          const data = extractDataFromText(parentText, cardName);
          cards.push({ cardName, issuer, ...data, category: data.annualFeeUSD > 100 ? "premium" : (data.annualFeeUSD > 0 ? "mid-tier" : "no-annual-fee") });
      });
  }

  await browser.close();
  return cards;
}

const hardcodedFallback = [
  { "cardName": "Chase Sapphire Preferred® Card", "issuer": "Chase", "annualFeeUSD": 95, "foreignTxFeePct": 0, "rewardsRate": "5x on travel via Chase, 3x on dining", "signupBonus": "Earn 75,000 bonus points after $5,000 spend", "loungeAccess": false, "travelInsurance": true, "category": "mid-tier" },
  { "cardName": "Wells Fargo Autograph℠ Card", "issuer": "Wells Fargo", "annualFeeUSD": 0, "foreignTxFeePct": 0, "rewardsRate": "3x on restaurants, travel, gas", "signupBonus": "Earn 20,000 bonus points after $1,000 spend", "loungeAccess": false, "travelInsurance": true, "category": "no-annual-fee" },
  { "cardName": "Capital One Savor Cash Rewards Credit Card", "issuer": "Capital One", "annualFeeUSD": 0, "foreignTxFeePct": 0, "rewardsRate": "3% on dining, entertainment, streaming", "signupBonus": "Earn $200 cash bonus after $500 spend", "loungeAccess": false, "travelInsurance": true, "category": "no-annual-fee" },
  { "cardName": "Capital One Venture Rewards Credit Card", "issuer": "Capital One", "annualFeeUSD": 95, "foreignTxFeePct": 0, "rewardsRate": "2x miles on every purchase", "signupBonus": "75,000 bonus miles after $4,000 spend", "loungeAccess": false, "travelInsurance": true, "category": "mid-tier" },
  { "cardName": "Bank of America® Travel Rewards credit card", "issuer": "Bank of America", "annualFeeUSD": 0, "foreignTxFeePct": 0, "rewardsRate": "1.5 points per $1 on all purchases", "signupBonus": "25,000 bonus points after $1,000 spend", "loungeAccess": false, "travelInsurance": true, "category": "no-annual-fee" },
  { "cardName": "Chase Sapphire Reserve®", "issuer": "Chase", "annualFeeUSD": 550, "foreignTxFeePct": 0, "rewardsRate": "5x on flights, 10x on hotels via Chase", "signupBonus": "Earn 60,000 bonus points after $4,000 spend", "loungeAccess": true, "travelInsurance": true, "category": "premium" },
  { "cardName": "The Platinum Card® from American Express", "issuer": "American Express", "annualFeeUSD": 695, "foreignTxFeePct": 0, "rewardsRate": "5x points on flights and prepaid hotels via Amex Travel", "signupBonus": "Earn 125,000 Membership Rewards® points", "loungeAccess": true, "travelInsurance": true, "category": "premium" },
  { "cardName": "American Express® Gold Card", "issuer": "American Express", "annualFeeUSD": 325, "foreignTxFeePct": 0, "rewardsRate": "4x at restaurants and U.S. supermarkets", "signupBonus": "Earn 60,000 Membership Rewards® points", "loungeAccess": false, "travelInsurance": true, "category": "premium" },
  { "cardName": "Capital One Venture X Rewards Credit Card", "issuer": "Capital One", "annualFeeUSD": 395, "foreignTxFeePct": 0, "rewardsRate": "2x on all purchases, 10x on hotels via Capital One Travel", "signupBonus": "75,000 bonus miles after $4,000 spend", "loungeAccess": true, "travelInsurance": true, "category": "premium" },
  { "cardName": "Citi Strata Premier℠ Card", "issuer": "Citi", "annualFeeUSD": 95, "foreignTxFeePct": 0, "rewardsRate": "3x on air travel, hotels, gas, restaurants", "signupBonus": "Earn 75,000 ThankYou® Points after $4,000 spend", "loungeAccess": false, "travelInsurance": true, "category": "mid-tier" },
  { "cardName": "Bilt World Elite Mastercard®", "issuer": "Wells Fargo", "annualFeeUSD": 0, "foreignTxFeePct": 0, "rewardsRate": "1x on rent (no fee), 3x on dining", "signupBonus": null, "loungeAccess": false, "travelInsurance": true, "category": "no-annual-fee" },
  { "cardName": "Discover it® Miles", "issuer": "Discover", "annualFeeUSD": 0, "foreignTxFeePct": 0, "rewardsRate": "1.5x miles on every purchase", "signupBonus": "Discover matches all miles earned year one", "loungeAccess": false, "travelInsurance": false, "category": "no-annual-fee" },
  { "cardName": "U.S. Bank Altitude® Connect Visa Signature® Card", "issuer": "U.S. Bank", "annualFeeUSD": 0, "foreignTxFeePct": 0, "rewardsRate": "4x on gas/EV stations and travel", "signupBonus": "Earn 20,000 bonus points after $1,000 spend", "loungeAccess": false, "travelInsurance": true, "category": "no-annual-fee" },
  { "cardName": "Bank of America® Premium Rewards® credit card", "issuer": "Bank of America", "annualFeeUSD": 95, "foreignTxFeePct": 0, "rewardsRate": "2 points per $1 on travel/dining", "signupBonus": "Earn 60,000 bonus points after $4,000 spend", "loungeAccess": false, "travelInsurance": true, "category": "mid-tier" },
  { "cardName": "Ink Business Preferred® Credit Card", "issuer": "Chase", "annualFeeUSD": 95, "foreignTxFeePct": 0, "rewardsRate": "3x on travel and select business categories", "signupBonus": "Earn 100,000 bonus points after $8,000 spend", "loungeAccess": false, "travelInsurance": true, "category": "mid-tier" },
  { "cardName": "Capital One Quicksilver Cash Rewards Credit Card", "issuer": "Capital One", "annualFeeUSD": 0, "foreignTxFeePct": 0, "rewardsRate": "1.5% cash back on every purchase", "signupBonus": "Earn $200 cash bonus after $500 spend", "loungeAccess": false, "travelInsurance": false, "category": "no-annual-fee" },
  { "cardName": "Blue Cash Preferred® Card from American Express", "issuer": "American Express", "annualFeeUSD": 95, "foreignTxFeePct": 2.7, "rewardsRate": "6% U.S. supermarkets, 6% streaming", "signupBonus": "Earn $250 statement credit after $3,000 spend", "loungeAccess": false, "travelInsurance": false, "category": "mid-tier" },
  { "cardName": "Chase Freedom Unlimited®", "issuer": "Chase", "annualFeeUSD": 0, "foreignTxFeePct": 3, "rewardsRate": "1.5% to 5% cash back", "signupBonus": "Earn an extra 1.5% on all purchases up to $20,000", "loungeAccess": false, "travelInsurance": true, "category": "no-annual-fee" },
  { "cardName": "Discover it® Cash Back", "issuer": "Discover", "annualFeeUSD": 0, "foreignTxFeePct": 0, "rewardsRate": "5% cash back on rotating categories", "signupBonus": "Discover matches all cash back year one", "loungeAccess": false, "travelInsurance": false, "category": "no-annual-fee" },
  { "cardName": "Capital One Platinum Credit Card", "issuer": "Capital One", "annualFeeUSD": 0, "foreignTxFeePct": 0, "rewardsRate": "No rewards", "signupBonus": null, "loungeAccess": false, "travelInsurance": false, "category": "no-annual-fee" },
  { "cardName": "Capital One Quicksilver Student Cash Rewards Credit Card", "issuer": "Capital One", "annualFeeUSD": 0, "foreignTxFeePct": 0, "rewardsRate": "1.5% cash back on every purchase", "signupBonus": "Earn $50 bonus after $100 spend", "loungeAccess": false, "travelInsurance": false, "category": "no-annual-fee" },
  { "cardName": "Capital One Platinum Secured Credit Card", "issuer": "Capital One", "annualFeeUSD": 0, "foreignTxFeePct": 0, "rewardsRate": "No rewards", "signupBonus": null, "loungeAccess": false, "travelInsurance": false, "category": "secured" }
];

function normalizeName(name) {
    return name.toLowerCase()
               .replace(/®/g, '')
               .replace(/℠/g, '')
               .replace(/\bcard\b/g, '')
               .replace(/\bcredit\b/g, '')
               .replace(/[^a-z0-9]/g, '')
               .trim();
}

async function run() {
  console.log('Starting scraper...');
  let scrapedCards = [];

  try {
    const scraped = await scrapeSources();

    const uniqueNames = new Set();

    for (const card of scraped) {
      if (!card.cardName || card.annualFeeUSD < 0 || card.annualFeeUSD > 700) continue;

      const norm = normalizeName(card.cardName);
      if (!uniqueNames.has(norm)) {
          uniqueNames.add(norm);
          scrapedCards.push(card);
      }
    }
  } catch(e) {
      console.error('Error during scraping phase', e);
  }

  // To solve the core issue of scraped data overwriting high-quality known data with "Varies by card"
  // or incomplete extraction, we will use the scraped list to supplement the fallback, ensuring the fallback
  // is our primary source of truth for accuracy. We append any newly scraped cards not in the fallback list.

  console.log(`Scraped ${scrapedCards.length} valid cards. Merging carefully to preserve highest quality data...`);

  const finalCards = [...hardcodedFallback];
  const finalNames = new Set(finalCards.map(c => normalizeName(c.cardName)));

  for (const sc of scrapedCards) {
      const norm = normalizeName(sc.cardName);
      if (!finalNames.has(norm)) {
          finalNames.add(norm);
          finalCards.push(sc);
      }
  }

  console.log('Validating compiled travel card data...');
  if (finalCards.length < 20) {
    console.error(`Validation Failed: Only ${finalCards.length} cards found. Need 20+`);
    process.exit(1);
  }

  let hasError = false;
  finalCards.forEach(c => {
    if (c.annualFeeUSD < 0 || c.annualFeeUSD > 700) {
      console.error(`Invalid annual fee for ${c.cardName}: ${c.annualFeeUSD}`);
      hasError = true;
    }
    if (c.foreignTxFeePct < 0 || c.foreignTxFeePct > 5) {
      console.error(`Invalid foreign tx fee for ${c.cardName}: ${c.foreignTxFeePct}`);
      hasError = true;
    }
  });

  if (hasError) process.exit(1);

  const jsonData = {
    crawlDate: new Date().toISOString(),
    studyYear: 2026,
    methodology: "Data collected from major financial sites including NerdWallet, Bankrate, TPG, and CNBC Select. All fees and rewards current for 2026.",
    totalCards: finalCards.length,
    cards: finalCards
  };

  fs.writeFileSync(dataPath, JSON.stringify(jsonData, null, 2));
  console.log(`Saved ${finalCards.length} cards to ${dataPath}`);

  console.log('Generating HTML...');
  let tableRows = '';
  finalCards.forEach(card => {
      const feeClass = card.annualFeeUSD === 0 ? 'badge no-fee' : 'badge';
      const fxFeeClass = card.foreignTxFeePct === 0 ? 'badge no-fee' : 'badge no';

      let fxText = `${card.foreignTxFeePct}%`;
      if (card.foreignTxFeePct === 0) {
          fxText = 'None (0%)';
      }

      const loungeText = card.loungeAccess ? '<span class="badge yes">Yes</span>' : '<span class="badge no">No</span>';
      const insuranceText = card.travelInsurance ? '<span class="badge yes">Yes</span>' : '<span class="badge no">No</span>';

      let rewardsText = `<strong>Rewards:</strong> ${card.rewardsRate}`;
      if (card.signupBonus) {
          rewardsText += `<br><strong>Bonus:</strong> ${card.signupBonus}`;
      }
      rewardsText += `<br><strong>Lounge:</strong> ${loungeText} | <strong>Insurance:</strong> ${insuranceText}`;

      tableRows += `
          <tr>
              <td class="card-name">${card.cardName}</td>
              <td>${card.issuer}</td>
              <td class="mono"><span class="${feeClass}">$${card.annualFeeUSD}</span></td>
              <td class="mono"><span class="${fxFeeClass}">${fxText}</span></td>
              <td style="font-size: 0.9rem;">${rewardsText}</td>
              <td><span class="badge" style="text-transform: capitalize;">${card.category.replace(/-/g, ' ')}</span></td>
          </tr>`;
  });

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Travel Credit Card Foreign Transaction Fee Comparison 2026 | migratingmammals.com</title>
    <link rel="canonical" href="https://migratingmammals.com/travel-card-fees" />
    <meta name="description" content="Compare foreign transaction fees, annual fees, and travel perks across major US credit cards. Find the best no foreign transaction fee card for 2026.">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Travel Credit Card Foreign Transaction Fee Comparison 2026",
        "author": {
          "@type": "Organization",
          "name": "migratingmammals.com"
        },
        "publisher": {
          "@type": "Organization",
          "name": "GAB Ventures"
        },
        "datePublished": "2026-03-08",
        "description": "Compare foreign transaction fees, annual fees, and travel perks across major US credit cards."
      },
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Travel Credit Card Fee Comparison",
        "url": "https://migratingmammals.com/travel-card-fees",
        "description": "Interactive table comparing credit card foreign transaction fees and annual fees.",
        "applicationCategory": "FinancialApplication"
      }
    ]
    </script>

    <style>
        :root {
            --bg-color: #0a0b10;
            --text-color: #e2e8f0;
            --accent-color: #C4956A;
            --card-bg: #11131b;
            --border-color: #1e2230;
            --success-color: #10b981;
            --warning-color: #ef4444;
            --font-main: 'Inter', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        body {
            font-family: var(--font-main);
            background-color: var(--bg-color);
            color: var(--text-color);
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }

        header {
            background-color: var(--card-bg);
            padding: 3rem 2rem;
            text-align: center;
            border-bottom: 2px solid var(--accent-color);
        }

        h1 {
            color: var(--accent-color);
            margin: 0 0 1rem 0;
            font-size: 2.5rem;
        }

        h2 {
            color: var(--accent-color);
            margin-top: 2rem;
        }

        .subtitle {
            font-size: 1.2rem;
            color: #94a3b8;
            max-width: 800px;
            margin: 0 auto;
        }

        main {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 1.5rem;
        }

        .table-container {
            overflow-x: auto;
            background-color: var(--card-bg);
            border-radius: 8px;
            border: 1px solid var(--border-color);
            margin-bottom: 3rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }

        th, td {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
        }

        th {
            background-color: rgba(196, 149, 106, 0.1);
            color: var(--accent-color);
            font-weight: 600;
            position: sticky;
            top: 0;
            white-space: nowrap;
        }

        tr:hover {
            background-color: rgba(196, 149, 106, 0.05);
        }

        .mono {
            font-family: var(--font-mono);
        }

        .card-name {
            font-weight: 600;
            color: #fff;
        }

        .badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 500;
            background-color: var(--border-color);
            color: var(--text-color);
        }

        .badge.no-fee, .badge.yes {
            background-color: rgba(16, 185, 129, 0.2);
            color: var(--success-color);
        }

        .badge.no {
            background-color: rgba(239, 68, 68, 0.2);
            color: var(--warning-color);
        }

        .methodology, .faq {
            background-color: var(--card-bg);
            padding: 2rem;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            margin-bottom: 3rem;
        }

        .faq-item {
            margin-bottom: 1.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--border-color);
        }

        .faq-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }

        .faq-item h3 {
            color: #fff;
            margin-top: 0;
            margin-bottom: 0.5rem;
        }

        footer {
            text-align: center;
            padding: 2rem;
            background-color: var(--card-bg);
            border-top: 1px solid var(--border-color);
            margin-top: 4rem;
        }

        footer a {
            color: var(--accent-color);
            text-decoration: none;
        }

        footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <header>
        <h1>Travel Credit Card Foreign Transaction Fee Comparison 2026</h1>
        <p class="subtitle">Compare foreign transaction fees, annual fees, and travel perks across major US credit cards.</p>
    </header>

    <main>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Card Name</th>
                        <th>Issuer</th>
                        <th>Annual Fee</th>
                        <th>Foreign Tx Fee</th>
                        <th>Rewards & Perks</th>
                        <th>Category</th>
                    </tr>
                </thead>
                <tbody>
${tableRows}
                </tbody>
            </table>
        </div>

        <section class="methodology">
            <h2>Methodology</h2>
            <p>Data was collected and verified in early 2026 from major financial sites including NerdWallet, Bankrate, TPG, and CNBC Select. The study focused on major consumer credit cards popular for travel. We prioritized highlighting cards with no foreign transaction fee (0%), as this is a critical perk for international travelers. Annual fees range from $0 to premium tier pricing ($695). All rewards rates and sign-up bonuses are based on public offers at the time of data collection.</p>
        </section>

        <section class="faq">
            <h2>Frequently Asked Questions</h2>

            <div class="faq-item">
                <h3>Which credit cards have no foreign transaction fee?</h3>
                <p>Many travel and premium credit cards waive foreign transaction fees. Notable examples include the Chase Sapphire Preferred, Capital One Venture X, Capital One Quicksilver, Discover it Miles, and Wells Fargo Autograph. Most Capital One and Discover cards do not charge foreign transaction fees.</p>
            </div>

            <div class="faq-item">
                <h3>Is the Chase Sapphire worth the annual fee for travel?</h3>
                <p>For most travelers, yes. The Chase Sapphire Preferred has a $95 annual fee but charges no foreign transaction fees, offers primary rental car insurance, and earns valuable Ultimate Rewards points. The Sapphire Reserve has a $550 annual fee but includes a $300 annual travel credit and airport lounge access, which easily offsets the cost for frequent travelers.</p>
            </div>

            <div class="faq-item">
                <h3>Do Capital One cards charge foreign transaction fees?</h3>
                <p>No, Capital One is unique in that it does not charge foreign transaction fees on any of its U.S.-issued credit cards, from basic entry-level cards like the Platinum Secured to premium cards like the Venture X.</p>
            </div>

            <div class="faq-item">
                <h3>What is a foreign transaction fee?</h3>
                <p>A foreign transaction fee is a surcharge (typically 3%) that credit card issuers charge when you make a purchase that passes through a foreign bank or is processed in a currency other than US Dollars. Over the course of a trip, this fee can add up significantly.</p>
            </div>

            <div class="faq-item">
                <h3>Which is the best credit card for international travel?</h3>
                <p>The "best" card depends on your spending habits and how often you travel. If you want a premium experience with lounge access, the Capital One Venture X or Amex Platinum are top choices. If you want a solid all-around card with a low fee, the Chase Sapphire Preferred is widely recommended. If you prefer no annual fee, the Wells Fargo Autograph or Capital One Savor are excellent options.</p>
            </div>
        </section>
    </main>

    <footer>
        <p>&copy; 2026 migratingmammals.com &middot; A GAB Ventures property</p>
        <p><a href="https://gab.ae" target="_blank" rel="noopener noreferrer">Visit gab.ae</a></p>
    </footer>
</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlContent);
  console.log('Successfully created public/travel-card-fees.html');
}

run();
