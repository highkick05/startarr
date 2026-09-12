const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');
code = code.replace(
  /res\.json\(\{ title: title \|\| baseUrl\.hostname, icons: \[\.\.\.new Set\(resolvedIcons\)\] \}\);/g,
  "res.json({ title: getBetterTitle(title || '', baseUrl.href), icons: [...new Set(resolvedIcons)] });"
);
fs.writeFileSync('/app/applet/server.ts', code);
console.log("Patched success block");
