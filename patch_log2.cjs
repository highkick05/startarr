const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const items = gridInstance.current.save() as any[];",
  "const items = gridInstance.current.save() as any[]; console.log('SAVE GRID ITEMS:', items);"
);

fs.writeFileSync('src/App.tsx', code);
