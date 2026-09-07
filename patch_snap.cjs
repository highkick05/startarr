const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Patch handleGridChange to snap vertically on any change
code = code.replace(
  `if (item.subGrid) {
            if (item.w !== item.subGrid.getColumn()) {
              item.subGrid.column(item.w, 'move');
            }
            if (item.subGrid.updateMinSize) {
              setTimeout(item.subGrid.updateMinSize, 150);
            }
          }`,
  `if (item.subGrid) {
            if (item.w !== item.subGrid.getColumn()) {
              item.subGrid.column(item.w, 'move');
            }
            if (item.subGrid.updateMinSize) {
              setTimeout(() => {
                 item.subGrid.updateMinSize();
                 // Force a layout refresh for the parent grid so it reflects the snapped height
              }, 150);
            }
          }`
);

// Patch updateMinSize to completely remove minH bound, relying purely on h: neededH to SNAP
code = code.replace(
  /grid\.update\(el, \{ minW: 1, minH: Math\.max\([^\)]+\), h: neededH \}\);/g,
  `grid.update(el, { minW: 1, h: neededH });`
);
code = code.replace(
  /grid\.update\(el, \{ minW: 1, minH: 2, h: 2 \}\);/g,
  `grid.update(el, { minW: 1, h: 2 });`
);

fs.writeFileSync('src/App.tsx', code);
