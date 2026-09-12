const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetHandleGridChange = `            if ((item.subGrid as any).updateMinSize) {
              setTimeout(() => {
                 (item.subGrid as any).updateMinSize(widthChanged);
              }, 150);
            }`;
const newHandleGridChange = `            if ((item.subGrid as any).updateMinSize) {
              setTimeout(() => {
                 (item.subGrid as any).updateMinSize();
              }, 150);
            }`;
code = code.replace(targetHandleGridChange, newHandleGridChange);

const targetUpdateMinSize = `          const updateMinSize = (forceHug = true) => {
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
              // We set requiredH to maxBottom + 1 so it wraps tightly around the apps without extra bottom padding.
              const requiredH = maxBottom + 1;
              const node = el.gridstackNode;
              
              // NEVER force 'h' unless the user's current 'h' is smaller than our required minimum.
              // This strictly respects the user's manual resizing, while preventing them from shrinking
              // it so much that it visually clips the apps inside.
              if (!node || node.h < requiredH) {
                grid.update(el, { minW: 1, minH: requiredH, h: requiredH });
              } else {
                grid.update(el, { minW: 1, minH: requiredH });
              }
            }
          };

          subGrid.on('added removed', () => updateMinSize(true));
          subGrid.on('change', () => updateMinSize(true));`;

const newUpdateMinSize = `          const updateMinSize = () => {
            if (!subGrid.engine) return;

            const nodes = subGrid.engine.nodes;
            if (nodes.length === 0) {
              const node = el.gridstackNode;
              if (!node || node.h < 4) {
                grid.update(el, { minW: 1, minH: 4, h: 4 });
              } else {
                grid.update(el, { minW: 1, minH: 4 });
              }
            } else {
              let maxBottom = 0;
              nodes.forEach((n: any) => {
                const bottom = (n.y || 0) + (n.h || 1);
                if (bottom > maxBottom) maxBottom = bottom;
              });
              const requiredH = maxBottom + 1;
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
            }
          };

          subGrid.on('added removed', () => updateMinSize());
          subGrid.on('change', () => updateMinSize());`;

code = code.replace(targetUpdateMinSize, newUpdateMinSize);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched no shrink");
