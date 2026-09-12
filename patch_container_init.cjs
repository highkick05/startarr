const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  const addContainerToGrid = (title: string) => {
    if (!title.trim() || !gridInstance.current) return;
    const newItem: ShortcutItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'container',
      title: title.trim(),
      url: '#', // unused for containers but required by type
      w: 2, // 2 apps wide
      h: 17, // (8 * 2) + 1 for container title = exactly 2 apps high
      
    };`;
const new1 = `  const addContainerToGrid = (title: string) => {
    if (!title.trim() || !gridInstance.current) return;
    const newItem: ShortcutItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'container',
      title: title.trim(),
      url: '#',
      w: 1, // 1 app wide
      h: 9, // 8 for 1 app + 1 for container title
    };`;
code = code.replace(target1, new1);

const target2 = `            if (nodes.length === 0) {
              const node = el.gridstackNode;
              if (!node || node.h < 4) {
                grid.update(el, { minW: 1, minH: 4, h: 4 });
              } else {
                grid.update(el, { minW: 1, minH: 4 });
              }
            } else {`;
const new2 = `            if (nodes.length === 0) {
              const node = el.gridstackNode;
              const emptyMinH = 9;
              if (!node || node.h < emptyMinH) {
                grid.update(el, { minW: 1, minH: emptyMinH, h: emptyMinH });
              } else {
                if (node.minH !== emptyMinH) {
                  grid.update(el, { minW: 1, minH: emptyMinH });
                }
              }
            } else {`;
code = code.replace(target2, new2);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched container init");
