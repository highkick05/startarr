const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /gridInstance\.current = GridStack\.init\({/,
  "gridInstance.current = GridStack.init({\n      disableOneColumnMode: true,"
);

code = code.replace(
  /const subGrid = GridStack\.addGrid\(subGridEl, {/,
  "const subGrid = GridStack.addGrid(subGridEl, {\n            disableOneColumnMode: true,"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched disableOneColumnMode");
