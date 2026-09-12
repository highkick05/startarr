const fs = require('fs');
eval(fs.readFileSync('/app/applet/server.ts', 'utf8').match(/function getBetterTitle[\s\S]*?return finalTitle;\n\}/)[0]);

console.log("Empty:", getBetterTitle('', 'https://adgaurd.mailboy.org'));
console.log("Domain:", getBetterTitle('adgaurd.mailboy.org', 'https://adgaurd.mailboy.org'));
console.log("Login:", getBetterTitle('Login', 'https://adgaurd.mailboy.org'));
