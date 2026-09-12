const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetUpdateMinSize = `            if (nodes.length === 0) {
              const node = el.gridstackNode;
              const emptyMinH = 10;
              if (!node || node.h < emptyMinH) {
                grid.update(el, { minW: 1, minH: emptyMinH, h: emptyMinH });
              } else {
                if (node.minH !== emptyMinH) {
                  grid.update(el, { minW: 1, minH: emptyMinH });
                }
              }
            } else {
              let maxBottom = 0;
              nodes.forEach((n: any) => {
                const snappedY = Math.round((n.y || 0) / 8) * 8;
                const bottom = snappedY + (n.h || 1);
                if (bottom > maxBottom) maxBottom = bottom;
              });
              const requiredH = maxBottom + 2;
              const node = el.gridstackNode;
              
              // NEVER force 'h' down. Only force it UP if it's too small.
              if (!node || node.h < requiredH) {
                grid.update(el, { minW: 1, minH: requiredH, h: requiredH });
              } else {
                // If we don't need to change the height, only update minH if it changed, 
                // to avoid triggering unnecessary grid reflows/changes.
                if (node.minH !== requiredH) {
                  grid.update(el, { minW: 1, minH: requiredH });
                }
              }
            }`;

const newUpdateMinSize = `            if (nodes.length === 0) {
              const node = el.gridstackNode;
              const emptyMinH = 10;
              if (!node || node.h !== emptyMinH || node.minH !== emptyMinH) {
                grid.update(el, { minW: 1, minH: emptyMinH, h: emptyMinH });
              }
            } else {
              let maxBottom = 0;
              nodes.forEach((n: any) => {
                const snappedY = Math.round((n.y || 0) / 8) * 8;
                const bottom = snappedY + (n.h || 1);
                if (bottom > maxBottom) maxBottom = bottom;
              });
              const requiredH = maxBottom + 2;
              const node = el.gridstackNode;
              
              if (!node || node.h !== requiredH || node.minH !== requiredH) {
                grid.update(el, { minW: 1, minH: requiredH, h: requiredH });
              }
            }`;

code = code.replace(targetUpdateMinSize, newUpdateMinSize);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched grid height lock");
