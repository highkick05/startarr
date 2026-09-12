const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `margin: 2,`;
const newTarget = `margin: 4,`;
code = code.replace(target, newTarget);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched margin");
