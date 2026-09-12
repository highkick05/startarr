const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldUpdateMinSize = `              const ch = getCellHeight(layoutSize);
              // Calculate exact height needed for header (32px) + icons (ch) + labels (20px) + padding
              const headerPx = 36;
              const innerContentPx = maxH * ch;
              const totalPx = headerPx + innerContentPx;
              
              // We need to figure out how many outer grid rows this represents
              const neededH = Math.ceil(totalPx / ch);
              
              grid.update(el, { minW: 1, h: neededH });`;

const newUpdateMinSize = `              grid.update(el, { minW: 1, sizeToContent: true });`;

code = code.replace(oldUpdateMinSize, newUpdateMinSize);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched sizeToContent in updateMinSize");
