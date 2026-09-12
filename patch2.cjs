const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                })()}
              </>
            )}
          </div>
          
          <div className="px-4 pt-2 border-t border-neutral-800">`;

const replacement = `                })()}
                
                <div className="flex flex-col space-y-2 mt-3 border-t border-neutral-800/50 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Invert Color</label>
                    <button 
                      onClick={() => {
                        const newVal = !contextMenu.shortcut.invertIcon;
                        updateShortcutDynamically(contextMenu.shortcut!.id, { invertIcon: newVal });
                        setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, invertIcon: newVal } }));
                      }}
                      className={\`w-8 h-4 rounded-full transition-colors relative \${contextMenu.shortcut.invertIcon ? 'bg-blue-500' : 'bg-neutral-700'}\`}
                    >
                      <div className={\`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform \${contextMenu.shortcut.invertIcon ? 'left-4.5 right-0.5' : 'left-0.5'}\`} style={{ transform: contextMenu.shortcut.invertIcon ? 'translateX(14px)' : 'translateX(0)' }} />
                    </button>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Icon Background</label>
                    <div className="flex gap-2">
                      {(['transparent', 'white', 'black'] as const).map(bg => (
                        <button
                          key={bg}
                          onClick={() => {
                            updateShortcutDynamically(contextMenu.shortcut!.id, { iconBackground: bg });
                            setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, iconBackground: bg } }));
                          }}
                          className={\`flex-1 py-1.5 text-[10px] rounded-md capitalize transition-colors border \${contextMenu.shortcut.iconBackground === bg || (!contextMenu.shortcut.iconBackground && bg === 'transparent') ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'}\`}
                        >
                          {bg === 'transparent' ? 'None' : bg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </>
            )}
          </div>
          
          <div className="px-4 pt-2 border-t border-neutral-800">`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("App.tsx patched successfully");
} else {
  console.log("target string not found");
}
