const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');
code = code.replace(/title: await getBetterTitle\('', u\.href\)/g, "title: getBetterTitle('', u.href)");
fs.writeFileSync('/app/applet/server.ts', code);
