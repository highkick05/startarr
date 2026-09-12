const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `sizeToContent: existing.sizeToContent,`;
code = code.replace(target, '');
fs.writeFileSync('src/App.tsx', code);
console.log("Removed sizeToContent from mapping");
