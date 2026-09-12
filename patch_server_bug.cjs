const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

// Fix pushIcon -> icons.add
code = code.replace(/pushIcon\(match\[1\]\);/g, "icons.add(match[1]);");

// Fix icons.map -> Array.from(icons).map
code = code.replace(/const resolvedIcons = icons\.map\(/g, "const resolvedIcons = Array.from(icons).map(");

fs.writeFileSync('/app/applet/server.ts', code);
console.log("Patched server bugs");
