const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `const parsed = JSON.parse(settings.shortcuts_json);
          if (parsed && parsed.length > 0) {
            setShortcuts(parsed.map((p: any) => ({
              ...p,
              w: p.type === 'app' ? 1 : p.w,`;
const new1 = `const parsed = JSON.parse(settings.shortcuts_json);
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            setShortcuts(parsed.filter((p: any) => !!p).map((p: any) => ({
              ...p,
              w: p?.type === 'app' ? 1 : p?.w,`;

const target2 = `const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          return parsed.map((p: any) => ({
            ...p,
            w: p.type === 'app' ? 1 : p.w,
            h: p.type === 'app' ? 1 : p.h
          }));`;
const new2 = `const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((p: any) => !!p).map((p: any) => ({
            ...p,
            w: p?.type === 'app' ? 1 : p?.w,
            h: p?.type === 'app' ? 1 : p?.h
          }));`;

code = code.replace(target1, new1);
code = code.replace(target2, new2);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched parsed maps");
