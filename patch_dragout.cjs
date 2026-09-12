const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `          const subGrid = GridStack.addGrid(subGridEl, {
            disableOneColumnMode: true,
            cellHeight: getCellHeight(layoutSize),
            margin: 0,
            column: item.w || 4,
            acceptWidgets: true,
            float: false,
            disableResize: true
          });`;
const new1 = `          const subGrid = GridStack.addGrid(subGridEl, {
            disableOneColumnMode: true,
            cellHeight: getCellHeight(layoutSize),
            margin: 0,
            column: item.w || 4,
            acceptWidgets: true,
            dragOut: true,
            float: false,
            disableResize: true
          });`;

code = code.replace(target1, new1);

const target2 = `              if (forceHug || !node || node.h !== requiredH) {
                grid.update(el, { minW: 1, minH: requiredH, h: requiredH });
              }`;
const new2 = `              if (forceHug || !node || node.h < requiredH) {
                grid.update(el, { minW: 1, minH: requiredH, h: requiredH });
              } else {
                grid.update(el, { minW: 1, minH: requiredH });
              }`;
code = code.replace(target2, new2);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched dragOut and resize");
