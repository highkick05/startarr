const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

const regex = /\{\/\^\(https\?:\\\\\/\\\\\/\\)\?\(\[a-z0-9-\]\+\\\\\.\)\+\[a-z\]\{2,\}\(\\\\\/.\*\)\?\$\/i\.test\(searchQuery\) && \([\s\S]*?\{filteredApps\.length > 0 \? \(/;

if (regex.test(code)) {
  code = code.replace(regex, "{filteredApps.length > 0 ? (");
  fs.writeFileSync('/app/applet/src/App.tsx', code);
  console.log("Removed custom URL dropdown button successfully");
} else {
  console.log("Could not find regex match");
}
