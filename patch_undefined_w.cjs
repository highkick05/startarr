const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetHandleGridChange = `        (items as any[]).forEach(item => {
          if (item.subGrid) {
            let widthChanged = false;
            if (item.w !== item.subGrid.getColumn()) {
              item.subGrid.column(item.w, 'list');
              widthChanged = true;
            }
            if ((item.subGrid as any).updateMinSize) {
              setTimeout(() => {
                 (item.subGrid as any).updateMinSize(widthChanged);
              }, 150);
            }
          }
        });`;

const newHandleGridChange = `        (items as any[]).forEach(item => {
          if (item && item.subGrid) {
            let widthChanged = false;
            if (item.w !== item.subGrid.getColumn()) {
              item.subGrid.column(item.w, 'list');
              widthChanged = true;
            }
            if ((item.subGrid as any).updateMinSize) {
              setTimeout(() => {
                 (item.subGrid as any).updateMinSize(widthChanged);
              }, 150);
            }
          }
        });`;

code = code.replace(targetHandleGridChange, newHandleGridChange);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched undefined w in handleGridChange");
