const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(`              nodes.forEach((n: any) => {
                const bottom = (n.y || 0) + (n.h || 1);
                if (bottom > maxBottom) maxBottom = bottom;
              });`, `              nodes.forEach((n: any) => {
                const snappedY = Math.round((n.y || 0) / 8) * 8;
                const bottom = snappedY + (n.h || 1);
                if (bottom > maxBottom) maxBottom = bottom;
              });`);
fs.writeFileSync('src/App.tsx', code);
