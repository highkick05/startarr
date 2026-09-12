const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace handleGridChange
const targetHandleGridChange = `        (items as any[]).forEach(item => {
          if (item.subGrid) {
            if (item.w !== item.subGrid.getColumn()) {
              item.subGrid.column(item.w, 'list');
            }
            if ((item.subGrid as any).updateMinSize) {
              setTimeout(() => {
                 (item.subGrid as any).updateMinSize();
                 // Force a layout refresh for the parent grid so it reflects the snapped height
              }, 150);
            }
          }
        });`;
const newHandleGridChange = `        (items as any[]).forEach(item => {
          if (item.subGrid) {
            let widthChanged = false;
            if (item.w !== item.subGrid.getColumn()) {
              item.subGrid.column(item.w, 'list');
              widthChanged = true;
            }
            if ((item.subGrid as any).updateMinSize) {
              setTimeout(() => {
                 (item.subGrid as any).updateMinSize(widthChanged);
              }, 150);
            }
          }
        });`;
code = code.replace(targetHandleGridChange, newHandleGridChange);

// Replace updateMinSize
const targetUpdateMinSize = `          const updateMinSize = () => {
            if (!subGrid.engine) return;
            const nodes = subGrid.engine.nodes;
            if (nodes.length === 0) {
              grid.update(el, { minW: 1, minH: 6, h: 6 });
            } else {
              let maxBottom = 0;
              nodes.forEach((n: any) => {
                const bottom = (n.y || 0) + (n.h || 1);
                if (bottom > maxBottom) maxBottom = bottom;
              });
              // maxBottom is in inner grid rows. Inner grid cell height is same as outer.
              // So the container needs maxBottom rows, plus maybe 2 rows for padding/title.
              const requiredH = maxBottom + 3;
              const node = el.gridstackNode;
              // Only force 'h' if the container is currently too small. 
              // This allows the container to automatically grow when apps are added or wrapped,
              // but doesn't force it to shrink or jump if the user is resizing it, unless it's too small.
              if (!node || node.h < requiredH) {
                grid.update(el, { minW: 1, minH: requiredH, h: requiredH });
              } else {
                grid.update(el, { minW: 1, minH: requiredH });
              }
            }
          };

          subGrid.on('added removed change', updateMinSize);
          (subGrid as any).updateMinSize = updateMinSize;
          setTimeout(updateMinSize, 50);`;

const newUpdateMinSize = `          const updateMinSize = (forceHug = true) => {
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
          };

          subGrid.on('added removed', () => updateMinSize(true));
          subGrid.on('change', () => updateMinSize(true));
          (subGrid as any).updateMinSize = updateMinSize;
          setTimeout(() => updateMinSize(true), 50);`;

code = code.replace(targetUpdateMinSize, newUpdateMinSize);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched hug logic");
