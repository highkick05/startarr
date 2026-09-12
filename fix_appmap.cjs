const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

code = code.replace(/const appMap: Record<string, string> = \{/, "const appMap: any = {");

fs.writeFileSync('/app/applet/server.ts', code);
