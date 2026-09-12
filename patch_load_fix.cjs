const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetLoad = `h: (p.type === 'app' && p.h < 8) ? 8 : (p.type === 'container' && p.h < 8 ? p.h * 8 : p.h)`;
const newLoad = `h: (p.type === 'app' && p.h < 8) ? 8 : (p.type === 'category' && p.h < 4 ? 4 : (p.type === 'container' && p.h < 8 ? p.h * 8 : p.h))`;
code = code.replace(targetLoad, newLoad);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched load fix!");
