const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "gridInstance.current.batchUpdate(); shortcuts.forEach(item => addWidgetToGrid(item)); gridInstance.current.commit();",
  "shortcuts.forEach(item => addWidgetToGrid(item));"
);

fs.writeFileSync('src/App.tsx', code);
