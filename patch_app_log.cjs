const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "isInitializing.current = false;",
  "isInitializing.current = false; console.log('INIT DONE, grid save:', gridInstance.current.save());"
);

code = code.replace(
  "gridInstance.current.on('change', handleGridChange);",
  "gridInstance.current.on('change', (e, items) => { console.log('CHANGE FIRED', items); handleGridChange(e, items); });"
);

fs.writeFileSync('src/App.tsx', code);
