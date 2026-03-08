
const codeInput = document.getElementById('codeInput');
const codeOutput = document.getElementById('codeOutput');
const inputDisplay = document.getElementById('inputDisplay');
const outputDisplay = document.getElementById('outputDisplay');
const inputLineNumbers = document.getElementById('inputLineNumbers');
const outputLineNumbers = document.getElementById('outputLineNumbers');
const errorMsg = document.getElementById('errorMsg');
const errorText = document.getElementById('errorText');
const outputWrap = document.getElementById('outputWrap');
const outputStatus = document.getElementById('outputStatus');
const inputTitle = document.getElementById('inputTitle');

const btnTomlToJson = document.getElementById('btnTomlToJson');
const btnTomlToYaml = document.getElementById('btnTomlToYaml');
const btnJsonToToml = document.getElementById('btnJsonToToml');
const btnYamlToToml = document.getElementById('btnYamlToToml');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');

let currentMode = 'toml-to-json';
let debounceTimer;
let currentValidOutput = '';

function init() {
  codeInput.addEventListener('input', () => {
    syncInputDisplay();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processConversion, 300);
  });

  codeInput.addEventListener('scroll', () => {
    const pre = inputDisplay;
    const lineNums = inputLineNumbers;
    pre.style.transform = `translate(${-codeInput.scrollLeft}px, ${-codeInput.scrollTop}px)`;
    lineNums.style.transform = `translateY(${-codeInput.scrollTop}px)`;
  });

  codeOutput.addEventListener('scroll', () => {
    const pre = outputDisplay;
    const lineNums = outputLineNumbers;
    pre.style.transform = `translate(${-codeOutput.scrollLeft}px, ${-codeOutput.scrollTop}px)`;
    lineNums.style.transform = `translateY(${-codeOutput.scrollTop}px)`;
  });

  btnTomlToJson.addEventListener('click', () => setMode('toml-to-json'));
  btnTomlToYaml.addEventListener('click', () => setMode('toml-to-yaml'));
  btnJsonToToml.addEventListener('click', () => setMode('json-to-toml'));
  btnYamlToToml.addEventListener('click', () => setMode('yaml-to-toml'));

  clearBtn.addEventListener('click', () => {
    codeInput.value = '';
    syncInputDisplay();
    processConversion();
    codeInput.focus();
  });

  copyBtn.addEventListener('click', () => {
    if (!currentValidOutput) return;
    navigator.clipboard.writeText(currentValidOutput).then(() => {
      copyBtn.textContent = '✓ Copied';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.classList.remove('copied');
      }, 1500);
    });
  });

  // Initial Demo Data
  codeInput.value = `[tool]
name = "TOML Converter"
version = "1.0.0"
offline_ready = true

[features]
formats = ["JSON", "YAML", "TOML"]

[settings.theme]
colors = "dark"
`;
  syncInputDisplay();
  processConversion();
}

function setMode(mode) {
  if (currentMode === mode) return;

  if (currentValidOutput) {
    codeInput.value = currentValidOutput;
  }

  currentMode = mode;
  btnTomlToJson.classList.toggle('active', mode === 'toml-to-json');
  btnTomlToYaml.classList.toggle('active', mode === 'toml-to-yaml');
  btnJsonToToml.classList.toggle('active', mode === 'json-to-toml');
  btnYamlToToml.classList.toggle('active', mode === 'yaml-to-toml');

  if (mode === 'toml-to-json') {
    inputTitle.textContent = 'Input (TOML)';
    outputStatus.textContent = 'Output (JSON)';
  } else if (mode === 'toml-to-yaml') {
    inputTitle.textContent = 'Input (TOML)';
    outputStatus.textContent = 'Output (YAML)';
  } else if (mode === 'json-to-toml') {
    inputTitle.textContent = 'Input (JSON)';
    outputStatus.textContent = 'Output (TOML)';
  } else if (mode === 'yaml-to-toml') {
    inputTitle.textContent = 'Input (YAML)';
    outputStatus.textContent = 'Output (TOML)';
  }

  syncInputDisplay();
  processConversion();
}

function syncInputDisplay() {
  const val = codeInput.value;
  let lang = 'toml';
  if (currentMode === 'json-to-toml') lang = 'json';
  if (currentMode === 'yaml-to-toml') lang = 'yaml';

  inputDisplay.innerHTML = highlightSyntax(val, lang);
  updateLineNumbers(val, inputLineNumbers);
}

function processConversion() {
  const raw = codeInput.value;
  if (!raw.trim()) {
    clearOutput();
    return;
  }

  try {
    let parsedObj, outStr;
    if (currentMode === 'toml-to-json' || currentMode === 'toml-to-yaml') {
      parsedObj = smolTOML.parse(raw);
      if (currentMode === 'toml-to-json') {
          outStr = JSON.stringify(parsedObj, null, 2);
      } else {
          outStr = MinimalYAML.stringify(parsedObj);
      }
    } else if (currentMode === 'json-to-toml') {
      parsedObj = JSON.parse(raw);
      outStr = smolTOML.stringify(parsedObj);
    } else if (currentMode === 'yaml-to-toml') {
      parsedObj = MinimalYAML.parse(raw);
      outStr = smolTOML.stringify(parsedObj);
    }
    showSuccess(outStr);
  } catch (err) {
    showError(err.message, raw);
  }
}

function clearOutput() {
  codeOutput.value = '';
  outputDisplay.innerHTML = '';
  updateLineNumbers('', outputLineNumbers);
  errorMsg.style.display = 'none';
  outputWrap.classList.remove('error-state');
  outputStatus.style.color = '#ccc';
  currentValidOutput = '';
}

