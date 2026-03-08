function syntaxHighlight(sql) {
  let escaped = sql.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const keywords = ['SELECT', 'FROM'];

  // Numbers
  escaped = escaped.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="hl-number">$1</span>');

  // Keywords
  const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  escaped = escaped.replace(kwRegex, '<span class="hl-keyword">$&</span>');

  // Operators (done last, excluding HTML tags)
  escaped = escaped.replace(/(\+|-|\*|\/|=|&lt;|&gt;|!)(?![^<]*>)/g, '<span class="hl-operator">$1</span>');

  return escaped;
}
console.log(syntaxHighlight("SELECT id FROM table WHERE id = 1"));
