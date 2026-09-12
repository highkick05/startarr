const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetLoad = `setShortcuts(parsed.map((p: any) => ({
              ...p,
              w: p.type === 'app' ? 1 : p.w,
              h: p.type === 'app' ? 1 : p.h
            })));`;
const newLoad = `setShortcuts(parsed.map((p: any) => ({
              ...p,
              w: p.type === 'app' ? 1 : p.w,
              // Multiply h by 8 if it's the old 1x format. 
              // We assume old apps have h:1. Old containers have h:2 or 3.
              // New apps will have h:8.
              h: (p.type === 'app' && p.h < 8) ? 8 : (p.type === 'container' && p.h < 8 ? p.h * 8 : p.h)
            })));`;
code = code.replace(targetLoad, newLoad);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched load!");
