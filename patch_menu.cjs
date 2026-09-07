const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexModal = /\{\/\* Context Menu \*\/\}.*?\{isSettingsOpen && \(/s;
const newMenu = `{/* Context Menu */}
      {contextMenu.visible && contextMenu.shortcut && (
        <div 
          className="fixed z-50 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-3 w-64 animate-in fade-in zoom-in duration-150 flex flex-col"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(prev => ({ ...prev, visible: false }))}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 pb-3 mb-3 border-b border-neutral-800 flex items-center space-x-3">
             <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
               {contextMenu.shortcut.type === 'container' ? (
                 <LayoutGrid size={16} className="text-neutral-400" />
               ) : (
                 <img src={contextMenu.shortcut.iconUrl || \`https://www.google.com/s2/favicons?domain=\${contextMenu.shortcut.url}&sz=64\`} 
                      onError={(e) => { e.currentTarget.src = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(contextMenu.shortcut?.title || 'U')}&background=262626&color=fff&size=64\`; }}
                      className="w-full h-full object-cover" />
               )}
             </div>
             <span className="text-sm font-semibold text-neutral-200 truncate">{contextMenu.shortcut.title || 'Unknown'}</span>
          </div>
          
          <div className="px-4 flex flex-col space-y-3 mb-3">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Label</label>
              <input 
                type="text" 
                value={contextMenu.shortcut.title || ''}
                onChange={e => {
                  const newVal = e.target.value;
                  setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, title: newVal } }));
                  updateShortcutDynamically(contextMenu.shortcut!.id, { title: newVal });
                }}
                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            {contextMenu.shortcut.type !== 'container' && (
              <>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">URL</label>
                  <input 
                    type="text" 
                    value={contextMenu.shortcut.url || ''}
                    onChange={e => {
                      const newVal = e.target.value;
                      setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, url: newVal } }));
                      updateShortcutDynamically(contextMenu.shortcut!.id, { url: newVal });
                    }}
                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Icon URL</label>
                  <input 
                    type="text" 
                    value={contextMenu.shortcut.iconUrl || ''}
                    onChange={e => {
                      const newVal = e.target.value;
                      setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, iconUrl: newVal } }));
                      updateShortcutDynamically(contextMenu.shortcut!.id, { iconUrl: newVal });
                    }}
                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="px-4 pt-2 border-t border-neutral-800">
            <button 
              className="w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md transition-colors flex items-center justify-center border border-red-500/20"
              onClick={() => {
                const id = contextMenu.shortcut!.id;
                window.removeShortcut(id);
                setContextMenu({ visible: false, x: 0, y: 0, shortcut: null });
              }}
            >
              <Trash2 size={12} className="mr-1.5" /> Delete
            </button>
          </div>
        </div>
      )}

      {isSettingsOpen && (`;

if (!regexModal.test(code)) {
    console.error('regex did not match');
    process.exit(1);
}
code = code.replace(regexModal, newMenu);

const updateDynamically = `  const updateShortcutDynamically = (id: string, updates: Partial<ShortcutItem>) => {
    // 1. Update React state and localStorage
    setShortcuts(prev => {
      const updateDeep = (list: ShortcutItem[]): ShortcutItem[] => {
        return list.map(item => {
          if (item.id === id) {
            return { ...item, ...updates };
          }
          if (item.children) {
            return { ...item, children: updateDeep(item.children) };
          }
          return item;
        });
      };
      const updated = updateDeep(prev);
      localStorage.setItem('shortcuts', JSON.stringify(updated));
      return updated;
    });
    
    // 2. Update the registry
    const existing = itemRegistry.current.get(id);
    if (existing) {
       itemRegistry.current.set(id, { ...existing, ...updates });
    }

    // 3. Update the DOM element
    const el = document.querySelector(\`[gs-id="\${id}"]\`);
    if (el) {
       const item = { ...existing, ...updates } as ShortcutItem;
       // Since it's an app, it has title and icon.
       const titleEl = el.querySelector('span.font-medium');
       if (titleEl && updates.title !== undefined) {
         titleEl.textContent = updates.title || 'Unknown';
       }
       const imgEl = el.querySelector('img');
       if (imgEl) {
          const domain = (() => { try { return new URL(item.url).hostname; } catch { return ''; } })();
          const fallbackIcon = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(item.title || 'Unknown')}&background=262626&color=fff&size=128\`;
          const googleIcon = domain ? \`https://www.google.com/s2/favicons?domain=\${domain}&sz=128\` : fallbackIcon;
          
          if (updates.iconUrl !== undefined || updates.url !== undefined || updates.title !== undefined) {
             imgEl.src = item.iconUrl || googleIcon;
             imgEl.setAttribute('onerror', \`if(this.dataset.fallback === '1') { this.onerror=null; this.src='\${fallbackIcon}'; } else { this.dataset.fallback='1'; this.src='\${googleIcon}'; }\`);
             imgEl.dataset.fallback = '0';
          }
       }
       
       // Handle category titles
       const h2El = el.querySelector('h2');
       if (h2El && updates.title !== undefined) {
           h2El.textContent = updates.title || 'Unknown';
       }
       
       // Handle container titles
       const h3El = el.querySelector('h3');
       if (h3El && updates.title !== undefined) {
           h3El.textContent = updates.title || 'Unknown';
       }
       
       // Handle onclick URL
       const contentEl = el.querySelector('.grid-stack-item-content');
       if (contentEl && item.type === 'app' && updates.url !== undefined) {
          contentEl.setAttribute('onclick', \`if(!this.parentElement.classList.contains('ui-draggable-dragging') && !this.parentElement.classList.contains('grid-stack-item-dragging')) window.open('\${updates.url}', '_blank')\`);
       }
    }
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);`;

code = code.replace(/const \[isSettingsOpen, setIsSettingsOpen\] = useState\(false\);/, updateDynamically);

fs.writeFileSync('src/App.tsx', code);
