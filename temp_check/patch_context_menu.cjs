const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add showQuickIcons to contextMenu state
content = content.replace(
  `}>( { visible: false, x: 0, y: 0, shortcut: null } );`,
  `  showQuickIcons?: boolean;\n}>({ visible: false, x: 0, y: 0, shortcut: null, showQuickIcons: false });`
);
// Some cases might have spaces differently
content = content.replace(
  `}>({ visible: false, x: 0, y: 0, shortcut: null });`,
  `  showQuickIcons?: boolean;\n}>({ visible: false, x: 0, y: 0, shortcut: null, showQuickIcons: false });`
);

// Where contextMenu is opened
content = content.replace(
  `setContextMenu({\n                visible: true,\n                x: Math.min(e.clientX, window.innerWidth - 200),\n                y: Math.min(e.clientY, window.innerHeight - 200),\n                shortcut: found\n              });`,
  `setContextMenu({\n                visible: true,\n                x: Math.min(e.clientX, window.innerWidth - 200),\n                y: Math.min(e.clientY, window.innerHeight - 200),\n                shortcut: found,\n                showQuickIcons: false\n              });`
);

// In the JSX, replace the Quick Icons section
const oldQuickIconsJSX = `return (
                    <div className="flex flex-col space-y-1 mt-3">
                       <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Quick Icons</label>
                       <div className="flex gap-2">
                          {uniqueQuickIcons.map((ico, idx) => (
                             <button 
                                key={idx}
                                onClick={() => {
                                   updateShortcutDynamically(contextMenu.shortcut!.id, { iconUrl: ico });
                                   setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, iconUrl: ico } }));
                                }}
                                className="w-8 h-8 rounded-lg bg-neutral-950/50 border border-neutral-800 hover:border-blue-500/50 overflow-hidden flex items-center justify-center transition-all p-1"
                             >
                                <img src={ico} className="w-full h-full object-contain rounded" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.style.display = 'none'; }} />
                             </button>
                          ))}
                       </div>
                    </div>
                  );`;

const newQuickIconsJSX = `return (
                    <div className="flex flex-col space-y-1 mt-3">
                       <div className="flex items-center justify-between mb-0.5">
                         <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Quick Icons</label>
                         {!contextMenu.showQuickIcons && (
                           <button 
                             onClick={() => setContextMenu(prev => ({ ...prev, showQuickIcons: true }))}
                             className="text-[9px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded transition-colors"
                           >
                             Find Icons
                           </button>
                         )}
                       </div>
                       
                       {contextMenu.showQuickIcons && (
                         <div className="flex gap-2 flex-wrap">
                            {uniqueQuickIcons.map((ico, idx) => (
                               <button 
                                  key={idx}
                                  onClick={() => {
                                     updateShortcutDynamically(contextMenu.shortcut!.id, { iconUrl: ico });
                                     setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, iconUrl: ico } }));
                                  }}
                                  className="w-8 h-8 rounded-lg bg-neutral-950/50 border border-neutral-800 hover:border-blue-500/50 overflow-hidden flex items-center justify-center transition-all p-1 shrink-0 mb-1"
                               >
                                  <img src={ico} className="w-full h-full object-contain rounded" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.style.display = 'none'; }} />
                               </button>
                            ))}
                         </div>
                       )}
                    </div>
                  );`;
                  
content = content.replace(oldQuickIconsJSX, newQuickIconsJSX);
fs.writeFileSync('src/App.tsx', content);
