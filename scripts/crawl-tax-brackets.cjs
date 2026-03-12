const https = require('https');
const fs = require('fs');
const path = require('path');

const targetCountries = {
    "United States": "North America", "Canada": "North America", "United Kingdom": "Europe", "Germany": "Europe", "France": "Europe",
    "Spain": "Europe", "Italy": "Europe", "Netherlands": "Europe", "Sweden": "Europe", "Norway": "Europe",
    "Denmark": "Europe", "Switzerland": "Europe", "Ireland": "Europe", "Portugal": "Europe", "Australia": "Oceania",
    "New Zealand": "Oceania", "Japan": "Asia", "South Korea": "Asia", "Singapore": "Asia", "Hong Kong": "Asia",
    "United Arab Emirates": "Middle East", "Saudi Arabia": "Middle East", "India": "Asia", "China": "Asia", "Brazil": "South America",
    "Mexico": "North America", "Argentina": "South America", "Colombia": "South America", "Thailand": "Asia", "Malaysia": "Asia",
    "Indonesia": "Asia", "Philippines": "Asia", "Vietnam": "Asia", "South Africa": "Africa", "Nigeria": "Africa",
    "Kenya": "Africa", "Egypt": "Africa", "Turkey": "Europe/Asia", "Poland": "Europe", "Czech Republic": "Europe",
    "Romania": "Europe", "Hungary": "Europe", "Croatia": "Europe", "Greece": "Europe", "Israel": "Middle East",
    "Russia": "Europe/Asia", "Austria": "Europe", "Belgium": "Europe", "Finland": "Europe"
};

function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                let location = res.headers.location;
                if (!location.startsWith('http')) {
                    const u = new URL(url);
                    location = `${u.protocol}//${u.host}${location}`;
                }
                return fetch(location).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function extractTE(html, pattern) {
    const results = {};
    const regex = new RegExp(pattern, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
        const country = match[1].trim();
        const value = parseFloat(match[2]);
        if (!isNaN(value)) {
            results[country] = value;
        }
    }
    return results;
}

function parsePwC(html, countryName) {
    // Basic heuristic to find bracket table on PwC
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let match;
    let numberOfBrackets = null;
    let lowestRate = null;
    while ((match = tableRegex.exec(html)) !== null) {
        const tableHtml = match[1];
        if (tableHtml.toLowerCase().includes('taxable income') || tableHtml.toLowerCase().includes('tax rate') || tableHtml.toLowerCase().includes('bracket')) {
            const rows = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
            // Assuming first row is header
            if (rows.length > 2) {
                // Count data rows that look like brackets
                let bracketsFound = 0;
                let firstRate = null;
                for (let i = 1; i < rows.length; i++) {
                    const cells = rows[i].match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
                    if (cells.length >= 2) {
                         const lastCellText = cells[cells.length - 1].replace(/<[^>]+>/g, '').trim();
                         const rateMatch = lastCellText.match(/([\d\.]+)/);
                         if (rateMatch) {
                             bracketsFound++;
                             const rateVal = parseFloat(rateMatch[1]);
                             if (firstRate === null && rateVal > 0) firstRate = rateVal;
                         }
                    }
                }
                if (bracketsFound > 0) {
                    numberOfBrackets = bracketsFound;
                    lowestRate = firstRate;
                    break;
                }
            }
        }
    }
    return { numberOfBrackets, lowestRate };
}

function validatePct(val) {
    if (val === null || val === undefined) return null;
    if (val < 0) return 0;
    if (val > 65) return 65; // hard cap per rules
    return val;
}

function validateUSD(val) {
    if (val === null || val === undefined) return null;
    if (val < 0) return 0;
    if (val > 2000000) return 2000000;
    return val;
}

(async () => {
    console.log("Fetching TradingEconomics data...");
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    let teIncomeHtml = "";
    let teVATHtml = "";
    let teSSHtml = "";

    try {
        teIncomeHtml = await fetch('https://tradingeconomics.com/country-list/personal-income-tax-rate');
        teVATHtml = await fetch('https://tradingeconomics.com/country-list/sales-tax-rate');
        teSSHtml = await fetch('https://tradingeconomics.com/country-list/social-security-rate-for-employees');
    } catch(e) {
        console.error("Error fetching TE", e);
    }

    // Different potential markup variations in TE
    const pattern1 = "href='/[^/]+/[^']+'[^>]*>\\s*([^<]+)\\s*</a></td>\\s*<td[^>]*>([\\d\\.-]+)</td>";
    const pattern2 = "href='/[^/]+/[^']+'[^>]*>([^<]+)</a></td>\\s*<td[^>]*>([\\d\\.-]+)</td>";

    let incomeRates = extractTE(teIncomeHtml, pattern1);
    if (Object.keys(incomeRates).length === 0) incomeRates = extractTE(teIncomeHtml, pattern2);

    let vatRates = extractTE(teVATHtml, pattern1);
    if (Object.keys(vatRates).length === 0) vatRates = extractTE(teVATHtml, pattern2);

    let ssRates = extractTE(teSSHtml, pattern1);
    if (Object.keys(ssRates).length === 0) ssRates = extractTE(teSSHtml, pattern2);

    // Add mapping for names
    const nameMap = {
        "United Arab Emirates": "UAE",
        "United States": "United States",
        "United Kingdom": "United Kingdom",
        "South Korea": "South Korea",
        "Hong Kong": "Hong Kong",
        "Saudi Arabia": "Saudi Arabia",
        "South Africa": "South Africa",
        "Czech Republic": "Czech Republic",
        "New Zealand": "New Zealand"
    };

    const finalData = [];

    for (const rawCountry in targetCountries) {
        const country = nameMap[rawCountry] || rawCountry;
        const region = targetCountries[rawCountry];

        let topMarginalRate = validatePct(incomeRates[rawCountry]);
        let vatRate = validatePct(vatRates[rawCountry]);
        let socialSecurityPct = validatePct(ssRates[rawCountry]);

        // Use PwC for detailed bracket data
        let numberOfBrackets = null;
        let lowestRate = null;

        // Basic slug generation
        const slug = rawCountry.toLowerCase().replace(/\s+/g, '-');
        try {
            const pwcHtml = await fetch(`https://taxsummaries.pwc.com/${slug}/individual/taxes-on-personal-income`);
            if (pwcHtml && !pwcHtml.includes('Page not found')) {
                const pwcData = parsePwC(pwcHtml, rawCountry);
                numberOfBrackets = pwcData.numberOfBrackets;
                lowestRate = validatePct(pwcData.lowestRate);
            }
        } catch(e) {
            // Ignore fetch errors for specific countries
        }

        let effectiveRateAt50kUSD = null;
        let effectiveRateAt100kUSD = null;

        if (topMarginalRate !== null) {
             finalData.push({
                country: rawCountry,
                region: region,
                topMarginalRate: topMarginalRate,
                topBracketStartUSD: validateUSD(null),
                lowestRate: lowestRate,
                numberOfBrackets: numberOfBrackets,
                capitalGainsTax: null,
                vatRate: vatRate,
                socialSecurityPct: socialSecurityPct,
                effectiveRateAt50kUSD: effectiveRateAt50kUSD,
                effectiveRateAt100kUSD: effectiveRateAt100kUSD,
                taxFreeThresholdUSD: null,
                specialNotes: null
            });
        }
    }

    const outputPath = path.join(__dirname, '../data/tax-brackets-comparison.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));

    console.log(`Saved ${finalData.length} countries to ${outputPath}`);

})();
