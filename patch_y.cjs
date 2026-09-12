const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `          subGrid.on('change', (e, items) => {
            if (items) {
              items.forEach(node => {
                if (node.y % 8 !== 0) {
                  const newY = Math.round(node.y / 8) * 8;
                  subGrid.update(node.el, { y: newY });
                }
              });
            }
          });
          subGrid.on('added', (e, items) => {
            if (items) {
              items.forEach(node => {
                if (node.y % 8 !== 0) {
                  const newY = Math.round(node.y / 8) * 8;
                  subGrid.update(node.el, { y: newY });
                }
              });
            }
          });`;

const newCode = `          subGrid.on('change', (e, items) => {
            if (items) {
              items.forEach(node => {
                if (node.y !== undefined && node.y % 8 !== 0) {
                  const newY = Math.round(node.y / 8) * 8;
                  subGrid.update(node.el, { y: newY });
                }
              });
            }
          });
          subGrid.on('added', (e, items) => {
            if (items) {
              items.forEach(node => {
                if (node.y !== undefined && node.y % 8 !== 0) {
                  const newY = Math.round(node.y / 8) * 8;
                  subGrid.update(node.el, { y: newY });
                }
              });
            }
          });`;

code = code.replace(target, newCode);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched Y undef check");
