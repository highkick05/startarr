const fs = require('fs');
let code = fs.readFileSync('src/db.ts', 'utf8');

code = code.replace(/\\}\\n  \\/\\/ add helper methods/g, '}\n  // add helper methods');

fs.writeFileSync('src/db.ts', code);
console.log("Fixed newline syntax error");
