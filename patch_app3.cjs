const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldToggle = /<button[\s\S]*?onClick=\{\(e\) => \{[\s\S]*?className=\{`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0[^`]*`\}[\s\S]*?>\s*<div className=\{`w-4 h-4 rounded-full bg-white transition-transform shadow-sm[^`]*`\} \/>\s*<\/button>/;

const newToggle = `<div 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const newVal = !contextMenu.shortcut.invertIcon;
                        updateShortcutDynamically(contextMenu.shortcut!.id, { invertIcon: newVal });
                        setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, invertIcon: newVal } }));
                      }}
                      className={\`cursor-pointer w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 min-w-[40px] \${contextMenu.shortcut.invertIcon ? 'bg-blue-500' : 'bg-neutral-700'}\`}
                    >
                      <div className={\`w-4 h-4 rounded-full bg-white transition-transform shadow-sm \${contextMenu.shortcut.invertIcon ? 'translate-x-5' : 'translate-x-0'}\`} />
                    </div>`;

if (oldToggle.test(code)) {
  code = code.replace(oldToggle, newToggle);
  console.log("Patched toggle to div");
} else {
  console.log("Toggle regex not found.");
}

fs.writeFileSync('src/App.tsx', code);
