const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /if\s*\(item\.type\s*===\s*'container'\)\s*\{\s*const\s*subGridEl[\s\S]*?\}\s*\}/;

const subGridLogicRevert = `if (item.type === 'container') {
        const subGridEl = el.querySelector('.grid-stack') as HTMLElement;
        if (subGridEl) {
          const subGrid = GridStack.addGrid(subGridEl, {
            cellHeight: getCellHeight(layoutSize),
            margin: 0,
            column: item.w || 4,
            acceptWidgets: true,
            float: false,
            disableResize: true
          });
          
          (subGrid as any)._autoColumn = true;
          
          if (item.children) {
            item.children.forEach(child => addWidgetToGrid(child, subGrid));
          }

          const updateMinSize = () => {
            if (!subGrid.engine) return;
            const nodes = subGrid.engine.nodes;
            if (nodes.length === 0) {
              grid.update(el, { minW: 1, h: 2 });
            } else {
              grid.update(el, { minW: 1, sizeToContent: true });
            }
          };

          subGrid.on('added removed change', updateMinSize);
          (subGrid as any).updateMinSize = updateMinSize;
          setTimeout(updateMinSize, 50);
        }
      }`;

if (regex.test(code)) {
    code = code.replace(regex, subGridLogicRevert);
}

// Restore sizeToContent in opts
const newOpts = `const opts: any = {
      id: item.id,
      w: item.w || 1,
      h: item.h || 1,
      noResize: item.type !== 'container',
    };
    if (item.type === 'container') {
      opts.sizeToContent = true;
    }`;
const badOpts = `const opts: any = {
      id: item.id,
      w: item.w || 1,
      h: item.h || 1,
      noResize: item.type !== 'container',
    };
    // Standard container opts, no forced sizeToContent`;

code = code.replace(badOpts, newOpts);

// Also restore cellHeight propagation
const resizeBlock = `// Subgrids are now handled automatically by ResizeObserver in their makeWidget initialization`;
const originalResizeBlock = `// Also update any subgrids
      gridInstance.current.engine.nodes.forEach(node => {
        if (node.subGrid) {
          node.subGrid.cellHeight(newCellHeight);
        }
      });`;
code = code.replace(resizeBlock, originalResizeBlock);

fs.writeFileSync('src/App.tsx', code);
console.log("Reverted crazy subgrid scaling!");
