#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'chmod-combos.json'), 'utf8'));
const outDir = path.join(__dirname, '..', 'public', 'chmod');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function parseOctal(octal) {
  const digits = octal.split('').map(Number);
  const names = ['Owner', 'Group', 'Others'];
  const perms = ['Read', 'Write', 'Execute'];
  return digits.map((d, i) => ({
    name: names[i],
    read: !!(d & 4),
    write: !!(d & 2),
    execute: !!(d & 1),
    digit: d,
  }));
}

function securityColor(level) {
  if (level === 'safe') return { bg: '#0a2e1a', color: '#34d399', label: '✓ Safe' };
  if (level === 'moderate') return { bg: '#2e2a0a', color: '#fbbf24', label: '⚠ Moderate' };
  return { bg: '#2e0a0a', color: '#f87171', label: '✗ Dangerous' };
}

function generatePage(entry) {
  const p = parseOctal(entry.octal);
  const sec = securityColor(entry.security);
  const c = entry.content;
  const relatedPages = data
    .filter(d => d.octal !== entry.octal)
    .filter(d => d.octal === c.comparison || d.searchVolume === 'high')
    .slice(0, 5);

  const faqSchema = entry.faqs.map(f => `{"@type":"Question","name":${JSON.stringify(f.q)},"acceptedAnswer":{"@type":"Answer","text":${JSON.stringify(f.a)}}}`).join(',');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>chmod ${entry.octal} (${entry.symbolic}) — Linux File Permissions Explained</title>
<meta name="description" content="What does chmod ${entry.octal} mean? ${entry.title}. Interactive permission breakdown, copy-paste commands, security analysis, and common mistakes explained.">
<meta property="og:title" content="chmod ${entry.octal} (${entry.symbolic}) — ${entry.title}">
<meta property="og:description" content="${c.what.substring(0, 160)}">
<meta property="og:type" content="article">
<link rel="canonical" href="https://siliconbased.dev/chmod/${entry.octal}">
<script type="application/ld+json">
[{"@context":"https://schema.org","@type":"WebPage","name":"chmod ${entry.octal} (${entry.symbolic}) — Linux File Permissions Explained","description":"${entry.title}","url":"https://siliconbased.dev/chmod/${entry.octal}"},{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[${faqSchema}]}]
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#0a0b10;color:#e0e0e0;line-height:1.7}
code,.mono{font-family:'JetBrains Mono',monospace}
.hero{text-align:center;padding:48px 24px 32px;background:linear-gradient(180deg,#0f1729 0%,#0a0b10 100%)}
.hero h1{font-size:2rem;font-weight:900;color:#fff;margin-bottom:6px}.hero h1 .code-font{color:#818cf8}
.hero .subtitle{color:#888;font-size:0.95rem}
.sec-badge{display:inline-block;padding:4px 14px;border-radius:20px;font-size:0.75rem;font-weight:700;margin-top:12px;background:${sec.bg};color:${sec.color}}
.main{max-width:800px;margin:0 auto;padding:32px 20px 60px}
.card{background:#111318;border:1px solid #1e2030;border-radius:14px;padding:28px 24px;margin-bottom:20px}
.card h2{font-size:1.15rem;font-weight:700;color:#fff;margin-bottom:12px}
.card p{font-size:0.9rem;color:#999;line-height:1.8;margin-bottom:10px}
.card p:last-child{margin-bottom:0}
.card strong{color:#ccc}

/* Interactive permission grid */
.perm-grid{display:grid;grid-template-columns:100px repeat(3,1fr);gap:0;margin:20px 0;border-radius:12px;overflow:hidden;border:1px solid #1e2030}
.perm-cell{padding:14px 12px;text-align:center;font-size:0.82rem;border-bottom:1px solid #1e2030;border-right:1px solid #1e2030}
.perm-cell:last-child{border-right:none}
.perm-header{background:#13151d;font-weight:700;color:#ccc;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.5px}
.perm-label{background:#13151d;font-weight:600;color:#999;text-align:left;padding-left:16px}
.perm-on{background:#0a2e1a;color:#34d399;font-weight:700;cursor:pointer;transition:all 0.15s;user-select:none}
.perm-on:hover{background:#0d3a20}
.perm-off{background:#1a0a0a;color:#555;cursor:pointer;transition:all 0.15s;user-select:none}
.perm-off:hover{background:#2a1010}

/* Live command */
.cmd-box{background:#0a0b10;border:1px solid #1e2030;border-radius:10px;padding:16px 20px;margin:16px 0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.cmd-text{font-family:'JetBrains Mono',monospace;font-size:1rem;color:#e0e0e0}
.cmd-text .hl{color:#818cf8;font-weight:700}
.copy-btn{background:#1e2030;border:1px solid #2a2d40;color:#888;padding:6px 16px;border-radius:8px;font-size:0.75rem;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.15s}
.copy-btn:hover{background:#2a2d40;color:#ccc}
.copy-btn.copied{background:#1a3a1a;color:#4ade80;border-color:#2d5a2d}

.filename-input{background:transparent;border:none;border-bottom:1px dashed #444;color:#fbbf24;font-family:'JetBrains Mono',monospace;font-size:1rem;width:120px;outline:none;padding-bottom:1px}
.filename-input:focus{border-bottom-color:#fbbf24}

/* Comparison */
.vs-box{background:#0f1120;border:1px solid #1e2030;border-radius:10px;padding:20px;margin:16px 0}
.vs-title{font-size:0.95rem;font-weight:700;color:#818cf8;margin-bottom:8px}
.vs-text{font-size:0.88rem;color:#999;line-height:1.7}

/* FAQ */
.faq{border-top:1px solid #1e2030;padding-top:16px;margin-top:16px}
.faq-q{font-size:0.92rem;font-weight:700;color:#fff;margin-bottom:6px}
.faq-a{font-size:0.88rem;color:#999;line-height:1.7;margin-bottom:16px}
.faq-a:last-child{margin-bottom:0}

/* Related */
.related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:12px}
.related-card{background:#0a0b10;border:1px solid #1e2030;border-radius:10px;padding:14px;text-align:center;text-decoration:none;color:#e0e0e0;transition:border-color 0.2s}
.related-card:hover{border-color:#818cf8}
.related-card .rc-octal{font-family:'JetBrains Mono',monospace;font-size:1.2rem;font-weight:700;color:#818cf8}
.related-card .rc-sym{font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:#666;margin-top:2px}

.back-link{display:inline-block;margin-top:24px;color:#818cf8;text-decoration:none;font-weight:600;font-size:0.9rem}
.back-link:hover{text-decoration:underline}

.footer{text-align:center;padding:40px 24px;font-size:0.78rem;color:#555;border-top:1px solid #151520;margin-top:40px}
.footer a{color:#818cf8;text-decoration:none}

@media(max-width:600px){
  .hero h1{font-size:1.5rem}
  .perm-grid{grid-template-columns:80px repeat(3,1fr)}
  .perm-cell{padding:10px 8px;font-size:0.75rem}
  .cmd-text{font-size:0.85rem}
  .main{padding:20px 14px 40px}
}
</style>
</head>
<body>

<div class="hero">
  <h1>chmod <span class="code-font">${entry.octal}</span> — ${entry.symbolic}</h1>
  <p class="subtitle">${entry.title}</p>
  <span class="sec-badge">${sec.label}</span>
</div>

<div class="main">

  <!-- Interactive Permission Grid -->
  <div class="card">
    <h2>Permission Breakdown</h2>
    <p>${c.what}</p>
    <div class="perm-grid" id="permGrid">
      <div class="perm-cell perm-header"></div>
      <div class="perm-cell perm-header">Read (4)</div>
      <div class="perm-cell perm-header">Write (2)</div>
      <div class="perm-cell perm-header">Execute (1)</div>
      ${p.map((u, i) => `
      <div class="perm-cell perm-label">${u.name} (${u.digit})</div>
      <div class="perm-cell ${u.read ? 'perm-on' : 'perm-off'}" data-row="${i}" data-col="0" onclick="togglePerm(this)">${u.read ? '✓ r' : '— r'}</div>
      <div class="perm-cell ${u.write ? 'perm-on' : 'perm-off'}" data-row="${i}" data-col="1" onclick="togglePerm(this)">${u.write ? '✓ w' : '— w'}</div>
      <div class="perm-cell ${u.execute ? 'perm-on' : 'perm-off'}" data-row="${i}" data-col="2" onclick="togglePerm(this)">${u.execute ? '✓ x' : '— x'}</div>`).join('')}
    </div>
    <p style="font-size:0.78rem;color:#555;text-align:center">Click any permission to toggle it and see the command update live</p>
  </div>

  <!-- Live Command -->
  <div class="card">
    <h2>Command</h2>
    <div class="cmd-box">
      <div class="cmd-text">chmod <span class="hl" id="liveOctal">${entry.octal}</span> <input class="filename-input" id="filename" value="filename" spellcheck="false"></div>
      <button class="copy-btn" id="copyCmd" onclick="copyCommand()">Copy</button>
    </div>
    <div class="cmd-box">
      <div class="cmd-text">chmod -R <span class="hl" id="liveOctalR">${entry.octal}</span> <input class="filename-input" id="dirname" value="directory/" spellcheck="false"></div>
      <button class="copy-btn" onclick="copyRecursive()">Copy</button>
    </div>
  </div>

  <!-- When to Use -->
  <div class="card">
    <h2>When to use chmod ${entry.octal}</h2>
    <p>${c.when}</p>
    ${c.danger ? `<p><strong>Security note:</strong> ${c.danger}</p>` : ''}
    ${c.instead ? `<p><strong>Consider instead:</strong> ${c.instead}</p>` : ''}
  </div>

  <!-- Common Mistake -->
  <div class="card">
    <h2>Common Mistake</h2>
    <p>${c.commonMistake}</p>
  </div>

  <!-- Comparison -->
  <div class="card">
    <h2>chmod ${entry.octal} vs ${c.comparison}</h2>
    <div class="vs-box">
      <div class="vs-title">${entry.octal} vs ${c.comparison}</div>
      <div class="vs-text">${c.comparisonText}</div>
    </div>
  </div>

  <!-- FAQ -->
  <div class="card">
    <h2>Frequently Asked Questions</h2>
    ${entry.faqs.map(f => `<div class="faq"><div class="faq-q">${f.q}</div><div class="faq-a">${f.a}</div></div>`).join('')}
  </div>

  <!-- Related -->
  <div class="card">
    <h2>Related Permissions</h2>
    <div class="related-grid">
      ${relatedPages.map(r => `<a class="related-card" href="/chmod/${r.octal}"><div class="rc-octal">${r.octal}</div><div class="rc-sym">${r.symbolic}</div></a>`).join('')}
    </div>
  </div>

  <a class="back-link" href="/chmod-calculator">← Full chmod Calculator</a>
</div>

<div class="footer">
  © 2025 <a href="https://siliconbased.dev">siliconbased.dev</a> · A <a href="https://gab.ae">GAB Ventures</a> property
</div>

<script>
var perms = [${p.map(u => `[${u.read},${u.write},${u.execute}]`).join(',')}];

function togglePerm(el) {
  var r = parseInt(el.dataset.row), c = parseInt(el.dataset.col);
  perms[r][c] = !perms[r][c];
  el.className = 'perm-cell ' + (perms[r][c] ? 'perm-on' : 'perm-off');
  var letters = ['r','w','x'];
  el.textContent = (perms[r][c] ? '✓ ' : '— ') + letters[c];
  updateCommand();
}

function updateCommand() {
  var octal = '';
  for (var i = 0; i < 3; i++) {
    var d = (perms[i][0] ? 4 : 0) + (perms[i][1] ? 2 : 0) + (perms[i][2] ? 1 : 0);
    octal += d;
  }
  document.getElementById('liveOctal').textContent = octal;
  document.getElementById('liveOctalR').textContent = octal;
}

function copyCommand() {
  var cmd = 'chmod ' + document.getElementById('liveOctal').textContent + ' ' + document.getElementById('filename').value;
  navigator.clipboard.writeText(cmd);
  var btn = document.getElementById('copyCmd');
  btn.textContent = '✓ Copied';
  btn.classList.add('copied');
  setTimeout(function() { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
}

function copyRecursive() {
  var cmd = 'chmod -R ' + document.getElementById('liveOctalR').textContent + ' ' + document.getElementById('dirname').value;
  navigator.clipboard.writeText(cmd);
  var btn = event.target;
  btn.textContent = '✓ Copied';
  btn.classList.add('copied');
  setTimeout(function() { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
}
</script>
</body>
</html>`;
}

// Generate all pages
let count = 0;
for (const entry of data) {
  const html = generatePage(entry);
  fs.writeFileSync(path.join(outDir, `${entry.octal}.html`), html);
  count++;
}

console.log(`Generated ${count} chmod pages in public/chmod/`);
