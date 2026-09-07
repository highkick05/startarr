const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add ContextMenu state
const stateCode = `  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    shortcut: ShortcutItem | null;
  }>({ visible: false, x: 0, y: 0, shortcut: null });

  const [editingShortcut, setEditingShortcut] = useState<ShortcutItem | null>(null);`;

code = code.replace(/const \[isMouseNearBottom, setIsMouseNearBottom\] = useState\(false\);/, 
  `const [isMouseNearBottom, setIsMouseNearBottom] = useState(false);\n${stateCode}`);

// Add ContextMenu renderer and Edit Modal
const modalCode = `
      {/* Context Menu */}
      {contextMenu.visible && contextMenu.shortcut && (
        <div 
          className="fixed z-50 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-2 w-48 animate-in fade-in zoom-in duration-150"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        >
          <div className="px-3 pb-2 mb-2 border-b border-neutral-800/60 flex items-center space-x-2">
             <div className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
               {contextMenu.shortcut.type === 'container' ? (
                 <LayoutGrid size={12} className="text-neutral-400" />
               ) : (
                 <img src={contextMenu.shortcut.iconUrl || \`https://www.google.com/s2/favicons?domain=\${contextMenu.shortcut.url}&sz=64\`} 
                      onError={(e) => { e.currentTarget.src = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(contextMenu.shortcut?.title || 'U')}&background=262626&color=fff&size=64\`; }}
                      className="w-full h-full object-cover" />
               )}
             </div>
             <span className="text-xs font-semibold text-neutral-300 truncate">{contextMenu.shortcut.title || 'Unknown'}</span>
          </div>
          
          <button 
            className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors flex items-center"
            onClick={() => {
              setEditingShortcut(contextMenu.shortcut);
              setContextMenu({ visible: false, x: 0, y: 0, shortcut: null });
            }}
          >
            <Settings size={14} className="mr-2" /> Edit Shortcut
          </button>
          <button 
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center"
            onClick={() => {
              window.removeShortcut(contextMenu.shortcut!.id);
              setContextMenu({ visible: false, x: 0, y: 0, shortcut: null });
            }}
          >
            <Trash2 size={14} className="mr-2" /> Delete
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingShortcut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
              <h2 className="text-lg font-semibold text-neutral-200">Edit {editingShortcut.type === 'container' ? 'Container' : 'Shortcut'}</h2>
              <button onClick={() => setEditingShortcut(null)} className="text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded-lg hover:bg-neutral-800">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 flex flex-col space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-medium text-neutral-400 ml-1">Label Name</label>
                <input 
                  type="text" 
                  value={editingShortcut.title || ''}
                  onChange={e => setEditingShortcut({...editingShortcut, title: e.target.value})}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-600"
                  placeholder="App Name"
                />
              </div>
              
              {editingShortcut.type !== 'container' && (
                <>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-medium text-neutral-400 ml-1">URL</label>
                    <input 
                      type="text" 
                      value={editingShortcut.url || ''}
                      onChange={e => setEditingShortcut({...editingShortcut, url: e.target.value})}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-600"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-medium text-neutral-400 ml-1">Custom Icon URL (Optional)</label>
                    <input 
                      type="text" 
                      value={editingShortcut.iconUrl || ''}
                      onChange={e => setEditingShortcut({...editingShortcut, iconUrl: e.target.value})}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-neutral-600"
                      placeholder="https://.../icon.png"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 flex justify-end space-x-3">
              <button 
                onClick={() => setEditingShortcut(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShortcuts(prev => {
                    const updateDeep = (list: ShortcutItem[]): ShortcutItem[] => {
                      return list.map(item => {
                        if (item.id === editingShortcut.id) {
                          return { ...item, ...editingShortcut };
                        }
                        if (item.children) {
                          return { ...item, children: updateDeep(item.children) };
                        }
                        return item;
                      });
                    };
                    const updated = updateDeep(prev);
                    localStorage.setItem('shortcuts', JSON.stringify(updated));
                    // Force a reload of the grid to reflect new labels
                    setTimeout(() => window.location.reload(), 100);
                    return updated;
                  });
                  setEditingShortcut(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/\{isSettingsOpen && \(/, modalCode + '\n      {isSettingsOpen && (');

// Setup context menu event listener
const windowCtxCode = `
    window.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement;
      const itemEl = target.closest('.grid-stack-item');
      if (itemEl) {
        e.preventDefault();
        const id = itemEl.getAttribute('gs-id');
        if (id) {
          // Find the shortcut
          setShortcuts(prev => {
            const findDeep = (list: ShortcutItem[], searchId: string): ShortcutItem | null => {
               for (const i of list) {
                 if (i.id === searchId) return i;
                 if (i.children) {
                   const found = findDeep(i.children, searchId);
                   if (found) return found;
                 }
               }
               return null;
            };
            const found = findDeep(prev, id);
            if (found && found.type !== 'category') {
              setContextMenu({
                visible: true,
                x: Math.min(e.clientX, window.innerWidth - 200),
                y: Math.min(e.clientY, window.innerHeight - 200),
                shortcut: found
              });
            }
            return prev;
          });
        }
      } else {
        setContextMenu({ visible: false, x: 0, y: 0, shortcut: null });
      }
    });

    window.addEventListener('click', () => {
      setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
    });
`;

code = code.replace(/window\.addEventListener\('resize', debouncedResize\);/, windowCtxCode + `\n    window.addEventListener('resize', debouncedResize);`);

// Update the icon generation and title to not be undefined
code = code.replace(/const fallbackIcon = \`https:\/\/ui-avatars\.com\/api\/\?name=\$\{encodeURIComponent\(item\.title\)\}&background=262626&color=fff&size=128\`\;/, 
  `const fallbackIcon = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(item.title || 'Unknown')}&background=262626&color=fff&size=128\`;`);

code = code.replace(/<span class="font-medium text-neutral-300 px-1 text-center truncate w-full text-xs drop-shadow-sm pb-1">\$\{item\.title\}<\/span>/, 
  `<span class="font-medium text-neutral-300 px-1 text-center truncate w-full text-xs drop-shadow-sm pb-1">\${item.title || 'Unknown'}</span>`);

fs.writeFileSync('src/App.tsx', code);
