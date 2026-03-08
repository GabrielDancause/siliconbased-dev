import fs from 'fs';
const html = fs.readFileSync('public/url-encoder.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

if (scriptMatch) {
  const code = scriptMatch[1];
  try {
    // Just syntax checking
    new Function(code);
    console.log("JavaScript syntax is valid.");
  } catch (e) {
    console.error("Syntax Error:", e);
  }
}
