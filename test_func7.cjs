const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

let funcStr = code.match(/function getBetterTitle[\s\S]*?return finalTitle;\n\}/)[0];
funcStr = funcStr.replace("title: string, urlString: string", "title, urlString");

let dictStr = code.match(/let appDictionary[\s\S]*?fetch\('https:\/\/raw\.githubusercontent\.com\/homarr-labs\/dashboard-icons\/main\/tree\.json'\)[\s\S]*?\.catch\(err => console\.error\("Failed to fetch online dictionary", err\)\);/)[0];
dictStr = dictStr.replace(/Record<string, string>/, "any");
dictStr = dictStr.replace(/\(icon: string\)/, "(icon)");

eval(dictStr + "\n" + funcStr + "\n" + `
setTimeout(() => {
    console.log("Empty:", getBetterTitle('', 'https://adgaurd.mailboy.org'));
    console.log("Domain:", getBetterTitle('adgaurd.mailboy.org', 'https://adgaurd.mailboy.org'));
    console.log("Login:", getBetterTitle('Login', 'https://adgaurd.mailboy.org'));
}, 2000);
`);
