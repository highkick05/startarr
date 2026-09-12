const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldSubgrid = `const subGrid = GridStack.addGrid(subGridEl, {
            cellHeight: 'auto',
            margin: 0,
            column: item.w || 4,
            acceptWidgets: true,
            float: false,
            disableResize: true
          });`;

const newSubgrid = `const subGrid = GridStack.addGrid(subGridEl, {
            cellHeight: getCellHeight(layoutSize),
            margin: 0,
            column: item.w || 4,
            acceptWidgets: true,
            float: false,
            disableResize: true
          });`;

code = code.replace(oldSubgrid, newSubgrid);

const oldUpdateMinSize = `              // Force container to match inner maxH directly!
              grid.update(el, { minW: 1, h: maxH });`;

const newUpdateMinSize = `              const ch = getCellHeight(layoutSize);
              // Calculate exact height needed for header (32px) + icons (ch) + labels (20px) + padding
              const headerPx = 36;
              const innerContentPx = maxH * ch;
              const totalPx = headerPx + innerContentPx;
              
              // We need to figure out how many outer grid rows this represents
              const neededH = Math.ceil(totalPx / ch);
              
              grid.update(el, { minW: 1, h: neededH });`;

code = code.replace(oldUpdateMinSize, newUpdateMinSize);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched container height calculation");