function showSuccess(outStr) {
  errorMsg.style.display = 'none';
  outputWrap.classList.remove('error-state');

  let outLang = 'toml';
  if (currentMode === 'toml-to-json') {
    outputStatus.textContent = '✓ Valid JSON';
    outLang = 'json';
  } else if (currentMode === 'toml-to-yaml') {
    outputStatus.textContent = '✓ Valid YAML';
    outLang = 'yaml';
  } else {
    outputStatus.textContent = '✓ Valid TOML';
  }
  outputStatus.style.color = '#4ade80';

  currentValidOutput = outStr;
  codeOutput.value = outStr;

  updateLineNumbers(outStr, outputLineNumbers);
  outputDisplay.innerHTML = highlightSyntax(outStr, outLang);
}

function showError(msg, raw) {
  errorMsg.style.display = 'flex';
  outputWrap.classList.add('error-state');

  let inLang = 'TOML';
  if (currentMode === 'json-to-toml') inLang = 'JSON';
  if (currentMode === 'yaml-to-toml') inLang = 'YAML';

  outputStatus.textContent = `Invalid ${inLang}`;
  outputStatus.style.color = '#f87171';

  let enhancedMsg = msg;
  if (currentMode === 'json-to-toml' && msg.includes('position')) {
    const match = msg.match(/position (\d+)/);
    if (match && !msg.toLowerCase().includes('line')) {
      const pos = parseInt(match[1], 10);
      const textUpToPos = raw.substring(0, pos);
      const lines = textUpToPos.split('\n');
      const lineNum = lines.length;
      const colNum = lines[lines.length - 1].length + 1;
      enhancedMsg = `${msg} (Line ${lineNum}, Column ${colNum})`;
    }
  }

  errorText.textContent = enhancedMsg;
  codeOutput.value = '';
  outputDisplay.innerHTML = '';
  updateLineNumbers('', outputLineNumbers);
  currentValidOutput = '';
}

function updateLineNumbers(text, container) {
  const linesCount = text.split('\n').length || 1;
  let linesHtml = '';
  for (let i = 1; i <= linesCount; i++) {
    linesHtml += i + '<br>';
  }
  container.innerHTML = linesHtml || '1';
}

function highlightSyntax(text, lang) {
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (lang === 'json') {
    return text.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'hl-num';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) cls = 'hl-key';
        else cls = 'hl-str';
      } else if (/true|false/.test(match)) cls = 'hl-bool';
      else if (/null/.test(match)) cls = 'hl-null';
      return `<span class="${cls}">${match}</span>`;
    });
  } else if (lang === 'yaml') {
    const lines = text.split('\n');
    return lines.map(line => {
      const commentIdx = line.indexOf('#');
      if (commentIdx !== -1) {
        const before = line.substring(0, commentIdx);
        const comment = line.substring(commentIdx);
        return highlightYamlLine(before) + `<span class="hl-comment">${comment}</span>`;
      }
      return highlightYamlLine(line);
    }).join('\n');
  } else if (lang === 'toml') {
     const lines = text.split('\n');
     return lines.map(line => {
       const commentIdx = line.indexOf('#');
       let before = line;
       let comment = '';
       if (commentIdx !== -1) {
          // crude check to ignore '#' inside quotes
          const quoteCount = (line.substring(0, commentIdx).match(/"/g) || []).length;
          const singleQuoteCount = (line.substring(0, commentIdx).match(/'/g) || []).length;
          if (quoteCount % 2 === 0 && singleQuoteCount % 2 === 0) {
              before = line.substring(0, commentIdx);
              comment = `<span class="hl-comment">${line.substring(commentIdx)}</span>`;
          }
       }

       let highlighted = before;
       // highlight headers
       if (highlighted.trim().startsWith('[')) {
           highlighted = highlighted.replace(/^(\s*)(\[.*?\])/, '$1<span class="hl-key">$2</span>');
       } else {
           // keys
           highlighted = highlighted.replace(/^(\s*)([A-Za-z0-9_-]+)(\s*=)/, '$1<span class="hl-key">$2</span>$3');
           // strings
           highlighted = highlighted.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span class="hl-str">$&</span>');
           // booleans
           highlighted = highlighted.replace(/\b(true|false)\b/g, '<span class="hl-bool">$1</span>');
           // numbers
           highlighted = highlighted.replace(/\b(-?\d+(?:\.\d+)?)\b/g, '<span class="hl-num">$1</span>');
       }

       return highlighted + comment;
     }).join('\n');
  }
  return text;
}

function highlightYamlLine(line) {
  const colonIdx = line.indexOf(':');
  if (colonIdx !== -1) {
    const isArrayItem = line.trim().startsWith('-');
    if (!isArrayItem || line.indexOf(': ') !== -1) {
       const key = line.substring(0, colonIdx);
       const val = line.substring(colonIdx + 1);
       return `<span class="hl-key">${key}</span>:` + highlightYamlValue(val);
    }
  }
  if (line.trim().startsWith('- ')) {
     return `<span class="hl-default">- </span>` + highlightYamlValue(line.substring(line.indexOf('- ') + 2));
  }
  return highlightYamlValue(line);
}

function highlightYamlValue(val) {
  if (!val.trim()) return val;
  const t = val.trim();
  let cls = 'hl-default';
  if (t === 'true' || t === 'false') cls = 'hl-bool';
  else if (t === 'null' || t === '~') cls = 'hl-null';
  else if (/^-?\d+(\.\d+)?$/.test(t)) cls = 'hl-num';
  else if (t.startsWith('"') || t.startsWith("'")) cls = 'hl-str';
  return val.replace(t, `<span class="${cls}">${t}</span>`);
}

init();
