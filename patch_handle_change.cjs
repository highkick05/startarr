const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /if \(item\.subGrid && item\.w !== item\.subGrid\.getColumn\(\)\) \{\s*item\.subGrid\.column\(item\.w, 'move'\);\s*if \(item\.subGrid\.updateMinSize\) \{\s*setTimeout\(item\.subGrid\.updateMinSize, 150\);\s*\}\s*\}/,
  `if (item.subGrid) {
            if (item.w !== item.subGrid.getColumn()) {
              item.subGrid.column(item.w, 'move');
            }
            if (item.subGrid.updateMinSize) {
              setTimeout(item.subGrid.updateMinSize, 150);
            }
          }`
);

fs.writeFileSync('src/App.tsx', code);
