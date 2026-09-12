const fs = require('fs');
let funcStr = fs.readFileSync('/app/applet/server.ts', 'utf8').match(/function getBetterTitle[\s\S]*?return finalTitle;\n\}/)[0];
funcStr = funcStr.replace("title: string, urlString: string", "title, urlString");
eval(funcStr);

console.log("Empty:", getBetterTitle('', 'https://adgaurd.mailboy.org'));
console.log("Domain:", getBetterTitle('adgaurd.mailboy.org', 'https://adgaurd.mailboy.org'));
console.log("Login:", getBetterTitle('Login', 'https://adgaurd.mailboy.org'));
