const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

const target = `                </div>
              </>
            )}
          </div>
          
          <div className="px-4 pt-2 border-t border-neutral-800">
            <button `;

const replacement = `                </div>
                
                {(() => {
                  let domain = '';
                  try {
                    domain = new URL(contextMenu.shortcut.url).hostname;
                  } catch(e) {}
                  if (!domain) return null;
                  
                  const quickIcons = [
                    \`https://icon.horse/icon/\${domain}\`,
                    \`https://logo.clearbit.com/\${domain}\`,
                    \`https://icons.duckduckgo.com/ip3/\${domain}.ico\`,
                    \`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://\${domain}&size=128\`
                  ];
                  
                  return (
                    <div className="flex flex-col space-y-1 mt-3">
                       <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Quick Icons</label>
                       <div className="flex gap-2">
                          {quickIcons.map((ico, idx) => (
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
                  );
                })()}
              </>
            )}
          </div>
          
          <div className="px-4 pt-2 border-t border-neutral-800">
            <button `;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('/app/applet/src/App.tsx', code);
    console.log("Patched context menu successfully");
} else {
    console.log("Could not find target in App.tsx (take 2)");
}
