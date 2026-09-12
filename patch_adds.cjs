const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetAddApp = `const newItem: ShortcutItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'app',
      title: app.title,
      url: app.url,
      w: 1,
      h: 1,
    };`;
const newAddApp = `const newItem: ShortcutItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'app',
      title: app.title,
      url: app.url,
      w: 1,
      h: 8,
    };`;
code = code.replace(targetAddApp, newAddApp);

const targetAddContainer = `const newItem: ShortcutItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'container',
      title: title.trim(),
      url: '#', // unused for containers but required by type
      w: Math.max(4, Math.floor(currentCols.current / 2)),
      h: 3,
      
    };`;
const newAddContainer = `const newItem: ShortcutItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'container',
      title: title.trim(),
      url: '#', // unused for containers but required by type
      w: Math.max(4, Math.floor(currentCols.current / 2)),
      h: 14,
      
    };`;
code = code.replace(targetAddContainer, newAddContainer);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched adds!");
