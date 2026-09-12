const fs = require('fs');
let code = fs.readFileSync('src/db.ts', 'utf8');

code = code.replace(
  'layout_size TEXT,',
  'layout_size TEXT,\n      shortcuts_json TEXT,'
);

fs.writeFileSync('src/db.ts', code);
