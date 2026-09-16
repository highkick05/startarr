const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
if (!content.includes('favicon.svg')) {
  content = content.replace(
    '<title>startarr</title>',
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n    <title>startarr</title>'
  );
  fs.writeFileSync('index.html', content);
}
