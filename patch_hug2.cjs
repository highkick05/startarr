const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetUpdateMinSize = `          const updateMinSize = (forceHug = true) => {
            if (!subGrid.engine) return;
            // Need to make sure the event object from GridStack isn't passed as forceHug
            if (typeof forceHug !== 'boolean') forceHug = true;

            const nodes = subGrid.engine.nodes;
            if (nodes.length === 0) {
              if (forceHug) grid.update(el, { minW: 1, minH: 6, h: 6 });
              else grid.update(el, { minW: 1, minH: 6 });
            } else {
              let maxBottom = 0;
              nodes.forEach((n: any) => {
                const bottom = (n.y || 0) + (n.h || 1);
                if (bottom > maxBottom) maxBottom = bottom;
              });
              const requiredH = maxBottom + 3;
              const node = el.gridstackNode;
              
              if (forceHug || !node || node.h < requiredH) {
                grid.update(el, { minW: 1, minH: requiredH, h: requiredH });
              } else {
                grid.update(el, { minW: 1, minH: requiredH });
              }
            }
          };`;

const newUpdateMinSize = `          const updateMinSize = (forceHug = true) => {
            if (!subGrid.engine) return;
            if (typeof forceHug !== 'boolean') forceHug = true;

            const nodes = subGrid.engine.nodes;
            if (nodes.length === 0) {
              if (forceHug) grid.update(el, { minW: 1, minH: 4, h: 4 });
              else grid.update(el, { minW: 1, minH: 4 });
            } else {
              let maxBottom = 0;
              nodes.forEach((n: any) => {
                const bottom = (n.y || 0) + (n.h || 1);
                if (bottom > maxBottom) maxBottom = bottom;
              });
              // The apps are 8 units high. The container title takes a bit of space.
              // Let's make it hug very tightly by adding exactly 2 units of padding.
              const requiredH = maxBottom + 2;
              const node = el.gridstackNode;
              
              if (forceHug || !node || node.h !== requiredH) {
                grid.update(el, { minW: 1, minH: requiredH, h: requiredH });
              }
            }
          };`;

code = code.replace(targetUpdateMinSize, newUpdateMinSize);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched hug logic again");
