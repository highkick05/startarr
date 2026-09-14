const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);",
  "// fetch removed to prevent race conditions with saveGridState which runs momentarily"
);

fs.writeFileSync('src/App.tsx', content);
