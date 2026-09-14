const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '<img src="https://cdn2.iconfinder.com/data/icons/mac-os-x-1/256/Trash_Empty.png"',
  '<img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Wastebasket/3D/wastebasket_3d.png"'
);

fs.writeFileSync('src/App.tsx', content);
