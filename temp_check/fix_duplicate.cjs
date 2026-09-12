const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  "setTimeout(() => { allowSave.current = true; }, 2000);\n    setTimeout(() => { allowSave.current = true; }, 2000);",
  "setTimeout(() => { allowSave.current = true; }, 2000);"
);
fs.writeFileSync('src/App.tsx', code);
