const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/travel-card-fees.json');
const htmlPath = path.join(__dirname, '../public/travel-card-fees.html');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
let html = fs.readFileSync(htmlPath, 'utf8');

function generateCardHTML(card) {
    const signupHtml = card.signupBonus
        ? `<div class="detail-item">
            <span class="detail-icon">🎁</span>
            <div><span class="detail-label">Bonus:</span> ${card.signupBonus}</div>
           </div>`
        : '';

    return `
        <div class="card">
            <div class="card-header">
                <div>
                    <h3 class="card-title">${card.cardName}</h3>
                    <div class="card-issuer">${card.issuer}</div>
                </div>
                <div class="card-category">${card.category.replace(/-/g, ' ')}</div>
            </div>

            <div class="card-stats">
                <div class="stat">
                    <div class="stat-value">$${card.annualFeeUSD}</div>
                    <div class="stat-label">Annual Fee</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${card.foreignTxFeePct}%</div>
                    <div class="stat-label">Foreign TX Fee</div>
                </div>
            </div>

            <div class="card-details">
                <div class="detail-item">
                    <span class="detail-icon">⭐</span>
                    <div><span class="detail-label">Rewards:</span> ${card.rewardsRate}</div>
                </div>
                ${signupHtml}

                <div class="perks">
                    <span class="perk-badge ${card.loungeAccess ? 'active' : 'inactive'}">
                        ${card.loungeAccess ? '✓' : '✕'} Lounge Access
                    </span>
                    <span class="perk-badge ${card.travelInsurance ? 'active' : 'inactive'}">
                        ${card.travelInsurance ? '✓' : '✕'} Travel Insurance
                    </span>
                </div>
            </div>
        </div>
    `;
}

const cardsHtml = data.map(generateCardHTML).join('\n');

html = html.replace('<!-- __JSON_DATA__ -->', cardsHtml);

fs.writeFileSync(htmlPath, html);
console.log('Successfully injected JSON data into HTML.');
