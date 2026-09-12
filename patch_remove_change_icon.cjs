const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

const target = `            <button
              className="w-full text-left px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors flex items-center mt-1 border-t border-neutral-700 pt-1.5"
              onClick={() => {
                const shortcut = contextMenu.shortcut!;
                setIconSelectorModal({ visible: true, shortcut });
                setContextMenu({ visible: false, x: 0, y: 0, shortcut: null });
              }}
            >
              <ImageIcon size={12} className="mr-1.5" /> Change Icon
            </button>`;

if (code.includes(target)) {
   code = code.replace(target, '');
   fs.writeFileSync('/app/applet/src/App.tsx', code);
   console.log("Removed Change Icon button");
} else {
   console.log("Could not find Change Icon button code");
}
