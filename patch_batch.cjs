const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "shortcuts.forEach(item => addWidgetToGrid(item));",
  "gridInstance.current.batchUpdate(); shortcuts.forEach(item => addWidgetToGrid(item)); gridInstance.current.commit();"
);

fs.writeFileSync('src/App.tsx', code);
