const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetUpdateMinSize = `              // The apps are 8 units high. The container title takes a bit of space.
              // Let's make it hug very tightly by adding exactly 2 units of padding.
              const requiredH = maxBottom + 2;
              const node = el.gridstackNode;
              
              if (forceHug || !node || node.h < requiredH) {
                grid.update(el, { minW: 1, minH: requiredH, h: requiredH });
              } else {
                grid.update(el, { minW: 1, minH: requiredH });
              }`;

const newUpdateMinSize = `              // We set requiredH to maxBottom + 1 so it wraps tightly around the apps without extra bottom padding.
              const requiredH = maxBottom + 1;
              const node = el.gridstackNode;
              
              // NEVER force 'h' unless the user's current 'h' is smaller than our required minimum.
              // This strictly respects the user's manual resizing, while preventing them from shrinking
              // it so much that it visually clips the apps inside.
              if (!node || node.h < requiredH) {
                grid.update(el, { minW: 1, minH: requiredH, h: requiredH });
              } else {
                grid.update(el, { minW: 1, minH: requiredH });
              }`;

code = code.replace(targetUpdateMinSize, newUpdateMinSize);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched to preserve manual height");
