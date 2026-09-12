const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');
code = code.replace(".catch(err => console.error(\"Failed to add custom shortcut\", err))", ".catch(err => console.error(\"Failed to add custom shortcut\", err)).finally(() => setIsAddingShortcut(false));"); // clean up if double
code = code.replace(/fetch\('\/api\/scrape-metadata'/g, "console.log('Fetching scrape metadata for', formattedUrl); fetch('/api/scrape-metadata'");
code = code.replace(/\.then\(data => \{/g, ".then(data => { console.log('Scraped data:', data);");
fs.writeFileSync('/app/applet/src/App.tsx', code);
