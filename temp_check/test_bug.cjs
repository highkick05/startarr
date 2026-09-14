const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

// find the exact fetch statement in updateShortcutDynamically
const regex = /updateShortcutDynamically =.*?fetch\('\/api\/settings'/s;
if (regex.test(content)) {
  console.log("fetch is present in updateShortcutDynamically");
} else {
  console.log("fetch is MISSING in updateShortcutDynamically!");
}

