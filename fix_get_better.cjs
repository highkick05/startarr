const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

const oldLogic = `    if (!finalTitle || genericTitles.includes(lowerTitle) || finalTitle.includes('://')) {`;
const newLogic = `    const isDomain = /^([a-z0-9-]+\\.)+[a-z]{2,}$/i.test(finalTitle);
    if (!finalTitle || genericTitles.includes(lowerTitle) || finalTitle.includes('://') || isDomain) {`;

code = code.replace(oldLogic, newLogic);
code = code.replace(/title: await getBetterTitle\(u\.hostname, u\.href\)/, "title: await getBetterTitle('', u.href)");

fs.writeFileSync('/app/applet/server.ts', code);
console.log("Patched server.ts heuristic trigger conditions");
