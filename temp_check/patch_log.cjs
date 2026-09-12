const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "shortcuts.forEach(item => addWidgetToGrid(item));",
  "console.log('INIT SHORTCUTS:', shortcuts); shortcuts.forEach(item => addWidgetToGrid(item));"
);

fs.writeFileSync('src/App.tsx', code);
