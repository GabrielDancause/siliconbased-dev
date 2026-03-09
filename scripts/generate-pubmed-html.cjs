const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'test-pubmed.json');
const htmlPath = path.join(__dirname, '..', 'public', 'test-pubmed-results.html');

try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    let rowsHtml = '';
    data.papers.forEach((paper, index) => {
        let abstractHtml = '<span class="text-gray-500 italic">No abstract available</span>';
        if (paper.abstract) {
            abstractHtml = `<p class="text-sm text-gray-800 break-words">${paper.abstract}</p>`;
        }

        let errorHtml = '';
        if (paper.error) {
            errorHtml = `<p class="text-xs text-red-500 mt-1">Error: ${paper.error}</p>`;
        }

        rowsHtml += `
        <div class="border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow-sm">
            <h3 class="font-bold text-lg text-indigo-700 mb-2">${index + 1}. ${paper.title || 'Untitled'}</h3>
            <div class="mb-2 text-xs text-gray-500 font-mono">PMID: <a href="https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/" target="_blank" class="text-blue-600 hover:underline">${paper.pmid}</a></div>
            <div class="mt-3">
                <h4 class="font-semibold text-gray-700 text-sm mb-1">Abstract</h4>
                ${abstractHtml}
            </div>
            ${errorHtml}
        </div>
        `;
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PubMed API Test Results</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
    </style>
</head>
<body class="text-gray-900">
    <div class="max-w-4xl mx-auto p-6">
        <header class="mb-8 border-b pb-4">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">PubMed API Scraper Test Results</h1>
            <p class="text-gray-600">Experiment to test fetching PMIDs and abstracts programmatically via E-utilities.</p>
        </header>

        <section class="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <div class="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-1">Query</div>
                <div class="text-lg font-bold text-indigo-900">${data.query}</div>
            </div>
            <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <div class="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-1">Papers Found</div>
                <div class="text-lg font-bold text-indigo-900">${data.papersFound}</div>
            </div>
            <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <div class="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-1">Abstracts Extracted</div>
                <div class="text-lg font-bold text-indigo-900">${data.abstractsFetched}</div>
            </div>
            <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <div class="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-1">Total Time</div>
                <div class="text-lg font-bold text-indigo-900">${data.totalTimeMs}ms</div>
            </div>
        </section>

        <section class="mb-8">
            <h2 class="text-xl font-bold mb-4 border-b pb-2">Results (${data.papers.length} Fetched)</h2>
            <div class="bg-yellow-50 text-yellow-800 p-3 rounded text-sm mb-4 border border-yellow-200">
                <strong>Note:</strong> Empty abstracts typically indicate papers without published abstracts, or cases where the XML structure differs.
            </div>

            <div class="space-y-4">
                ${rowsHtml}
            </div>
        </section>

        <footer class="text-center text-sm text-gray-500 mt-12 mb-8">
            <p>&copy; ${new Date().getFullYear()} siliconbased.dev &middot; A GAB Ventures property</p>
        </footer>
    </div>
</body>
</html>`;

    fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');

    console.log(`Successfully generated HTML report at ${htmlPath}`);

} catch (err) {
    console.error('Failed to generate HTML:', err);
}
