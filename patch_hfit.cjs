const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace('!h-fit !bottom-auto !overflow-visible', '');
fs.writeFileSync('src/App.tsx', code);
console.log("Fixed h-fit");
