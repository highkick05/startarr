const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the localStorage logic
const oldLocalStr = `          return parsed.map((p: any) => ({
            ...p,
            w: p.type === 'category' ? p.w : 1,
            h: p.type === 'category' ? p.h : 1,
            ...(p.type !== 'category' && p.w !== 1 ? { x: undefined, y: undefined } : {})
          }));`;
const newLocalStr = `          return parsed.map((p: any) => ({
            ...p,
            w: p.type === 'app' ? 1 : p.w,
            h: p.type === 'app' ? 1 : p.h
          }));`;
code = code.replace(oldLocalStr, newLocalStr);

// Replace the fetch API logic
const oldFetchStr = `            setShortcuts(parsed.map((p: any) => ({
              ...p,
              w: p.type === 'category' ? p.w : 1,
              h: p.type === 'category' ? p.h : 1
            })));`;
const newFetchStr = `            setShortcuts(parsed.map((p: any) => ({
              ...p,
              w: p.type === 'app' ? 1 : p.w,
              h: p.type === 'app' ? 1 : p.h
            })));
            // Also need to re-render grid since API loaded!`;
code = code.replace(oldFetchStr, newFetchStr);

fs.writeFileSync('src/App.tsx', code);
