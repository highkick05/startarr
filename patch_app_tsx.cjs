const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix the syntax error in the modal button
code = code.replace(
  /const res = await console\.log\('Fetching scrape metadata for', formattedUrl\); fetch\('\/api\/scrape-metadata'/g,
  "const res = await fetch('/api/scrape-metadata'"
);

// 2. Add credentials to all fetch calls
code = code.replace(
  /fetch\('\/api\/scrape-metadata', \{\n\s*method: 'POST',\n\s*headers: \{ 'Content-Type': 'application\/json' \},\n\s*body: JSON\.stringify\(\{ url: /g,
  "fetch('/api/scrape-metadata', {\n          method: 'POST',\n          credentials: 'include',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify({ url: "
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx");
