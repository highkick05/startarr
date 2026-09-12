const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldUpdateMinSize = `              const headerPx = 56; // 8px top pad + 8px bot pad + 36px header + buffer
              const neededH = maxH + Math.ceil(headerPx / ch);
              
              
              
              grid.update(el, { minW: 1, h: neededH });`;

const newUpdateMinSize = `              // Use sizeToContent so it adapts to exactly its DOM pixel height instead of row multiples!
              grid.update(el, { minW: 1, sizeToContent: true });`;

code = code.replace(oldUpdateMinSize, newUpdateMinSize);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched sizeToContent");
