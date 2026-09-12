const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldSubgrid = `const subGrid = GridStack.addGrid(subGridEl, {
            cellHeight: getCellHeight(layoutSize),
            margin: 0,
            column: item.w || 4,
            acceptWidgets: true,
            float: false,
            disableResize: true
          });`;

const newSubgrid = `const subGrid = GridStack.addGrid(subGridEl, {
            cellHeight: 'auto',
            margin: 0,
            column: item.w || 4,
            acceptWidgets: true,
            float: false,
            disableResize: true
          });`;

code = code.replace(oldSubgrid, newSubgrid);

// Now we must ensure updateMinSize doesn't force neededH = maxH + Math.ceil...
const oldUpdateMinSize = `              const ch = getCellHeight(layoutSize);
              // Use sizeToContent so it adapts to exactly its DOM pixel height instead of row multiples!
              grid.update(el, { minW: 1, sizeToContent: true });`;

const newUpdateMinSize = `              // Force container to match inner maxH directly!
              grid.update(el, { minW: 1, h: maxH });`;

code = code.replace(oldUpdateMinSize, newUpdateMinSize);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched auto height");
