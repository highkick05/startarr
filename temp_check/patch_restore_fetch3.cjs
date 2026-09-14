const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Restore the fetch in updateShortcutDynamically
content = content.replace(
  "      const updated = updateDeep(prev);\n      // fetch removed to prevent race conditions with saveGridState which runs momentarily\n      return updated;",
  "      const updated = updateDeep(prev);\n      fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);\n      return updated;"
);

// Restore the fetch in handleRemove
content = content.replace(
  "            const updated = removeDeep(prev);\n            // fetch removed to prevent race conditions with saveGridState which runs momentarily\n            \n            // Trigger a resize event to ensure layout",
  "            const updated = removeDeep(prev);\n            fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);\n            \n            // Trigger a resize event to ensure layout"
);

// And remove it from the Restore button properly!
const regex = /onClick=\{\(\) => \{\n\s+\/\/ Restore item(.*?)fetch\('\/api\/settings', \{ method: 'PUT', headers: \{ 'Content-Type': 'application\/json' \}, body: JSON.stringify\(\{ shortcuts_json: JSON.stringify\(updated\) \}\) \}\)\.catch\(console\.error\);/s;

content = content.replace(regex, (match, group1) => {
  return `onClick={() => {\n                            // Restore item${group1}// fetch removed to prevent race conditions with saveGridState which runs momentarily`;
});

fs.writeFileSync('src/App.tsx', content);
