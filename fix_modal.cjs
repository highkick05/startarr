const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\/\* Context Menu \*\/\}.*?\{isSettingsOpen && \(/s;
const newMenu = `{/* Context Menu */}
      {contextMenu.visible && contextMenu.shortcut && (
        <div 
          className="fixed z-50 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-3 w-64 animate-in fade-in zoom-in duration-150 flex flex-col"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(prev => ({ ...prev, visible: false }))}
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
                onChange={e => setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, title: e.target.value } }))}
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
                    onChange={e => setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, url: e.target.value } }))}
                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Icon URL</label>
                  <input 
                    type="text" 
                    value={contextMenu.shortcut.iconUrl || ''}
                    onChange={e => setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, iconUrl: e.target.value } }))}
                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="px-2 pt-2 border-t border-neutral-800 flex justify-between">
            <button 
              className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md transition-colors flex items-center"
              onClick={() => {
                const id = contextMenu.shortcut!.id;
                setShortcuts(prev => {
                  const removeDeep = (list: ShortcutItem[]): ShortcutItem[] => {
                    return list.filter(i => i.id !== id).map(i => {
                      if (i.children) return { ...i, children: removeDeep(i.children) };
                      return i;
                    });
                  };
                  const updated = removeDeep(prev);
                  localStorage.setItem('shortcuts', JSON.stringify(updated));
                  setTimeout(() => window.location.reload(), 50);
                  return updated;
                });
                setContextMenu({ visible: false, x: 0, y: 0, shortcut: null });
              }}
            >
              <Trash2 size={12} className="mr-1.5" /> Delete
            </button>
            <button 
              className="px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 rounded-md transition-colors"
              onClick={() => {
                setShortcuts(prev => {
                  const updateDeep = (list: ShortcutItem[]): ShortcutItem[] => {
                    return list.map(item => {
                      if (item.id === contextMenu.shortcut!.id) {
                        return { ...item, ...contextMenu.shortcut };
                      }
                      if (item.children) {
                        return { ...item, children: updateDeep(item.children) };
                      }
                      return item;
                    });
                  };
                  const updated = updateDeep(prev);
                  localStorage.setItem('shortcuts', JSON.stringify(updated));
                  setTimeout(() => window.location.reload(), 100);
                  return updated;
                });
                setContextMenu({ visible: false, x: 0, y: 0, shortcut: null });
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {isSettingsOpen && (`;

if (!regex.test(code)) {
    console.error("Not found");
    process.exit(1);
}
code = code.replace(regex, newMenu);
fs.writeFileSync('src/App.tsx', code);
