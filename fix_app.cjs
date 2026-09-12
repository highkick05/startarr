const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');
code = code.replace(/\.finally\(\(\) => setIsAddingShortcut\(false\)\);\s*\.finally\(\(\) => setIsAddingShortcut\(false\)\);/g, ".finally(() => setIsAddingShortcut(false));");
fs.writeFileSync('/app/applet/src/App.tsx', code);
