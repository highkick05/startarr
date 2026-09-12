const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /item\.subGrid\.column\(item\.w, 'move'\);/g,
  "item.subGrid.column(item.w, 'list');"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched column layout");
