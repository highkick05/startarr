const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "const handleRemovedEvent = (e: any, items: any[]) => {",
  "const handleRemovedEvent = (e: any, items: any[]) => {\n      console.log('REMOVED EVENT:', items.map(n => ({ id: n.id || n.el?.getAttribute('gs-id'), inDOM: document.body.contains(n.el) })));"
);

fs.writeFileSync('src/App.tsx', content);
