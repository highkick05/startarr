const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetMinSize = `const requiredH = maxBottom + 4;
              const node = el.gridstackNode;
              grid.update(el, { minW: 1, minH: requiredH, h: Math.max(node ? node.h : requiredH, requiredH) });`;

const newMinSize = `const requiredH = maxBottom + 3;
              const node = el.gridstackNode;
              // Only force 'h' if the container is currently too small. 
              // This allows the container to automatically grow when apps are added or wrapped,
              // but doesn't force it to shrink or jump if the user is resizing it, unless it's too small.
              if (!node || node.h < requiredH) {
                grid.update(el, { minW: 1, minH: requiredH, h: requiredH });
              } else {
                grid.update(el, { minW: 1, minH: requiredH });
              }`;
code = code.replace(targetMinSize, newMinSize);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched dynamic height");
