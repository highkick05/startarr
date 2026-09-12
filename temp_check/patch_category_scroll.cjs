const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<div className="flex flex-wrap gap-2">',
  '<div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">'
);

fs.writeFileSync('src/App.tsx', code);
