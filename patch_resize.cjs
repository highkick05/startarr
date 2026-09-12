const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const badBlock = `// Also update any subgrids
      gridInstance.current.engine.nodes.forEach(node => {
        if (node.subGrid) {
          node.subGrid.cellHeight(newCellHeight);
        }
      });`;

code = code.replace(badBlock, `// Subgrids are now handled automatically by ResizeObserver in their makeWidget initialization`);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched resize handler");
