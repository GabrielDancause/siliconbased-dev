const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'travel-card-fees.json'), 'utf8'));

const faq = [
  {
    q: "Which credit cards have no foreign transaction fee?",
    a: "Many travel-focused credit cards from issuers like Chase, Capital One, and American Express offer no foreign transaction fees. All Capital One and Discover cards have no foreign transaction fees, while other issuers typically reserve this perk for their mid-tier and premium travel cards."
  },
  {
    q: "Is the Chase Sapphire worth the annual fee for travel?",
    a: "For frequent travelers, the Chase Sapphire Preferred ($95) or Reserve ($550) are often worth it due to their high rewards rates on travel, valuable point transfer partners, and comprehensive travel insurance. The Reserve also adds lounge access and a $300 annual travel credit."
  },
  {
    q: "Do Capital One cards charge foreign transaction fees?",
    a: "No, Capital One is one of the few major issuers that charges $0 in foreign transaction fees across its entire credit card lineup, including their no-annual-fee and secured cards."
  },
  {
    q: "What is a foreign transaction fee?",
    a: "A foreign transaction fee is a surcharge (typically 3%) that credit card issuers add to purchases made outside the United States or with a non-U.S. merchant. It covers the cost of processing the international transaction."
  },
  {
    q: "Which is the best credit card for international travel?",
    a: "The 'best' card depends on your spending, but top contenders for 2026 include the Chase Sapphire Preferred for its balance of fee and rewards, the Capital One Venture X for premium perks at a lower effective cost, and the Wells Fargo Autograph for no annual fee."
  }
];

