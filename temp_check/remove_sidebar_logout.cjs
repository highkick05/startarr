const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<div className="flex items-center gap-3"><h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings size={20} className="text-neutral-400" />
            startarr Settings
          </h2><button onClick={logout} className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors">Logout</button></div>`;

const replacement = `<h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings size={20} className="text-neutral-400" />
            startarr Settings
          </h2>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
