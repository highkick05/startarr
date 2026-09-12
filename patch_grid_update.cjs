const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Change grid.update to not force 'h' unless we actually need to shrink/grow it
// Actually, GridStack might have a bug where grid.update() without x, y, w causes issues.
// Let's pass the existing node's x, y, w explicitly?
// Or maybe let's just update minH and let auto-sizing happen? 
// No, GridStack doesn't auto-size containers down.

code = code.replace(
    /grid\.update\(el, \{ minW: 1, minH: requiredH, h: requiredH \}\);/g,
    `const node = el.gridstackNode;
              grid.update(el, { minW: 1, minH: requiredH, h: Math.max(node ? node.h : requiredH, requiredH) });`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched grid.update");
