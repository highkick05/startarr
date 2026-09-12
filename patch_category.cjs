const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  const addContainerToGrid = (title: string) => {
    if (!title.trim() || !gridInstance.current) return;
    const newItem: ShortcutItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'container',
      title: title.trim(),
      url: '#', // unused for containers but required by type
      w: Math.max(4, Math.floor(currentCols.current / 2)),
      h: 6,
      
    };`;

const newTarget = `  const addContainerToGrid = (title: string) => {
    if (!title.trim() || !gridInstance.current) return;
    const newItem: ShortcutItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'container',
      title: title.trim(),
      url: '#', // unused for containers but required by type
      w: 2, // 2 apps wide
      h: 17, // (8 * 2) + 1 for container title = exactly 2 apps high
      
    };`;

code = code.replace(target, newTarget);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched category size");
