const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/removeTimeout: 100/g, 'removeTimeout: 0');

fs.writeFileSync('src/App.tsx', content);
