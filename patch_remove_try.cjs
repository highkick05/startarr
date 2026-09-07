const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /try \{\s*fetch\('\/api\/settings', \{ method: 'PUT', headers: \{ 'Content-Type': 'application\/json' \}, body: JSON\.stringify\(\{ shortcuts_json: JSON\.stringify\(updated\) \}\) \}\);\s*\} catch \(e\) \{\s*console\.error\('Error stringifying updated:', e\.message\);\s*\}/g;
const replacement = `fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) });`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