const schema = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Travel Credit Card Foreign Transaction Fee Comparison 2026",
    "url": "https://migratingmammals.com/travel-card-fees",
    "description": "Comprehensive comparison of foreign transaction fees, annual fees, and travel perks across major US credit cards for 2026.",
    "datePublished": "2026-01-01",
    "author": {
      "@type": "Organization",
      "name": "migratingmammals.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "migratingmammals.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://migratingmammals.com/logo.png"
      }
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  },
  {
    "@context": "https://schema.org",
    "@type": "Table",
    "name": "Credit Card Fee Comparison Table",
    "about": "Comparison of annual fees and foreign transaction fees for popular travel credit cards."
  }
];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Travel Credit Card Foreign Transaction Fee Comparison 2026 | migratingmammals.com</title>
  <meta name="description" content="Compare foreign transaction fees, annual fees, and travel perks across 20+ major US credit cards. Find the best card for your 2026 travels.">
  <link rel="canonical" href="https://migratingmammals.com/travel-card-fees">
  <style>
    :root {
      --bg-color: #0a0b10;
      --card-bg: #111318;
      --border-color: #1e2030;
      --accent: #C4956A;
      --text-primary: #e0e0e0;
      --text-secondary: #a0a0a0;
      --success: #4CAF50;
      --warning: #FFC107;
    }
    body {
      background-color: var(--bg-color);
      color: var(--text-primary);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    header, main, footer {
      max-width: 1100px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1, h2, h3 {
      color: var(--accent);
    }
    h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
    }
    .subtitle {
        color: var(--text-secondary);
        font-size: 1.2rem;
        margin-bottom: 2rem;
    }
    .methodology {
      background-color: var(--card-bg);
      border-left: 4px solid var(--accent);
      padding: 1.5rem;
      margin-bottom: 3rem;
      border-radius: 4px;
    }
    .methodology h2 {
        margin-top: 0;
        font-size: 1.5rem;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;
    }
    .card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2rem;
      transition: transform 0.2s;
      display: flex;
      flex-direction: column;
    }
    .card:hover {
      transform: translateY(-5px);
      border-color: var(--accent);
    }
    .card h3 {
      margin-top: 0;
      min-height: 3em;
      display: flex;
      align-items: center;
    }
    .issuer {
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
    }
    .category-tag {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        background: var(--border-color);
        margin-bottom: 1rem;
    }
    .fee-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }
    .fee-box {
        text-align: center;
        flex: 1;
    }
    .fee-label {
        display: block;
        font-size: 0.7rem;
        color: var(--text-secondary);
        text-transform: uppercase;
    }
    .fee-value {
        font-size: 1.2rem;
        font-weight: bold;
    }
    .perks {
        margin-top: 1rem;
        flex-grow: 1;
    }
    .perk-item {
        display: flex;
        align-items: flex-start;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
    }
    .perk-icon {
        margin-right: 8px;
        color: var(--success);
    }
    .no-perk {
        color: var(--text-secondary);
        text-decoration: line-through;
    }
    .rewards {
        font-style: italic;
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-top: 1rem;
    }
    .bonus {
        margin-top: 1rem;
        padding: 0.5rem;
        background: rgba(196, 149, 106, 0.1);
        border-radius: 4px;
        font-size: 0.85rem;
        color: var(--accent);
    }
    .faq {
        margin-top: 4rem;
    }
    .faq-item {
      margin-bottom: 2rem;
    }
    .faq-item h4 {
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
    }
    .faq-item p {
      color: var(--text-secondary);
    }
    footer {
      border-top: 1px solid var(--border-color);
      margin-top: 4rem;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    a {
      color: var(--accent);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    @media (max-width: 600px) {
        header, main, footer {
            padding: 1rem;
        }
        h1 {
            font-size: 1.8rem;
        }
    }
  </style>
  <script type="application/ld+json">
    ${JSON.stringify(schema, null, 2)}
  </script>
</head>
<body>
  <header>
    <h1>Travel Credit Card Foreign Transaction Fee Comparison 2026</h1>
    <div class="subtitle">Detailed breakdown of fees and travel perks for international travelers.</div>
  </header>
  <main>
    <div class="methodology">
      <h2>Methodology</h2>
      <p>${data.methodology}</p>
      <p>Last Updated: ${new Date(data.crawlDate).toLocaleDateString()}</p>
    </div>

    <div class="card-grid">
      ${data.cards.map(card => `
      <div class="card">
        <div class="issuer">${card.issuer}</div>
        <div class="category-tag">${card.category.replace('-', ' ')}</div>
        <h3>${card.cardName}</h3>

        <div class="fee-row">
            <div class="fee-box">
                <span class="fee-label">Annual Fee</span>
                <span class="fee-value">$${card.annualFeeUSD}</span>
            </div>
            <div class="fee-box">
                <span class="fee-label">Foreign TX Fee</span>
                <span class="fee-value" style="color: ${card.foreignTxFeePct === 0 ? 'var(--success)' : 'var(--warning)'}">${card.foreignTxFeePct}%</span>
            </div>
        </div>

        <div class="perks">
            <div class="perk-item">
                <span class="perk-icon">${card.loungeAccess ? '✓' : '✗'}</span>
                <span class="${card.loungeAccess ? '' : 'no-perk'}">Lounge Access</span>
            </div>
            <div class="perk-item">
                <span class="perk-icon">${card.travelInsurance ? '✓' : '✗'}</span>
                <span class="${card.travelInsurance ? '' : 'no-perk'}">Travel Insurance</span>
            </div>
            <div class="rewards">
                <strong>Rewards:</strong> ${card.rewardsRate}
            </div>
            ${card.signupBonus ? `<div class="bonus"><strong>Bonus:</strong> ${card.signupBonus}</div>` : ''}
        </div>
      </div>
      `).join('')}
    </div>

    <section class="faq">
      <h2>Frequently Asked Questions</h2>
      ${faq.map(item => `
      <div class="faq-item">
        <h4>${item.q}</h4>
        <p>${item.a}</p>
      </div>
      `).join('')}
    </section>
  </main>
  <footer>
    <p>&copy; 2026 <a href="https://migratingmammals.com">migratingmammals.com</a> &middot; A GAB Ventures property</p>
  </footer>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'travel-card-fees.html'), html);
console.log('Created public/travel-card-fees.html');
