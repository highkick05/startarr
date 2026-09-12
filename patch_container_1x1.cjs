const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Patch container init size
const target1 = `      w: 1, // 1 app wide
      h: 9, // 8 for 1 app + 1 for container title`;
const new1 = `      w: 1, // 1 app wide
      h: 10, // 8 for 1 app + 2 for container title`;
code = code.replace(target1, new1);

// Patch emptyMinH
const target2 = `const emptyMinH = 9;`;
const new2 = `const emptyMinH = 10;`;
code = code.replace(target2, new2);

// Patch requiredH
const target3 = `const requiredH = maxBottom + 1;`;
const new3 = `const requiredH = maxBottom + 2;`;
code = code.replace(target3, new3);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched 1x1 init height to 10");
