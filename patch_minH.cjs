const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetMinSize = `if (nodes.length === 0) {
              grid.update(el, { minW: 1, h: 6 });
            } else {
              grid.update(el, { minW: 1, sizeToContent: true });
            }`;
const newMinSize = `if (nodes.length === 0) {
              grid.update(el, { minW: 1, minH: 6 });
            } else {
              let maxBottom = 0;
              nodes.forEach((n: any) => {
                const bottom = (n.y || 0) + (n.h || 1);
                if (bottom > maxBottom) maxBottom = bottom;
              });
              // maxBottom is in inner grid rows. Inner grid cell height is same as outer.
              // So the container needs maxBottom rows, plus maybe 2 rows for padding/title.
              const requiredH = maxBottom + 4;
              grid.update(el, { minW: 1, minH: requiredH });
            }`;
code = code.replace(targetMinSize, newMinSize);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched minH");
