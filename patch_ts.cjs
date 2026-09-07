const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/item\.subGrid\.updateMinSize/g, '(item.subGrid as any).updateMinSize');
code = code.replace(/subGrid\.updateMinSize/g, '(subGrid as any).updateMinSize');

fs.writeFileSync('src/App.tsx', code);
