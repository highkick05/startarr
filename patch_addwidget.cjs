const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const addWidgetToGrid = \(item: ShortcutItem, targetGrid\?: any\) => \{[\s\S]*?const widget = grid\.makeWidget\(el, \{ x: item\.x, y: item\.y, w: item\.w \|\| 1, h: item\.h \|\| 1, noResize: item\.type !== 'container' \}\);/m;

const replacement = `const addWidgetToGrid = (item: ShortcutItem, targetGrid?: any) => {
    const grid = targetGrid || gridInstance.current;
    if (!grid) return;
    
    let htmlContent = '';
    if (item.type === 'category') {
      htmlContent = \`
        <div class="grid-stack-item-content relative group flex flex-col justify-end pb-2 border-b-2 border-neutral-800/60 hover:border-neutral-600 transition-colors cursor-grab active:cursor-grabbing">
          <h2 class="text-xl font-bold text-neutral-300 px-2 tracking-wide pointer-events-none">\${item.title}</h2>
          <button class="no-drag absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500" onclick="window.removeShortcut('\${item.id}')" title="Remove category">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      \`;
    } else if (item.type === 'container') {
      htmlContent = \`
        <div class="grid-stack-item-content relative group bg-neutral-900 border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col p-2">
          <div class="flex justify-between items-center px-2 pb-2 border-b border-neutral-800/50 mb-2 pointer-events-none">
            <h3 class="font-semibold text-neutral-300 text-sm">\${item.title}</h3>
            <button class="no-drag pointer-events-auto absolute top-2 right-2 p-1 bg-neutral-800 text-neutral-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500 hover:text-white" onclick="window.removeShortcut('\${item.id}')" title="Remove container">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <div class="grid-stack flex-1"></div>
        </div>
      \`;
    } else {
      const domain = (() => { try { return new URL(item.url).hostname; } catch { return ''; } })();
      const iconUrl = item.iconUrl || getFaviconUrl(item.url);
      const fallbackIcon = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(item.title || 'Unknown')}&background=262626&color=fff&size=128\`;
      const googleIcon = domain ? \`https://www.google.com/s2/favicons?domain=\${domain}&sz=128\` : fallbackIcon;

      htmlContent = \`
        <div class="grid-stack-item-content relative group flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-300 hover:scale-105 hover:bg-neutral-800/30 rounded-2xl"
             onclick="if(!this.parentElement.classList.contains('ui-draggable-dragging') && !this.parentElement.classList.contains('grid-stack-item-dragging')) window.open('\${item.url}', '_blank')">

          <div class="pointer-events-none w-full h-full flex flex-col items-center justify-center pt-2">
            <div class="flex-1 w-full min-h-0 flex items-center justify-center mb-1">
              <img src="\${iconUrl}" onerror="if(this.dataset.fallback === '1') { this.onerror=null; this.src='\${fallbackIcon}'; } else { this.dataset.fallback='1'; this.src='\${googleIcon}'; }" alt="\${item.title}" draggable="false" style="max-width: 100%; max-height: 100%; aspect-ratio: 1/1;" class="object-contain drop-shadow-md hover:drop-shadow-xl transition-all rounded-2xl" />
            </div>
            <span class="text-xs font-medium text-neutral-300 truncate w-full text-center px-1 pb-2 tracking-wide drop-shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
              \${item.title}
            </span>
          </div>

          <button class="no-drag absolute top-1 right-1 p-1 bg-neutral-900/90 text-neutral-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500 hover:text-white pointer-events-auto" onclick="event.stopPropagation(); window.removeShortcut('\${item.id}')" title="Remove app">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      \`;
    }

    const opts: any = {
      id: item.id,
      w: item.w || 1,
      h: item.h || 1,
      noResize: item.type !== 'container',
      content: htmlContent
    };
    if (item.x !== undefined) opts.x = item.x;
    if (item.y !== undefined) opts.y = item.y;

    const el = grid.addWidget(opts);`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', code);
