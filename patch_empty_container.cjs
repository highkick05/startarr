const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetMinSize = `if (nodes.length === 0) {
              grid.update(el, { minW: 1, h: 2 });
            } else {`;
const newMinSize = `if (nodes.length === 0) {
              grid.update(el, { minW: 1, h: 6 });
            } else {`;
code = code.replace(targetMinSize, newMinSize);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched empty container h");
