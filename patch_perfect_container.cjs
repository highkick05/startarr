const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix the container HTML (remove !h-fit !bottom-auto)
const badContainer = `<div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col pt-1 pb-1 px-1 !h-fit !bottom-auto">`;
const goodContainer = `<div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col pt-1 pb-1 px-1">`;
if (code.includes(badContainer)) {
    code = code.replace(badContainer, goodContainer);
} else {
    // try pb-2
    const badContainer2 = `<div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col pt-1 pb-2 px-1 !h-fit !bottom-auto">`;
    code = code.replace(badContainer2, goodContainer);
}

// 2. Remove opts.sizeToContent = true
const badOpts = `if (item.type === 'container') {
      opts.sizeToContent = true;
    }`;
code = code.replace(badOpts, `// Standard container opts, no forced sizeToContent`);

// 3. Rewrite the subGrid logic
const subGridLogicOld = `if (item.type === 'container') {
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
          
          subGrid.on('change', () => {
            if ((subGrid as any).updateMinSize) {
              (subGrid as any).updateMinSize();
            }
            saveGridState();
          });
          subGrid.on('added', () => {
            if ((subGrid as any).updateMinSize) {
              (subGrid as any).updateMinSize();
            }
            saveGridState();
          });
          subGrid.on('removed', () => {
            if ((subGrid as any).updateMinSize) {
              (subGrid as any).updateMinSize();
            }
            saveGridState();
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
              const maxW = Math.max(...nodes.map(n => (n.x || 0) + (n.w || 1)));
              const maxH = Math.max(...nodes.map(n => (n.y || 0) + (n.h || 1)));
              
              // Tell GridStack to exactly match the DOM height of the !h-fit container
              grid.update(el, { minW: 1, sizeToContent: true });
              
            }
          };

          subGrid.on('added removed change', updateMinSize);
          (subGrid as any).updateMinSize = updateMinSize;
          setTimeout(updateMinSize, 50);
        }
      }`;

const subGridLogicNew = `if (item.type === 'container') {
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

          const updateInnerHeight = () => {
            if (!subGrid.engine) return;
            const contentEl = el.querySelector('.grid-stack-item-content');
            if (!contentEl) return;
            
            const elHeight = contentEl.getBoundingClientRect().height;
            const headerEl = contentEl.querySelector('div.flex.justify-between');
            const headerPx = headerEl ? headerEl.getBoundingClientRect().height : 32;
            const paddingPx = 8; // Buffer for container pb-1 pt-1
            
            const availableHeight = elHeight - headerPx - paddingPx;
            const nodes = subGrid.engine.nodes;
            const maxH = nodes.length > 0 ? Math.max(1, ...nodes.map(n => (n.y || 0) + (n.h || 1))) : 1;
            
            const newInnerCellHeight = Math.max(20, Math.floor(availableHeight / maxH));
            subGrid.cellHeight(newInnerCellHeight);
          };

          // Update inner cell height whenever the container DOM size changes
          const ro = new ResizeObserver(() => updateInnerHeight());
          const contentEl = el.querySelector('.grid-stack-item-content');
          if (contentEl) {
              ro.observe(contentEl);
          }

          // Handle item changes
          const handleInnerChange = () => {
             updateInnerHeight();
             saveGridState();
          };

          subGrid.on('added', handleInnerChange);
          subGrid.on('removed', handleInnerChange);
          subGrid.on('change', handleInnerChange);

          setTimeout(updateInnerHeight, 50);
        }
      }`;

if (code.includes(subGridLogicOld)) {
    code = code.replace(subGridLogicOld, subGridLogicNew);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Successfully replaced subgrid logic!");
} else {
    console.log("Could not find the exact old block, attempting targeted regex replacement...");
    const regex = /if\s*\(item\.type\s*===\s*'container'\)\s*\{\s*const\s*subGridEl[\s\S]*?\}\s*\}/;
    if (regex.test(code)) {
        code = code.replace(regex, subGridLogicNew);
        fs.writeFileSync('src/App.tsx', code);
        console.log("Successfully replaced via regex!");
    } else {
        console.log("Failed to find block via regex.");
    }
}
