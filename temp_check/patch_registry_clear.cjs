const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'itemRegistry.current.clear();\n      refreshRegistry(updated);',
  '// itemRegistry.current.clear(); removed to preserve detached items for the recycle bin\n      refreshRegistry(updated);'
);

fs.writeFileSync('src/App.tsx', content);
