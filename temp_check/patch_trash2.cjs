const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '<img src="https://img.icons8.com/color/144/empty-trash.png"',
  '<img src="https://cdn2.iconfinder.com/data/icons/mac-os-x-1/256/Trash_Empty.png"'
);

fs.writeFileSync('src/App.tsx', content);
