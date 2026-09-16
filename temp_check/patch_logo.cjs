const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Ensure ShipWheel is imported
if (!content.includes('ShipWheel')) {
  content = content.replace(/import \{ /, 'import { ShipWheel, ');
}

const oldHeader = `<div className="flex items-center pointer-events-auto">
            <span className="font-semibold text-lg tracking-tight">startarr</span>
          </div>`;
          
const newHeader = `<div className="flex items-center pointer-events-auto group cursor-default">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mr-2.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 rotate-45 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <ShipWheel size={18} className="text-white drop-shadow-md" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 drop-shadow-sm">startarr</span>
          </div>`;

content = content.replace(oldHeader, newHeader);

// We should also replace it where it says "starterr Settings" if we hadn't already used sed
// Wait, we used sed earlier to replace 'starterr' with 'startarr' everywhere. Let's verify.
fs.writeFileSync('src/App.tsx', content);
