const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

const regex = /<button class="no-drag absolute top-1 right-1 p-1 bg-neutral-900\/90 text-neutral-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500 hover:text-white pointer-events-auto" onclick="event\.stopPropagation\(\); window\.removeShortcut\('\$\{item\.id\}'\)" title="Remove app">[\s\S]*?<\/button>/g;

if (regex.test(code)) {
  code = code.replace(regex, '');
  fs.writeFileSync('/app/applet/src/App.tsx', code);
  console.log("Removed cross button successfully");
} else {
  console.log("Could not find regex match");
}
