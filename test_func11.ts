import fs from 'fs';
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');
let funcStr = code.match(/function getBetterTitle[\s\S]*?return finalTitle;\n\}/)[0];
let dictStr = code.match(/let appDictionary[\s\S]*?NBA'\n\};/)[0];

const fullScript = `
${dictStr}
${funcStr}
console.log("GitHub:", getBetterTitle("GitHub: Let's build from here · GitHub", 'https://github.com/'));
`;
fs.writeFileSync('test_func_exec.ts', fullScript);
