const https = require('https');
const fs = require('fs');
const path = require('path');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchUrl = (url) => {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        https.get(url, (res) => {
            const timeMs = Date.now() - start;
            console.log(`[HTTP ${res.statusCode}] ${timeMs}ms - ${url}`);

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ data, statusCode: res.statusCode, timeMs, url }));
        }).on('error', (err) => {
            const timeMs = Date.now() - start;
            console.error(`[ERROR] ${timeMs}ms - ${url} - ${err.message}`);
            reject(err);
        });
    });
};

const main = async () => {
    const startTime = Date.now();
    const query = 'HPV E2 protein';
    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=20&retmode=json`;

    console.log('--- PubMed API Test ---');
    console.log('Fetching search results...');

    let pmids = [];
    try {
        const res = await fetchUrl(esearchUrl);
        if (res.statusCode === 200) {
            const parsed = JSON.parse(res.data);
            pmids = parsed.esearchresult.idlist || [];
        } else {
            console.error(`ESearch failed with status ${res.statusCode}`);
        }
    } catch (err) {
        console.error('Failed to execute ESearch', err);
    }

    console.log(`Found ${pmids.length} PMIDs.`);

    const papers = [];
    let successfulFetches = 0;
    let failedFetches = 0;

    for (const pmid of pmids) {
        // PubMed recommends no more than 3 requests per second without an API key
        await delay(350);

        const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml`;
        let abstractText = null;
        let title = null;
        let errorMsg = null;

        try {
            const res = await fetchUrl(efetchUrl);
            if (res.statusCode === 200) {
                successfulFetches++;
                const xml = res.data;

                // Extract Abstract using Regex (since jsdom/cheerio isn't strictly necessary for this simple xml extraction)
                // Need to extract full abstract including multiple AbstractText nodes if present, or just the first.
                // It's safer to just extract the inner content of <AbstractText> tags.
                const abstractMatches = xml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi);
                if (abstractMatches) {
                    // Clean up tags and join multiple sections
                    abstractText = abstractMatches.map(m => m.replace(/<[^>]+>/g, '').trim()).join(' ');
                }

                const titleMatch = xml.match(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/i);
                if (titleMatch && titleMatch[1]) {
                    title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
                }
            } else {
                failedFetches++;
                errorMsg = `HTTP ${res.statusCode}`;
            }
        } catch (err) {
            failedFetches++;
            errorMsg = err.message;
        }

        papers.push({
            pmid,
            title,
            abstract: abstractText,
            error: errorMsg
        });
    }

    const totalTimeMs = Date.now() - startTime;

    const resultData = {
        query,
        totalTimeMs,
        esearchUrl,
        papersFound: pmids.length,
        abstractsFetched: papers.filter(p => p.abstract !== null).length,
        successfulFetches,
        failedFetches,
        papers
    };

    const outPath = path.join(__dirname, '..', 'data', 'test-pubmed.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(resultData, null, 2), 'utf8');

    console.log(`Saved results to ${outPath}`);
    console.log(`Total Time: ${totalTimeMs}ms`);
};

main();
