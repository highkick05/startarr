const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldFuncStart = `  const addWidgetToGrid = (item: ShortcutItem, targetGrid?: any) => {
    const grid = targetGrid || gridInstance.current;
    if (!grid) return;
    
    const el = document.createElement('div');
    el.className = 'grid-stack-item';
    el.setAttribute('gs-id', item.id);
    el.setAttribute('gs-w', String(item.w || 1));
    el.setAttribute('gs-h', String(item.h || 1));
    if (item.x !== undefined) el.setAttribute('gs-x', String(item.x));
    if (item.y !== undefined) el.setAttribute('gs-y', String(item.y));
    
    
    if (item.type !== 'container') {
      el.setAttribute('gs-no-resize', 'true');
    }

    if (item.type === 'category') {
      el.innerHTML = \``;

const newFuncStart = `  const addWidgetToGrid = (item: ShortcutItem, targetGrid?: any) => {
    const grid = targetGrid || gridInstance.current;
    if (!grid) return;
    
    let htmlContent = '';
    
    if (item.type === 'category') {
      htmlContent = \``;

code = code.replace(oldFuncStart, newFuncStart);

const oldCategoryEnd = `      \`;
    } else if (item.type === 'container') {`;

const newCategoryEnd = `      \`;
    } else if (item.type === 'container') {`;

code = code.replace(oldCategoryEnd, newCategoryEnd);

const oldContainerEnd = `        </div>
      \`;
    } else {`;
const newContainerEnd = `        </div>
      \`;
    } else {`;
code = code.replace(oldContainerEnd, newContainerEnd);

const oldAppEnd = `          <button class="no-drag absolute top-1 right-1 p-1 bg-neutral-900/90 text-neutral-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500 hover:text-white pointer-events-auto" onclick="event.stopPropagation(); window.removeShortcut('${item.id}')" title="Remove app">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      \`;
    }

    // if targetGrid is passed, append to its el, else main
    if (!targetGrid) {
      gridContainerRef.current.appendChild(el);
    } else {
      targetGrid.el.appendChild(el);
    }
    
    const widget = grid.makeWidget(el);`;

const newAppEnd = `          <button class="no-drag absolute top-1 right-1 p-1 bg-neutral-900/90 text-neutral-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500 hover:text-white pointer-events-auto" onclick="event.stopPropagation(); window.removeShortcut('${item.id}')" title="Remove app">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      \`;
    }

    const widgetOptions = {
      id: item.id,
      w: item.w || 1,
      h: item.h || 1,
      noResize: item.type !== 'container',
      content: htmlContent
    };
    if (item.x !== undefined) widgetOptions.x = item.x;
    if (item.y !== undefined) widgetOptions.y = item.y;
    
    const widget = grid.addWidget(widgetOptions);
    const el = widget;`;

code = code.replace(oldAppEnd, newAppEnd);

// Fix el.innerHTML = `...` replacements to htmlContent = `...`
code = code.replace(/el\.innerHTML = `/g, 'htmlContent = `');

fs.writeFileSync('src/App.tsx', code);
