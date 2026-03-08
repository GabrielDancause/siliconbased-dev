function syntaxHighlight(sql) {
  let escaped = sql.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const keywords = ['SELECT', 'FROM'];
  const functions = ['COUNT'];

  // Operators FIRST
  escaped = escaped.replace(/(\+|-|\*|\/|=|&lt;|&gt;|!)/g, '<span class="hl-operator">$1</span>');

  // Numbers
  escaped = escaped.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="hl-number">$1</span>');

  // Keywords
  const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  escaped = escaped.replace(kwRegex, '<span class="hl-keyword">$&</span>');

  // Functions
  const fnRegex = new RegExp(`\\b(${functions.join('|')})\\b(?=\\s*\\()`, 'gi');
  escaped = escaped.replace(fnRegex, '<span class="hl-function">$&</span>');

  return escaped;
}
console.log(syntaxHighlight("SELECT COUNT(id) FROM table WHERE id = 1;"));
