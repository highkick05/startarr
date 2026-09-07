const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `const subGrid = GridStack.addGrid(subGridEl, {
            cellHeight: getCellHeight(layoutSize),
            margin: 2,
            column: item.w || 4,
            acceptWidgets: true,
            float: true,
            disableResize: true
          });`,
  `const subGrid = GridStack.addGrid(subGridEl, {
            cellHeight: getCellHeight(layoutSize),
            margin: 2,
            column: item.w || 4,
            acceptWidgets: true,
            float: false,
            disableResize: true
          });`
);

fs.writeFileSync('src/App.tsx', code);
