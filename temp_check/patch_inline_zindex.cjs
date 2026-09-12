const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/style=\{\{ top: contextMenu.y, left: contextMenu.x \}\}/g, 'style={{ top: contextMenu.y, left: contextMenu.x, zIndex: 999999 }}');
fs.writeFileSync('src/App.tsx', code);
