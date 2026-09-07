const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/console\.log\('INIT SHORTCUTS:', shortcuts\); /g, '');
code = code.replace(/console\.log\('CHANGE FIRED', items\); /g, '');
code = code.replace(/console\.log\('SAVE GRID ITEMS:', items\);/g, '');

fs.writeFileSync('src/App.tsx', code);
