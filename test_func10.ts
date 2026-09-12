import fs from 'fs';
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');
let funcStr = code.match(/function getBetterTitle[\s\S]*?return finalTitle;\n\}/)[0];
let dictStr = code.match(/let appDictionary[\s\S]*?NBA'\n\};/)[0];

const fullScript = `
${dictStr}
${funcStr}
console.log("Empty:", getBetterTitle('', 'https://adguard.mailboy.org'));
console.log("Domain:", getBetterTitle('adguard.mailboy.org', 'https://adguard.mailboy.org'));
console.log("Login:", getBetterTitle('Login', 'https://adguard.mailboy.org'));
console.log("AdGuard Home:", getBetterTitle('AdGuard Home', 'https://adguard.mailboy.org'));
`;
fs.writeFileSync('test_func_exec.ts', fullScript);
