const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

const target = `<button class="no-drag absolute top-1 right-1 p-1 bg-neutral-900/90 text-neutral-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500 hover:text-white pointer-events-auto" onclick="event.stopPropagation(); window.removeShortcut('\\$\\{item.id\\}')" title="Remove app">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>`;

if (code.includes(target)) {
  code = code.replace(target, '');
  fs.writeFileSync('/app/applet/src/App.tsx', code);
  console.log("Removed cross button successfully");
} else {
  console.log("Could not find exact button string");
}
