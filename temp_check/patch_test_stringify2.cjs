const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /fetch\('\/api\/settings', \{ method: 'PUT', headers: \{ 'Content-Type': 'application\/json' \}, body: JSON\.stringify\(\{ shortcuts_json: JSON\.stringify\(updated\) \}\) \}\);/g;
const replacement = `try {
        fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) });
      } catch (e) {
        console.error('Error stringifying updated:', e.message);
      }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
