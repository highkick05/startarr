const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetMinSize = `grid.update(el, { minW: 1, minH: requiredH });`;
const newMinSize = `grid.update(el, { minW: 1, minH: requiredH, h: requiredH });`;
code = code.replace(targetMinSize, newMinSize);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched h");
