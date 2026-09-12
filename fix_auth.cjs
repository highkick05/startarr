const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');
code = code.replace(/app\.post\("\/api\/scrape-metadata", async \(req: any, res\) => \{/, "app.post(\"/api/scrape-metadata\", requireAuth, async (req: any, res) => {");
fs.writeFileSync('/app/applet/server.ts', code);
